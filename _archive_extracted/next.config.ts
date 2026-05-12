import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { isServer }) => {
    // Force single instances of CodeMirror packages to avoid
    // "Unrecognized extension value" errors from duplicate @codemirror/state
    config.resolve.alias = {
      ...config.resolve.alias,
      '@codemirror/state': path.resolve(__dirname, 'node_modules/@codemirror/state'),
      '@codemirror/view': path.resolve(__dirname, 'node_modules/@codemirror/view'),
      '@lezer/highlight': path.resolve(__dirname, 'node_modules/@lezer/highlight'),
    };
    return config;
  },
  // Turbopack aliases (used in dev mode with Next.js 16)
  turbopack: {
    resolveAlias: {
      '@codemirror/state': './node_modules/@codemirror/state',
      '@codemirror/view': './node_modules/@codemirror/view',
      '@lezer/highlight': './node_modules/@lezer/highlight',
    },
  },
};

export default nextConfig;
