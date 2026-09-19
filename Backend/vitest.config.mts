import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: {
      JWT_SECRET: 'test-secret-test-secret-test-secret-123',
      JWT_ISSUER: 'VijayDairy',
      JWT_AUDIENCE: 'VijayDairyClients',
    },
  },
});
