// Script de test pour déboguer Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lire manuellement le fichier .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Configuration Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✓ Présente' : '✗ Manquante');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('\n📊 Test 1: Récupérer TOUS les projets (sans filtre)...');
  const { data: allProjects, error: allError } = await supabase
    .from('projects')
    .select('*');
  
  if (allError) {
    console.error('❌ Erreur:', allError);
  } else {
    console.log(`✅ ${allProjects.length} projet(s) trouvé(s) dans la base`);
    allProjects.forEach((p, i) => {
      console.log(`\n  Projet ${i + 1}:`);
      console.log(`    ID: ${p.id}`);
      console.log(`    User ID: ${p.user_id}`);
      console.log(`    Prompt: ${p.prompt}`);
      console.log(`    Status: ${p.status}`);
      console.log(`    Input URL: ${p.input_image_url?.substring(0, 60)}...`);
      console.log(`    Output URL: ${p.output_image_url?.substring(0, 60)}...`);
      console.log(`    Created: ${p.created_at}`);
    });
  }

  console.log('\n📊 Test 2: Lister tous les users...');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Erreur:', usersError);
  } else {
    console.log(`✅ ${users.users.length} utilisateur(s) trouvé(s)`);
    users.users.forEach((u, i) => {
      console.log(`\n  User ${i + 1}:`);
      console.log(`    ID: ${u.id}`);
      console.log(`    Email: ${u.email}`);
    });
  }

  console.log('\n📊 Test 3: Vérifier les buckets Storage...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Erreur:', bucketsError);
  } else {
    console.log(`✅ ${buckets.length} bucket(s) trouvé(s)`);
    for (const bucket of buckets) {
      console.log(`\n  Bucket: ${bucket.name}`);
      console.log(`    Public: ${bucket.public}`);
      
      // Lister les fichiers
      const { data: files } = await supabase.storage.from(bucket.name).list();
      console.log(`    Fichiers: ${files?.length || 0}`);
      
      if (files && files.length > 0) {
        files.slice(0, 3).forEach(f => {
          console.log(`      - ${f.name}`);
        });
        if (files.length > 3) {
          console.log(`      ... et ${files.length - 3} autre(s)`);
        }
      }
    }
  }

  console.log('\n✨ Tests terminés\n');
  process.exit(0);
}

test().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});
