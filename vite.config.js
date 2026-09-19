import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split big vendor libraries into their own files so the app chunk
        // stays small and vendor chunks are cached across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (/[\\/]node_modules[\\/](@firebase|firebase)[\\/]/.test(id)) {
            return 'firebase'
          }

          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)
          ) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  },
})