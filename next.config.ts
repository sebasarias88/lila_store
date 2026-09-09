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
      // Alias interno mayoreo → mayorista
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

      // ── Migración WordPress / WooCommerce → Next ──
      // Sitelinks viejos: /categoria-producto/...
      {
        source: '/categoria-producto/:slug',
        destination: '/productos/categoria/:slug',
        permanent: true,
      },
      {
        source: '/categoria-producto/:parent/:child',
        destination: '/productos/categoria/:child',
        permanent: true,
      },
      {
        source: '/categoria-producto/:path*',
        destination: '/productos',
        permanent: true,
      },

      // Variantes comunes WP
      {
        source: '/product-category/:slug',
        destination: '/productos/categoria/:slug',
        permanent: true,
      },
      {
        source: '/product-category/:parent/:child',
        destination: '/productos/categoria/:child',
        permanent: true,
      },
      {
        source: '/categoria/:slug',
        destination: '/productos/categoria/:slug',
        permanent: true,
      },
      {
        source: '/categoria/:parent/:child',
        destination: '/productos/categoria/:child',
        permanent: true,
      },

      // Productos WP → PDP Next
      {
        source: '/producto/:slug',
        destination: '/productos/:slug',
        permanent: true,
      },
      {
        source: '/product/:slug',
        destination: '/productos/:slug',
        permanent: true,
      },
      {
        source: '/tienda',
        destination: '/productos',
        permanent: true,
      },
      {
        source: '/tienda/:path*',
        destination: '/productos',
        permanent: true,
      },
      {
        source: '/shop',
        destination: '/productos',
        permanent: true,
      },
      {
        source: '/shop/:path*',
        destination: '/productos',
        permanent: true,
      },

      // Trailing slash en rutas clave (evita duplicados)
      {
        source: '/productos/',
        destination: '/productos',
        permanent: true,
      },
      {
        source: '/mayorista/',
        destination: '/mayorista',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
