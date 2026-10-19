import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    // functions/ is the Pages Functions project (workers types). Its tests live beside it and declare
    // `// @vitest-environment node` per file: a DOM environment makes fetch reject with
    // "Expected signal to be an instance of AbortSignal", which hid a real transport failure (2026-10-19).
    include: ['src/__tests__/**/*.test.{ts,tsx}', 'functions/__tests__/**/*.test.ts'],
  },
})
