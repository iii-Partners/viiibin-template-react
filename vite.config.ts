import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viiiibinPagesDev } from './dev/viiibin-pages-dev'
import path from 'node:path'

// PWA Support (vite-plugin-pwa)
// Uncomment to enable PWA with service worker and precaching.
// NOTE: Conflicts with Capacitor native mode — only enable for web-only builds.
//
// import { VitePWA } from 'vite-plugin-pwa'
//
// Add to plugins array:
// VitePWA({
//   registerType: 'prompt',
//   includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
//   manifest: false, // Uses public/manifest.json
//   workbox: {
//     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
//     runtimeCaching: [
//       {
//         urlPattern: /^https:\/\/api\./,
//         handler: 'NetworkFirst',
//         options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
//       },
//     ],
//   },
// }),

// https://vite.dev/config/
export default defineConfig({
  plugins: [viiiibinPagesDev(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
