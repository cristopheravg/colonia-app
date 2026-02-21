import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'



// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Paraje Doroteo',
        short_name: 'Paraje Doroteo',
        description: 'App gestión paraje',
        theme_color: '#0d6efd',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png' 
          }
        ]
      }
    })


  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: true, // 👈 IMPORTANTE: Permite conexiones externas
    allowedHosts: [ // 👈 Permite dominios de ngrok
      'localhost',
      '127.0.0.1',
      '.ngrok-free.dev',  // Tu dominio actual
      '.ngrok.io',        // Dominio antiguo
      '.ngrok.app'        // Dominio nuevo
    ],


    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Si tu backend NO usa /api en las rutas, descomenta esto:
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})