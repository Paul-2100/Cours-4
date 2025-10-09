-- ============================================
-- Migration : Renommer description → prompt
-- ============================================

-- Si vous avez déjà une table avec 'description', renommez-la :
ALTER TABLE projects 
RENAME COLUMN description TO prompt;

-- Si vous n'avez pas encore de table, utilisez le script complet :
-- supabase-setup.sql

-- Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
