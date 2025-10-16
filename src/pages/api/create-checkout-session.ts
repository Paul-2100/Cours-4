import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { stripe, PRICE_IN_CENTS } from '@/lib/stripe';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, validateServerEnv } from '@/lib/env';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getSupabaseAdmin() {
  validateServerEnv();
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

async function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err: Error | null, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }

    const token = authHeader.substring(7);
    
    // Vérifier l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ User verification error:', userError);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    console.log('✅ User authenticated:', user.id);

    // Parser le formulaire
    const { fields, files } = await parseForm(req);
    
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile || !prompt) {
      return res.status(400).json({ error: 'Image et prompt requis' });
    }

    // Upload de l'image d'entrée sur Supabase
    const fileBuffer = fs.readFileSync(imageFile.filepath);
    const fileName = `${user.id}/${Date.now()}-${imageFile.originalFilename || 'image.jpg'}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('input-image')
      .upload(fileName, fileBuffer, {
        contentType: imageFile.mimetype || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('input-image')
      .getPublicUrl(uploadData.path);

    console.log('✅ Image uploaded:', publicUrl);

    // Créer le projet dans la base de données avec payment_status='pending'
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        prompt,
        input_image_url: publicUrl,
        status: 'pending_payment',
        payment_status: 'pending',
        payment_amount: 2.00,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('❌ Project creation error:', projectError);
      return res.status(500).json({ error: 'Erreur lors de la création du projet' });
    }

    console.log('✅ Project created:', project.id);

    // Préparer les URLs (retirer /dashboard si déjà présent)
    const baseUrl = process.env.NEXT_PUBLIC_URL?.replace(/\/dashboard$/, '') || 'http://localhost:3001';
    const successUrl = `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard?canceled=true`;
    
    console.log('🔗 Success URL:', successUrl);
    console.log('🔗 Cancel URL:', cancelUrl);

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Génération d\'image IA',
              description: `Transformation: ${prompt.substring(0, 100)}...`,
            },
            unit_amount: PRICE_IN_CENTS, // 2.00 EUR
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        project_id: project.id,
        user_id: user.id,
      },
    });

    // Mettre à jour le projet avec le session ID
    await supabase
      .from('projects')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', project.id);

    console.log('✅ Stripe checkout session created:', session.id);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      projectId: project.id,
    });

  } catch (error: any) {
    console.error('❌ Error in create-checkout-session:', error);
    console.error('❌ Error type:', error.type);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error raw:', error.raw);
    
    // Retourner les détails de l'erreur Stripe
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = error.raw?.message || error.type || 'Unknown error';
    
    return res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      type: error.type
    });
  }
}
