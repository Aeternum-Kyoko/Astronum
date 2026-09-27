import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The app has two root layouts ((en) and hi), so URLs matching neither need app/global-not-found.tsx.
    globalNotFound: true,
  },
};

export default nextConfig;
