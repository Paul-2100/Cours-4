/**
 * Configuration centralisée des variables d'environnement
 * Ce fichier vérifie et exporte toutes les variables nécessaires
 */

// Variables publiques (côté client ET serveur)
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Variables privées (côté serveur uniquement)
// Utilise SUPABASE_URL en priorité, sinon fallback sur NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * Vérifie que les variables côté client sont définies
 * À appeler dans les composants React
 */
export function validateClientEnv() {
  if (!NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
}

/**
 * Vérifie que les variables côté serveur sont définies
 * À appeler dans les API routes
 */
export function validateServerEnv() {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
}

/**
 * Vérifie que le token Replicate est défini
 */
export function validateReplicateEnv() {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is required');
  }
}

/**
 * Helper pour logger les variables (masquées) en développement
 */
export function logEnvStatus() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Environment Variables Status:');
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗');
    console.log('✅ SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    console.log('✅ REPLICATE_API_TOKEN:', REPLICATE_API_TOKEN ? '✓' : '✗');
  }
}
