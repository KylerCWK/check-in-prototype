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
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist'
  }
})