import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional separate build folder (e.g. CI or a build next to a running dev server).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1vxqtxg8u140a.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
