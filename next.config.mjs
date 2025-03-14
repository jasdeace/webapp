/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.extensions.push('.js'); // Ensure .js files are resolved
    return config;
  },
};

export default nextConfig;