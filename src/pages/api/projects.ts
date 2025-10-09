import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '../../utils/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ projects: data });
}
