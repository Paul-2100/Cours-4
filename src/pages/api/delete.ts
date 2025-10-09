import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Utiliser le SERVICE_ROLE_KEY pour bypasser RLS
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const supabase = getSupabaseAdmin();
  
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }
  
  const token = authHeader.substring(7);
  
  // Vérifier le token et récupérer l'utilisateur
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get project to confirm ownership
  const { data: project, error: pErr } = await supabase.from('projects').select('*').eq('id', id).single();
  if (pErr || !project) return res.status(404).json({ error: 'Not found' });
  if (project.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // Delete files from storage by extracting filenames from URLs
  try {
    // Extract filename from input_image_url
    if (project.input_image_url) {
      const inputMatch = project.input_image_url.match(/input-image\/([^?]+)/);
      if (inputMatch && inputMatch[1]) {
        await supabase.storage.from('input-image').remove([inputMatch[1]]).catch(() => null);
      }
    }
    
    // Extract filename from output_image_url
    if (project.output_image_url) {
      const outputMatch = project.output_image_url.match(/output-image\/([^?]+)/);
      if (outputMatch && outputMatch[1]) {
        await supabase.storage.from('output-image').remove([outputMatch[1]]).catch(() => null);
      }
    }
  } catch (e) {
    // ignore storage errors
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
