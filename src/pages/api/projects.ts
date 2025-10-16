import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, validateServerEnv } from '@/lib/env';

// Utiliser le SERVICE_ROLE_KEY pour bypasser RLS
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
  const supabase = getSupabaseAdmin();
  
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }
  
  const token = authHeader.substring(7); // Enlever "Bearer "
  
  console.log('🔑 Token reçu:', token.substring(0, 50) + '...');
  
  // Vérifier le token et récupérer l'utilisateur
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    console.error('❌ Token verification failed:', userError);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
  
  console.log('👤 User authentifié:', user.id, user.email);

  console.log('🔍 Fetching projects for user:', user.id);
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Projects fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
  
  console.log('✅ Projects found:', data?.length || 0);
  if (data && data.length > 0) {
    data.forEach(p => {
      console.log(`  - Project ${p.id.substring(0, 8)}: ${p.prompt.substring(0, 30)}...`);
    });
  }
  
  return res.status(200).json({ projects: data });
}
