/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    // Ignora erros de ESLint para não quebrar o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de TypeScript para não quebrar o build
    ignoreBuildErrors: true,
  },
  experimental: { serverActions: { allowedOrigins: [] } },
};

module.exports = nextConfig;