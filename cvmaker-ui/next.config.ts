import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5133";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    // The mock app/api/ handlers are gone, so every /api/* request — including
    // /api/auth/* — is proxied to the .NET API, which owns authentication.
    // `fallback` is kept so any future local route handler would still win.
    // Because this proxy is server-side, the browser sees a single origin: the auth
    // cookie set by the API is stored against localhost:3000 and sent back automatically.
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
