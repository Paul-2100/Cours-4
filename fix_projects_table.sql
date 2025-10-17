-- ============================================
-- Script SQL pour réparer la table projects
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. Vérifier l'état actuel de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes (si elles n'existent pas)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 2.00;

-- 3. Vérifier que les colonnes ont bien été ajoutées
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN (
  'payment_status',
  'stripe_payment_intent_id', 
  'stripe_checkout_session_id',
  'payment_amount'
);

-- 4. Vérifier les politiques RLS actuelles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'projects';

-- 5. Si besoin, désactiver temporairement RLS pour tester
-- ATTENTION: Ne faire que pour les TESTS, puis réactiver!
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 6. Après test réussi, réactiver RLS
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 7. Vérifier un projet existant
SELECT 
  id,
  user_id,
  prompt,
  status,
  payment_status,
  stripe_checkout_session_id,
  stripe_payment_intent_id,
  payment_amount,
  created_at
FROM projects
ORDER BY created_at DESC
LIMIT 5;

-- 8. Pour un projet spécifique (remplacez l'ID)
-- SELECT * FROM projects 
-- WHERE id = '1e550c3c-fd15-4fda-920d-f874b5a4854e';

-- ============================================
-- Script terminé
-- ============================================
