import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The app has two root layouts ((en) and hi), so URLs matching neither need app/global-not-found.tsx.
    globalNotFound: true,
  },
  async headers() {
    return [
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
