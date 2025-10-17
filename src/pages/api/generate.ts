import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import fs from 'fs';
import { Buffer } from 'buffer';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REPLICATE_API_TOKEN, validateServerEnv, validateReplicateEnv } from '@/lib/env';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getSupabaseClient(): SupabaseClient {
  validateServerEnv();
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getReplicateClient(): Replicate {
  validateReplicateEnv();
  return new Replicate({ auth: REPLICATE_API_TOKEN! });
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
  const supabase = getSupabaseClient();
    const replicate = getReplicateClient();

    const { fields, files } = await parseForm(req);
    
    // Récupérer le projectId depuis les fields
    const projectIdField = fields.projectId;
    const projectId = typeof projectIdField === 'string'
      ? projectIdField
      : Array.isArray(projectIdField)
        ? projectIdField[0] ?? ''
        : '';

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID requis' });
    }

    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé - Token manquant' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ User verification error:', userError);
      return res.status(401).json({ error: 'Non autorisé - Token invalide' });
    }

    // Récupérer le projet et vérifier le paiement
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('❌ Project not found:', projectError);
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Vérifier que l'utilisateur est propriétaire du projet
    if (project.user_id !== user.id) {
      console.error('❌ User not owner of project');
      return res.status(403).json({ error: 'Accès refusé - Vous n\'êtes pas propriétaire de ce projet' });
    }

    // Vérifier le statut de paiement
    if (project.payment_status !== 'paid') {
      console.error('❌ Payment not completed:', project.payment_status);
      return res.status(402).json({ error: 'Paiement requis - Le projet n\'est pas payé' });
    }

    console.log('✅ Project verified and paid:', projectId);

    const promptField = fields.prompt;
    const rawPrompt =
      typeof promptField === 'string'
        ? promptField
        : Array.isArray(promptField)
          ? promptField[0] ?? ''
          : '';
    const prompt = rawPrompt.trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis' });
    }

    // Correction : gestion du fichier image
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    const filePath = imageFile?.filepath || imageFile?.path;
    if (!filePath) {
      throw new Error('Fichier image non trouvé');
    }
    const fileData = fs.readFileSync(filePath);

    // Upload sur Supabase Storage (bucket: input-image)
    const safeOriginalName = imageFile.originalFilename?.replace(/\s+/g, '_') || 'upload.png';
    const fileName = `${Date.now()}-${safeOriginalName}`;
    const { error: uploadError } = await supabase.storage
      .from('input-image')
      .upload(fileName, fileData, {
        contentType: imageFile.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error', uploadError);
      return res.status(500).json({
        error: 'Erreur upload Supabase',
        details: uploadError.message ?? 'Upload vers Supabase impossible',
      });
    }

    // Récupération d'une URL publique permanente
    const { data: { publicUrl: input_image_url } } = supabase
      .storage
      .from('input-image')
      .getPublicUrl(fileName);

    console.log('✅ Input image URL:', input_image_url);

    // Appel au modèle Nano Banana sur Replicate
    const replicateInput = {
      prompt,
      image_input: [input_image_url],
      aspect_ratio: 'match_input_image',
      output_format: 'jpg',
    };

    let replicateOutputUrl: string | undefined;
    let outputBuffer: Buffer | undefined;
    let outputContentType = 'image/jpeg';

    try {
      const replicateResult = await replicate.run('google/nano-banana', {
        input: replicateInput,
      }) as any;

      if (replicateResult && typeof replicateResult === 'object') {
        if (typeof replicateResult.url === 'function') {
          replicateOutputUrl = replicateResult.url();
        } else if (typeof replicateResult.url === 'string') {
          replicateOutputUrl = replicateResult.url;
        }

        if (typeof replicateResult.arrayBuffer === 'function') {
          const arrayBuffer = await replicateResult.arrayBuffer();
          outputBuffer = Buffer.from(arrayBuffer);
        }

        if (typeof replicateResult.type === 'string' && replicateResult.type.length > 0) {
          outputContentType = replicateResult.type;
        }
      } else if (typeof replicateResult === 'string') {
        replicateOutputUrl = replicateResult;
      }
    } catch (replicateError) {
      console.error('Replicate generation error', replicateError);
      return res.status(502).json({ error: "La génération d'image a échoué sur Replicate" });
    }

    if (!outputBuffer) {
      if (!replicateOutputUrl) {
        console.error('Replicate did not return output media');
        return res.status(502).json({ error: "Replicate n'a retourné aucun média" });
      }

      const replicateFetch = await fetch(replicateOutputUrl);
      if (!replicateFetch.ok) {
        const replicateFetchError = await replicateFetch.text().catch(() => '');
        console.error('Erreur lors de la récupération du média Replicate', replicateFetch.status, replicateFetchError);
        return res.status(502).json({ error: "Impossible de récupérer l'image générée" });
      }

      const replicateArrayBuffer = await replicateFetch.arrayBuffer();
      outputBuffer = Buffer.from(replicateArrayBuffer);
      const headerContentType = replicateFetch.headers.get('content-type');
      if (headerContentType) {
        outputContentType = headerContentType;
      }
    }

    if (!outputBuffer) {
      console.error('Unable to read Replicate output as buffer');
      return res.status(502).json({ error: "Impossible de lire l'image générée" });
    }

    const replicateOutputUrlForResponse = replicateOutputUrl ?? null;
    const extension = outputContentType.split('/')[1]?.split(';')[0] || 'jpg';
    const outputFileName = `output-${Date.now()}.${extension}`;

    const { error: outputUploadError } = await supabase.storage
      .from('output-image')
      .upload(outputFileName, outputBuffer, {
        contentType: outputContentType,
        upsert: false,
      });

    if (outputUploadError) {
      console.error('Supabase output upload error', outputUploadError);
      return res.status(500).json({
        error: "L'image a été générée mais n'a pas pu être sauvegardée",
        details: outputUploadError.message,
        output_url: replicateOutputUrlForResponse,
      });
    }

    // Récupération d'une URL publique permanente pour l'output
    const { data: { publicUrl: output_image_url } } = supabase
      .storage
      .from('output-image')
      .getPublicUrl(outputFileName);

    console.log('✅ Output image URL:', output_image_url);

    // Mettre à jour le projet avec l'image générée
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        output_image_url: output_image_url,
        status: 'completed',
      })
      .eq('id', projectId)
      .eq('user_id', user.id); // Sécurité supplémentaire

    if (updateError) {
      console.error('❌ Error updating project:', updateError);
    } else {
      console.log('✅ Project updated with output image:', projectId);
    }

    res.status(200).json({
      output_image_url: output_image_url,
      replicate_output_url: replicateOutputUrlForResponse,
      projectId: projectId,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération';
    res.status(500).json({ error: message });
  }
}
