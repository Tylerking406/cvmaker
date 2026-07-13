import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5133";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    // Using `fallback` so app/api/ mock handlers are checked first.
    // Dynamic routes like /api/cvs/[cvId] match before this proxy fires.
    // To use the real backend: set BACKEND_URL env var (or remove app/api/).
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
