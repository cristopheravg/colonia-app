import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// Importar estilos globales
import './assets/css/theme.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
