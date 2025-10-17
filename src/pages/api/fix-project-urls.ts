import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, validateServerEnv } from '@/lib/env';

function getSupabaseAdmin() {
  validateServerEnv();
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Fonction pour extraire le chemin du fichier depuis une URL Supabase
function extractFilePath(url: string, bucketName: string): string | null {
  if (!url) return null;
  
  // Pattern pour signed URL: /storage/v1/object/sign/BUCKET/PATH?token=...
  const signedMatch = url.match(new RegExp(`/storage/v1/object/sign/${bucketName}/([^?]+)`));
  if (signedMatch) return signedMatch[1];
  
  // Pattern pour public URL: /storage/v1/object/public/BUCKET/PATH
  const publicMatch = url.match(new RegExp(`/storage/v1/object/public/${bucketName}/(.+)`));
  if (publicMatch) return publicMatch[1];
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseAdmin();
    
    // Vérifier l'authentification (optionnel, peut être admin-only)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ User verification error:', userError);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    console.log('🔧 Fixing URLs for user:', user.id);

    // Récupérer tous les projets de l'utilisateur
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, input_image_url, output_image_url')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('❌ Error fetching projects:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    console.log(`📦 Found ${projects?.length || 0} projects`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const project of projects || []) {
      let needsUpdate = false;
      const updates: any = {};

      // Vérifier input_image_url
      if (project.input_image_url && project.input_image_url.includes('/sign/')) {
        const filePath = extractFilePath(project.input_image_url, 'input-image');
        if (filePath) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('input-image')
            .getPublicUrl(filePath);
          
          updates.input_image_url = publicUrl;
          needsUpdate = true;
          console.log(`  ✅ Fixed input URL for project ${project.id.substring(0, 8)}`);
        }
      }

      // Vérifier output_image_url
      if (project.output_image_url && project.output_image_url.includes('/sign/')) {
        const filePath = extractFilePath(project.output_image_url, 'output-image');
        if (filePath) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('output-image')
            .getPublicUrl(filePath);
          
          updates.output_image_url = publicUrl;
          needsUpdate = true;
          console.log(`  ✅ Fixed output URL for project ${project.id.substring(0, 8)}`);
        }
      }

      // Mettre à jour le projet si nécessaire
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', project.id);

        if (updateError) {
          console.error(`  ❌ Error updating project ${project.id}:`, updateError);
        } else {
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Fixed ${updatedCount} projects, skipped ${skippedCount}`);

    return res.status(200).json({
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
      total: projects?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ Error in fix-project-urls:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
