import { defineConfig } from 'vitest/config'

/**
 * The delivery tests (tests/delivery/*.spec.ts) send real messages and wait for them: node environment, one file at a
 * time, long timeouts, and a global setup that starts `wrangler pages dev` unless DELIVERY_BASE_URL points at a deployment.
 *   npm run test:delivery
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/delivery/**/*.spec.ts'],
    globalSetup: ['tests/delivery/global-setup.ts'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    fileParallelism: false,
    passWithNoTests: false,
  },
})
