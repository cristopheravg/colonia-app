import axios from 'axios'

const api = axios.create({
  baseURL: 'http://54.227.139.118:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('colonia_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)

// Interceptor de respuesta simplificado
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Manejar 401 silenciosamente
    if (error.response?.status === 401) {
      localStorage.removeItem('colonia_token')
      localStorage.removeItem('colonia_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    // Para desarrollo, mostrar error; para producción, solo loguear
    if (import.meta.env.DEV) {
      return Promise.reject(error)
    } else {
      // En producción, no mostrar detalles en consola
      return Promise.reject(new Error('Error de conexión'))
    }
  }
)

export default api
