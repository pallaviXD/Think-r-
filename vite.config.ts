import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Force Rollup to use its WASM build instead of the native .node binary.
// This is needed on systems where Windows Application Control policies block
// unsigned native binaries (rollup-win32-x64-msvc.node).
process.env.ROLLUP_WASM = 'true'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Thinkr — Study smart. Score high.',
        short_name: 'Thinkr',
        description: 'AI study companion for Indian students',
        theme_color: '#FF6B00',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Dev proxy: forward /groq/* to Groq API to avoid CORS issues in local dev
  server: {
    proxy: {
      '/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/groq/, ''),
        secure: true,
      },
      '/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/openrouter/, ''),
        secure: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['tesseract.js'],
  },
})
