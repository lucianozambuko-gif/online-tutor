import type { NextConfig } from "next";

// The web app and API are separate deployments (Vercel + Render), which
// makes every browser-to-API call cross-site — and browsers increasingly
// block or restrict cross-site cookies (Safari blocks third-party cookies
// outright regardless of SameSite=None; Chrome is phasing out the same).
// Proxying API calls through this same-origin path makes the auth cookie
// first-party from the browser's perspective, and — just as important —
// visible to this app's own proxy.ts middleware, which only ever sees
// cookies scoped to this app's own origin.
const nextConfig: NextConfig = {
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};

export default nextConfig;
