import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '../../utils/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const supabase = createServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Get project to confirm ownership and image path
  const { data: project, error: pErr } = await supabase.from('projects').select('*').eq('id', id).single();
  if (pErr || !project) return res.status(404).json({ error: 'Not found' });
  if (project.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // delete files from storage if paths stored
  try {
    if (project.image_path) {
      // try both buckets
      await supabase.storage.from('input-image').remove([project.image_path]).catch(() => null);
      await supabase.storage.from('output-image').remove([project.image_path]).catch(() => null);
    }
  } catch (e) {
    // ignore
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
