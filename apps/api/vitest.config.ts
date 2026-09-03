import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure business-logic tests only: no database, no network, no fixtures.
    // Everything under test is a deterministic function of its arguments.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
