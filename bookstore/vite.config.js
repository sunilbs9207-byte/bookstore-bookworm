import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      }
    }
  },
  build: {
    cssMinify: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})
