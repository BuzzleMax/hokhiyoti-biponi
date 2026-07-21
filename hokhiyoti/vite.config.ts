import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  // Portable GitHub Pages base.
  // Works locally (/) and on GH Pages (./ or repo root) without hardcoding the repo name.
  base: './',
})


