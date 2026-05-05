import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Ne pas bloquer le build prod sur les warnings ESLint cosmétiques
  // (ex: apostrophes non échappées dans du texte FR).
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default config;
