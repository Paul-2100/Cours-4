-- ============================================
-- DIAGNOSTIC ET CORRECTION RAPIDE
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

-- 1. VÉRIFIER SI LA TABLE EXISTE
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'projects'
) AS table_exists;

-- Si retourne "false", passez à l'étape 3 (créer la table)
-- Si retourne "true", passez à l'étape 2 (vérifier les colonnes)


-- 2. VÉRIFIER LES COLONNES EXISTANTES
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Colonnes REQUISES :
-- - id (uuid)
-- - user_id (uuid)
-- - title (text)
-- - prompt (text)
-- - image_path (text)
-- - input_image_path (text)
-- - created_at (timestamp)
-- - updated_at (timestamp)


-- 3. CRÉER OU RECRÉER LA TABLE (si nécessaire)
-- ============================================

-- OPTION A : Si la table n'existe PAS
-- Exécutez tout ce bloc :

DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  prompt TEXT,
  image_path TEXT NOT NULL,
  input_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Activer RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);


-- OPTION B : Si la table existe mais manque des colonnes
-- Exécutez uniquement les lignes nécessaires :

-- Si manque image_path :
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Si manque prompt :
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Si manque input_image_path :
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS input_image_path TEXT;

-- Si la colonne s'appelle "description" :
-- ALTER TABLE projects RENAME COLUMN description TO prompt;


-- 4. VÉRIFICATION FINALE
-- ============================================

-- Lister les colonnes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Vérifier RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'projects';

-- Compter les policies
SELECT COUNT(*) as policy_count FROM pg_policies
WHERE tablename = 'projects';
-- Doit retourner 4


-- 5. TEST D'INSERTION MANUEL (optionnel)
-- ============================================

-- Remplacez 'YOUR_USER_ID' par votre UUID utilisateur
-- Pour trouver votre UUID, connectez-vous sur l'app puis :
-- SELECT auth.uid();

/*
INSERT INTO projects (user_id, title, prompt, image_path, input_image_path)
VALUES (
  'YOUR_USER_ID'::UUID,
  'Test Project',
  'Transform into sunset',
  'output-test-123.jpg',
  'input-test-123.jpg'
);
*/


-- 6. VÉRIFIER LES BUCKETS STORAGE
-- ============================================

SELECT name, public, file_size_limit
FROM storage.buckets
WHERE name IN ('input-image', 'output-image');

-- output-image DOIT ÊTRE public = true


-- 7. SI LE BUCKET N'EST PAS PUBLIC
-- ============================================

UPDATE storage.buckets 
SET public = true 
WHERE name = 'output-image';


-- 8. VÉRIFIER LES POLICIES STORAGE
-- ============================================

SELECT bucket_id, name, definition
FROM storage.policies
WHERE bucket_id IN ('input-image', 'output-image');


-- ============================================
-- RÉSUMÉ DES ACTIONS
-- ============================================

/*
CHECKLIST :
[ ] Table "projects" existe avec 8 colonnes
[ ] Colonne "image_path" existe (PAS "description")
[ ] Colonne "prompt" existe
[ ] RLS activé (rowsecurity = true)
[ ] 4 policies actives
[ ] Bucket "output-image" existe et est PUBLIC
[ ] Bucket "input-image" existe

Si tout est ✓, l'application devrait fonctionner !
*/
