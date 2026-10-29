import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'WHIP · 个人健康 OS',
        short_name: 'WHIP',
        lang: 'zh-CN',
        description: '你的健康，由你掌握。离线、私密、长期陪伴。',
        theme_color: '#f5f5f7',
        background_color: '#f5f5f7',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        globIgnores: ['**/food.worker-*.js', '**/*ort*.wasm', '**/transformers*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(food.worker-|ort-wasm-)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vital-optional-ai-v1',
              expiration: { maxEntries: 6, maxAgeSeconds: 2592000 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 750 },
});
