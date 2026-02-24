import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

import { registerSW } from 'virtual:pwa-register'



// Importar estilos globales
import './assets/css/theme.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')


// REGISTRAR SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration);
      })
      .catch((error) => {
        console.error('❌ Error registrando Service Worker:', error);
      });
  });
}


