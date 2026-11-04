import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // First run downloads the MongoDB binary used by mongodb-memory-server.
    hookTimeout: 120_000,
  },
});
