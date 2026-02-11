import api from './api.js'

export const authService = {
  login(credentials) {
    return api.post('/auth/login', credentials)
  },
  
  getProfile() {
    return api.get('/auth/me')
  },
  
  logout() {
    return api.post('/auth/logout')
  }
}
