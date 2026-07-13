import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // NOTE: Next.js API routes in app/api/ take priority over these rewrites.
    // The mock API (app/api/) is active by default for local dev — no backend needed.
    // To use the real .NET backend, remove cvmaker-ui/app/api/ and ensure
    // the API is running on http://localhost:5133.
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5133/api/:path*",
      },
    ];
  },
};

export default nextConfig;
