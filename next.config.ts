import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The app has two root layouts ((en) and hi), so URLs matching neither need app/global-not-found.tsx.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        // The palm reader's model and WASM runtime (~30 MB): cache for a week so repeat visits load instantly.
        source: "/mediapipe/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        // The service worker must always be fetched fresh so updates reach users.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
