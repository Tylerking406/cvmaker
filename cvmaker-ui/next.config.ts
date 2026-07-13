import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Using `fallback` so Next.js checks all app/api/ route handlers first.
    // Dynamic routes like /api/cvs/[cvId] are matched before the proxy runs.
    // To switch to the real .NET backend: remove cvmaker-ui/app/api/ entirely;
    // the fallback rewrite will then proxy everything to http://localhost:5133.
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://localhost:5133/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
