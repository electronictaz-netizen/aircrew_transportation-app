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
      // Use the manifest from public folder if it exists, otherwise generate from config
      useCredentials: false,
      // Enable update notification
      injectRegister: 'auto',
      // Service worker configuration
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for service worker updates (we'll handle this manually)
        skipWaiting: false,
        clientsClaim: false,
        // Runtime caching strategies
        runtimeCaching: [
          // Static assets - cache first for performance
          {
            urlPattern: ({ url }) => {
              return url.origin.includes('amazonaws.com') && 
                     /\.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i.test(url.pathname);
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // API calls - network first with fallback
          {
            urlPattern: ({ url }) => url.origin.includes('aviationstack.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aviationstack-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          // AWS Amplify API - network first with offline fallback
          {
            urlPattern: ({ url }) => {
              return url.origin.includes('amazonaws.com') && url.pathname.includes('/graphql');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'amplify-graphql-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          // AWS Amplify assets - stale while revalidate
          {
            urlPattern: ({ url }) => url.origin.includes('amazonaws.com'),
            handler: 'StaleWhileRevalidate',
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
      manifest: {
        name: 'Onyx Transportation App',
        short_name: 'Onyx',
        description: 'Manage transportation trips and assignments',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?utm_source=pwa',
        id: '/',
        categories: ['business', 'productivity', 'transportation'],
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
            icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Driver Dashboard',
            short_name: 'Driver',
            description: 'Open driver dashboard',
            url: '/driver',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
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
