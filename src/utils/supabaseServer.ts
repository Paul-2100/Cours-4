import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export function createServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerSupabaseClient({ req, res });
}
