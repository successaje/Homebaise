import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, dev }) => {
    // Add fallbacks for Node.js modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        process: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        os: false,
        zlib: false,
      };
    }

    return config;
  },
  // Configure images if needed
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co'],
  },
};

export default nextConfig;
