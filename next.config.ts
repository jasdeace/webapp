import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.extensions.push('.js'); // Ensure .js files are resolved
    return config;
  },
};

export default nextConfig;