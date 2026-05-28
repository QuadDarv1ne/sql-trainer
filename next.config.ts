import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3'],
  // Force body size limit for API routes (1MB default)
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "media-src 'none'",
              "object-src 'none'",
              "frame-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Deduplicate @codemirror packages to avoid "multiple instances of @codemirror/state" error
  transpilePackages: [
    '@codemirror/state',
    '@codemirror/view',
    '@codemirror/language',
    '@codemirror/commands',
    '@codemirror/search',
    '@codemirror/autocomplete',
    '@codemirror/lang-sql',
    '@codemirror/theme-one-dark',
    '@lezer/highlight',
    '@lezer/common',
    '@lezer/lr',
    '@lezer/javascript',
    'codemirror',
    'style-mod',
    'w3c-keyname',
  ],
  // Force webpack/turbopack to resolve these packages to a single instance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@codemirror/state': require.resolve('@codemirror/state'),
        '@codemirror/view': require.resolve('@codemirror/view'),
        '@codemirror/language': require.resolve('@codemirror/language'),
        '@codemirror/commands': require.resolve('@codemirror/commands'),
        '@codemirror/search': require.resolve('@codemirror/search'),
        '@codemirror/autocomplete': require.resolve('@codemirror/autocomplete'),
        '@codemirror/lang-sql': require.resolve('@codemirror/lang-sql'),
        '@codemirror/theme-one-dark': require.resolve('@codemirror/theme-one-dark'),
        '@lezer/highlight': require.resolve('@lezer/highlight'),
        '@lezer/common': require.resolve('@lezer/common'),
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@codemirror/state': '@codemirror/state',
      '@codemirror/view': '@codemirror/view',
      '@codemirror/language': '@codemirror/language',
      '@codemirror/commands': '@codemirror/commands',
      '@codemirror/search': '@codemirror/search',
      '@codemirror/autocomplete': '@codemirror/autocomplete',
      '@codemirror/lang-sql': '@codemirror/lang-sql',
      '@codemirror/theme-one-dark': '@codemirror/theme-one-dark',
      '@lezer/highlight': '@lezer/highlight',
      '@lezer/common': '@lezer/common',
    },
  },
};

export default nextConfig;
