import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viiiibinPagesDev } from './dev/viiibin-pages-dev'
import { TOKENS_JSON, writeTokensCss } from './scripts/tokens'
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

// design-system/tokens.json is the theme's source: tokens.css is written from it on start and on every save
function designTokens(): Plugin {
  return {
    name: 'design-tokens',
    buildStart() {
      writeTokensCss()
      this.addWatchFile(TOKENS_JSON)
    },
    configureServer(server) {
      server.watcher.add(TOKENS_JSON)
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === TOKENS_JSON) writeTokensCss()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [designTokens(), viiiibinPagesDev(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // this project's own port (CLAUDE.md, Local dev); a busy port is an error, never a move to the next one
  preview: { port: 5182, strictPort: true },
  server: {
    port: 5182,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
