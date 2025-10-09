import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import fs from 'fs';
import { Buffer } from 'buffer';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Configuration Supabase manquante (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getReplicateClient(): Replicate {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN manquant pour contacter Replicate.');
  }

  return new Replicate({ auth: apiToken });
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

    // Récupération d'une URL signée accessible publiquement
    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase
      .storage
      .from('input-image')
      .createSignedUrl(fileName, 60 * 10, { download: false });

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Supabase signed URL error', signedUrlError);
      return res.status(500).json({ error: "Impossible de générer l'URL de l'image" });
    }

    const input_image_url = signedUrlData.signedUrl;

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

    const { data: outputSignedUrlData, error: outputSignedUrlError } = await supabase
      .storage
      .from('output-image')
      .createSignedUrl(outputFileName, 60 * 60, { download: false });

    if (outputSignedUrlError || !outputSignedUrlData?.signedUrl) {
      console.error('Supabase output signed URL error', outputSignedUrlError);
      return res.status(500).json({
        error: "Image sauvegardée mais URL signée indisponible",
        details: outputSignedUrlError?.message,
        output_url: replicateOutputUrlForResponse,
      });
    }

    // Try to get authenticated user from Authorization header
    let userId: string | null = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      }
    } catch (e) {
      userId = null;
    }

    // Insert a project row with URLs instead of paths
    try {
      const insertPayload: any = {
        prompt: prompt,
        input_image_url: signedUrlData.signedUrl,
        output_image_url: outputSignedUrlData.signedUrl,
        status: 'completed',
      };
      if (userId) insertPayload.user_id = userId;

      const { error: insertError } = await supabase.from('projects').insert([insertPayload]);
      if (insertError) {
        console.error('Insert project error', insertError);
      }
    } catch (e) {
      console.error('Failed to insert project', e);
    }

    res.status(200).json({
      output_image_url: outputSignedUrlData.signedUrl,
      replicate_output_url: replicateOutputUrlForResponse,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération';
    res.status(500).json({ error: message });
  }
}
