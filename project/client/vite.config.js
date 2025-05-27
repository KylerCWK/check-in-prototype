import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      include: [/\.vue$/],
      exclude: [/node_modules/]
    })
  ],
  base: './',
  server: {
    port: process.env.VITE_PORT || 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    },
  },
  build: {
    outDir: 'dist'
  }
})