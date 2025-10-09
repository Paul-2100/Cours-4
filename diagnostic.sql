-- ============================================
-- Script de diagnostic Supabase
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- pour vérifier l'état de votre configuration

-- 1. Vérifier la structure de la table projects
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Résultat attendu :
-- id              | uuid      | NO  | gen_random_uuid()
-- user_id         | uuid      | NO  | NULL
-- title           | text      | YES | NULL
-- prompt          | text      | YES | NULL  <- DOIT ÊTRE "prompt" PAS "description"
-- image_path      | text      | NO  | NULL
-- input_image_path| text      | YES | NULL
-- created_at      | timestamp | NO  | now()
-- updated_at      | timestamp | NO  | now()


-- 2. Vérifier que RLS est activé
-- ============================================
SELECT 
  schemaname,
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'projects';

-- Résultat attendu :
-- rowsecurity = true


-- 3. Lister les policies actives
-- ============================================
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'projects';

-- Résultat attendu : 4 policies
-- "Users can view own projects"   | SELECT | auth.uid() = user_id
-- "Users can insert own projects" | INSERT | auth.uid() = user_id
-- "Users can update own projects" | UPDATE | auth.uid() = user_id
-- "Users can delete own projects" | DELETE | auth.uid() = user_id


-- 4. Vérifier les buckets storage
-- ============================================
SELECT 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('input-image', 'output-image');

-- Résultat attendu :
-- input-image  | false | 52428800 | NULL
-- output-image | true  | 52428800 | NULL  <- DOIT ÊTRE "true"


-- 5. Lister les policies storage pour output-image
-- ============================================
SELECT 
  name,
  definition
FROM storage.policies
WHERE bucket_id = 'output-image';

-- Résultat attendu : au moins 2 policies
-- - Une pour INSERT (authenticated)
-- - Une pour SELECT (public)


-- 6. Compter les projets existants
-- ============================================
SELECT 
  COUNT(*) as total_projects,
  COUNT(DISTINCT user_id) as unique_users
FROM projects;


-- 7. Voir les 5 derniers projets créés
-- ============================================
SELECT 
  id,
  user_id,
  title,
  prompt,  -- Si erreur ici, la colonne s'appelle encore "description"
  image_path,
  created_at
FROM projects
ORDER BY created_at DESC
LIMIT 5;


-- 8. Vérifier les fichiers dans output-image bucket
-- ============================================
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'output-image'
ORDER BY created_at DESC
LIMIT 10;


-- ============================================
-- ACTIONS CORRECTIVES
-- ============================================

-- Si la colonne s'appelle "description" au lieu de "prompt" :
-- ALTER TABLE projects RENAME COLUMN description TO prompt;

-- Si le bucket output-image n'est pas public :
-- UPDATE storage.buckets SET public = true WHERE name = 'output-image';

-- Si RLS n'est pas activé :
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Si les policies manquent, réexécuter supabase-setup.sql


-- ============================================
-- TEST DE CONNEXION
-- ============================================

-- Vérifier que auth.uid() fonctionne (doit retourner votre UUID)
SELECT auth.uid() as my_user_id;

-- Si retourne NULL, vous n'êtes pas authentifié dans cette session SQL
-- C'est normal, le auth.uid() ne fonctionne que dans les requêtes via l'API


-- ============================================
-- NETTOYAGE (si besoin de recommencer)
-- ============================================

-- ATTENTION : Ces commandes SUPPRIMENT TOUTES LES DONNÉES !
-- À n'utiliser que si vous voulez vraiment tout recommencer

/*
-- Supprimer tous les projets
DELETE FROM projects;

-- Supprimer tous les fichiers du bucket
DELETE FROM storage.objects WHERE bucket_id IN ('input-image', 'output-image');

-- Supprimer la table
DROP TABLE IF EXISTS projects CASCADE;

-- Puis réexécuter supabase-setup.sql pour recréer
*/
