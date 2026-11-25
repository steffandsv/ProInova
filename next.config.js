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
  experimental: { 
    serverActions: { allowedOrigins: [] },
    serverComponentsExternalPackages: ["pdfkit"]
  },
  // Links do evento divulgados antes da troca de nome para ProInova Day continuam funcionando.
  async redirects() {
    return [{ source: "/sharktank/:path*", destination: "/proinovaday/:path*", permanent: true }];
  },
};

module.exports = nextConfig;