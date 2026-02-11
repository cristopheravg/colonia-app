import api from './api.js';

export const authService = {
  async login(credentials) {
    return api.post('/auth/login', credentials);
  },
  
  async register(userData) {
    return api.post('/auth/register', userData);
  },
  
  async getProfile() {
    return api.get('/auth/me');
  },
  
  async logout() {
    return api.post('/auth/logout');
  }
};
