import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/webp", "image/avif"],
  },
  // Proxy /api/backend/* → FastAPI at localhost:8000/api/v1/*
  // This avoids any CORS issues — browser only talks to Next.js (same origin)
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
