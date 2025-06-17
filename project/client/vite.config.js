import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue({
        include: [/\.vue$/],
        exclude: [/node_modules/]
      })
    ],
    base: './',
    server: {
      port: parseInt(process.env.VITE_PORT || 3000),
      strictPort: false, // Allow vite to find next available port if default is taken
      open: true,
      proxy: {
        '/api': {
          target: 'https://bookly-6t5b.onrender.com',
          changeOrigin: true,
          secure: true
        }
      },
    },
    build: {
      outDir: 'dist'
    }
  };
})