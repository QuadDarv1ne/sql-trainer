import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    env: {
      AUTH_SECRET: 'test-secret-for-csrf-unit-tests',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/components/ui/', '**/*.d.ts', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': __dirname + '/src',
      'server-only': __dirname + '/src/__tests__/__mocks__/server-only.ts',
    },
  },
});
