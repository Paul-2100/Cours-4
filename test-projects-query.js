// Test direct de la requête projects avec le user_id
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lire .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'c192f380-7817-4eaa-88ce-5a2da105685e'; // Votre user_id

async function test() {
  console.log('🧪 Test de la requête projects...\n');
  
  console.log('1️⃣ Requête avec .eq("user_id", ...)');
  const { data: data1, error: error1 } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', TEST_USER_ID);
  
  console.log('  Résultat:', data1?.length || 0, 'projet(s)');
  if (error1) console.error('  Erreur:', error1);
  
  console.log('\n2️⃣ Requête SANS filtre (tous les projets)');
  const { data: data2, error: error2 } = await supabase
    .from('projects')
    .select('*');
  
  console.log('  Résultat:', data2?.length || 0, 'projet(s) au total');
  if (data2) {
    data2.forEach(p => {
      const match = p.user_id === TEST_USER_ID ? '✅ MATCH' : '❌ différent';
      console.log(`    - ${p.id.substring(0, 8)}: user_id=${p.user_id?.substring(0, 8)} ${match}`);
    });
  }
  
  console.log('\n3️⃣ Vérification du user dans auth.users');
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userData) {
    const user = userData.users.find(u => u.id === TEST_USER_ID);
    if (user) {
      console.log('  ✅ User trouvé:', user.email);
      console.log('  ID exact:', user.id);
    } else {
      console.log('  ❌ User NON trouvé dans auth.users');
    }
  }
  
  console.log('\n✨ Test terminé\n');
  process.exit(0);
}

test().catch(err => {
  console.error('💥 Erreur:', err);
  process.exit(1);
});
