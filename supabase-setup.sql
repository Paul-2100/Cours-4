-- ============================================
-- Configuration Supabase pour AI Image Editor
-- ============================================

-- 1. Créer la table projects
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  description TEXT,
  image_path TEXT NOT NULL,
  input_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Créer un index pour optimiser les requêtes par user_id
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id 
ON projects(user_id);

-- 3. Créer un index pour trier par date
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

-- 4. Activer Row Level Security (RLS)
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 5. Policy SELECT : un utilisateur peut voir ses propres projets
-- ============================================

CREATE POLICY "Users can view own projects" 
ON projects
FOR SELECT 
USING (auth.uid() = user_id);

-- 6. Policy INSERT : un utilisateur peut créer ses propres projets
-- ============================================

CREATE POLICY "Users can insert own projects" 
ON projects
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 7. Policy UPDATE : un utilisateur peut modifier ses propres projets
-- ============================================

CREATE POLICY "Users can update own projects" 
ON projects
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Policy DELETE : un utilisateur peut supprimer ses propres projets
-- ============================================

CREATE POLICY "Users can delete own projects" 
ON projects
FOR DELETE 
USING (auth.uid() = user_id);

-- 9. Fonction pour mettre à jour automatiquement updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Configuration Storage Buckets
-- ============================================

-- À exécuter via l'interface Supabase Storage ou via SQL si vous avez les permissions :

-- 1. Créer le bucket input-image (privé)
-- Via l'interface Supabase Storage :
--   - Nom : input-image
--   - Public : Non
--   - File size limit : 50MB

-- 2. Créer le bucket output-image (public)
-- Via l'interface Supabase Storage :
--   - Nom : output-image
--   - Public : Oui
--   - File size limit : 50MB

-- ============================================
-- Policies Storage pour input-image
-- ============================================

-- Policy : Authenticated users can upload to input-image
CREATE POLICY "Authenticated users can upload input" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'input-image');

-- Policy : Authenticated users can read from input-image
CREATE POLICY "Authenticated users can read input" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'input-image');

-- Policy : Authenticated users can delete from input-image
CREATE POLICY "Authenticated users can delete input" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'input-image');

-- ============================================
-- Policies Storage pour output-image
-- ============================================

-- Policy : Authenticated users can upload to output-image
CREATE POLICY "Authenticated users can upload output" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'output-image');

-- Policy : Public can read from output-image
CREATE POLICY "Public can read output" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'output-image');

-- Policy : Authenticated users can delete from output-image
CREATE POLICY "Authenticated users can delete output" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'output-image');

-- ============================================
-- Vérifications
-- ============================================

-- Vérifier que la table a été créée
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Vérifier que les index ont été créés
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'projects';

-- Vérifier que RLS est activé
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'projects';

-- Lister les policies
SELECT 
  policyname, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'projects';

-- ============================================
-- Données de test (optionnel)
-- ============================================

-- Insérer un projet de test (remplacer YOUR_USER_ID par un UUID valide)
/*
INSERT INTO projects (user_id, title, description, image_path, input_image_path)
VALUES (
  'YOUR_USER_ID'::UUID,
  'Test Project',
  'A beautiful sunset transformation',
  'output-1234567890.jpg',
  '1234567890-sunset.jpg'
);
*/

-- ============================================
-- Nettoyage (si besoin de recommencer)
-- ============================================

-- ATTENTION : Ces commandes suppriment toutes les données !
-- À utiliser uniquement en développement

/*
-- Supprimer les policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer la table
DROP TABLE IF EXISTS projects CASCADE;
*/

-- ============================================
-- Instructions d'utilisation
-- ============================================

/*
ÉTAPES DE CONFIGURATION :

1. Aller dans votre projet Supabase
2. Cliquer sur "SQL Editor" dans le menu latéral
3. Créer une nouvelle requête
4. Copier-coller ce fichier SQL
5. Exécuter la requête
6. Aller dans "Storage" et créer les buckets :
   - input-image (privé)
   - output-image (public)
7. Les policies storage seront appliquées automatiquement

VÉRIFICATION :

1. Aller dans "Database" > "Tables"
2. Vérifier que la table "projects" existe
3. Cliquer sur "Policies" et vérifier que 4 policies sont actives
4. Aller dans "Storage" et vérifier que les 2 buckets existent

VARIABLES D'ENVIRONNEMENT :

Dans votre fichier .env.local :

NEXT_PUBLIC_SUPABASE_URL=https://votreprojet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
REPLICATE_API_TOKEN=votre-token-replicate

Les clés se trouvent dans :
Settings > API > Project URL
Settings > API > Project API keys > anon public
Settings > API > Project API keys > service_role (secret!)
*/
