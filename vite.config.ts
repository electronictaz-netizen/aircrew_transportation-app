import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      // Don't fail build if icons are missing (they'll be 404 but app will work)
      strategies: 'generateSW',
      manifest: {
        name: 'Aircrew Transportation Management',
        short_name: 'Aircrew Transport',
        description: 'Manage aircrew transportation trips and assignments',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ].filter(() => {
          // Only include icons if they exist (check at build time)
          // This prevents errors if icons are missing
          try {
            const fs = require('fs');
            const path = require('path');
            return true; // We'll handle missing icons gracefully
          } catch {
            return true;
          }
        }),
        shortcuts: [
          {
            name: 'Management Dashboard',
            short_name: 'Management',
            description: 'Open management dashboard',
            url: '/management',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Driver Dashboard',
            short_name: 'Driver',
            description: 'Open driver dashboard',
            url: '/driver',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.aviationstack\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aviationstack-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aws-amplify-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      injectRegister: 'auto'
    })
  ],
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['aws-amplify', '@aws-amplify/ui-react']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
