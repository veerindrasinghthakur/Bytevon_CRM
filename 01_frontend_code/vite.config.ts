import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    env: {
      VITE_USE_MOCK_API: 'true',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tanstack-vendor': [
            '@tanstack/react-query',
            '@tanstack/react-router',
            '@tanstack/react-table',
            '@tanstack/react-virtual',
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'ui-vendor': ['clsx', 'tailwind-merge'],
          'http-vendor': ['axios'],
        },
      },
    },
  },
})