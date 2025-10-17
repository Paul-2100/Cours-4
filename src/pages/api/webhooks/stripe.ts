import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, validateServerEnv } from '@/lib/env';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false, // IMPORTANT: Nécessaire pour vérifier la signature
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ No Stripe signature found');
    return res.status(400).json({ error: 'No signature' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('✅ Webhook verified:', event.type);

  // Gérer l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log('💰 Payment successful for session:', session.id);
    console.log('📦 Metadata:', session.metadata);

    const projectId = session.metadata?.project_id;
    const userId = session.metadata?.user_id;

    if (!projectId || !userId) {
      console.error('❌ Missing metadata in session');
      return res.status(400).json({ error: 'Missing metadata' });
    }

    try {
      const supabase = getSupabaseAdmin();

      console.log('🔄 Updating project:', projectId, 'for user:', userId);

      // Mettre à jour le projet avec le statut de paiement
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          payment_status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'pending', // Prêt pour la génération
        })
        .eq('id', projectId)
        .eq('user_id', userId) // Sécurité: vérifier que le user_id correspond
        .select();

      if (updateError) {
        console.error('❌ Error updating project:', updateError);
        console.error('❌ Error details:', JSON.stringify(updateError, null, 2));
        return res.status(500).json({ 
          error: 'Failed to update project',
          details: updateError.message,
          code: updateError.code
        });
      }

      if (!updatedProject || updatedProject.length === 0) {
        console.error('❌ No project found with id:', projectId, 'and user_id:', userId);
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      console.log('✅ Project updated successfully:', projectId);
      console.log('✅ Updated project data:', updatedProject[0]);
      console.log('🚀 Project ready for generation');

    } catch (error: any) {
      console.error('❌ Error processing webhook:', error);
      console.error('❌ Error stack:', error.stack);
      return res.status(500).json({ error: error.message });
    }
  }

  // Retourner 200 pour confirmer la réception du webhook
  return res.status(200).json({ received: true });
}
