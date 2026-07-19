import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      {
        source: '/mayoreo',
        destination: '/mayorista',
        permanent: true,
      },
      {
        source: '/mayoreo/:path*',
        destination: '/mayorista/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
