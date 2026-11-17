import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional separate build folder (e.g. CI or a build next to a running dev server).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The shared /login page was removed: every role has its own login screen and
  // the home page is the role picker. Keep old bookmarks and links working.
  async redirects() {
    return [
      { source: '/login', destination: '/', permanent: true },
      // Super Admin can only view finances; income and expense entry belongs to Accounts.
      { source: '/super-admin/income', destination: '/super-admin/financial', permanent: false },
      { source: '/super-admin/expenses', destination: '/super-admin/financial', permanent: false },
    ];
  },
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
