import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  // Use '/' for local dev, '/hokhiyoti-biponi/' for GitHub Pages production build
  base: mode === 'production' ? '/hokhiyoti-biponi/' : '/',
  build: {
    // Split vendor libraries into separate chunks to reduce main bundle size.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/wouter')) {
            return 'vendor-router'
          }
        },
      },
    },
  },
}))


