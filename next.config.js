/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co', 'images.unsplash.com'],
  },
  webpack: (config, { isServer }) => {
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
};

module.exports = nextConfig;
