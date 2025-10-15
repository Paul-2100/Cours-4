module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['ceeuuvmoufadrapsgfag.supabase.co'], // Supabase storage domain
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
    ],
  },
  // Important pour Vercel : ne pas exposer les secrets côté serveur
  serverRuntimeConfig: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  },
  // Variables publiques accessibles côté client
  publicRuntimeConfig: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};