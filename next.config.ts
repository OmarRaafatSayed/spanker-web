import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is for Docker/self-hosted — remove for Vercel
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [],
  },
  // Proxy /api/backend/* → FastAPI backend
  // In production: set BACKEND_INTERNAL_URL on Vercel dashboard
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
