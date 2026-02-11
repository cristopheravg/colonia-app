import { defineStore } from 'pinia'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('colonia_user')) || null,
    token: localStorage.getItem('colonia_token') || null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.rol === 'admin',
    userName: (state) => state.user?.nombre || 'Usuario'
  },
  
  actions: {
    setAuthData(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem('colonia_user', JSON.stringify(user))
      localStorage.setItem('colonia_token', token)
    },
    
    clearAuthData() {
      this.user = null
      this.token = null
      localStorage.removeItem('colonia_user')
      localStorage.removeItem('colonia_token')
    },
    
    async login(credentials) {
      this.isLoading = true
      
      try {
        const response = await authService.login(credentials)
        
        if (response.success) {
          this.setAuthData(response.data.user, response.data.token)
          return { success: true, data: response.data.user }
        } else {
          this.error = response.message
          return { success: false, error: this.error }
        }
      } catch (error) {
        this.error = error.message || 'Error en el servidor'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    logout() {
      // 1. Limpiar datos locales
      this.clearAuthData()
      
      // 2. Intentar logout en backend (no crítico)
      authService.logout().catch(() => {
        console.log('Backend no disponible para logout')
      })
      
      // 3. Redirigir inmediatamente
      window.location.href = '/login'
    }
  }
})
