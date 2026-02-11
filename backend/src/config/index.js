export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Colonia App',
    version: '1.0.0'
  },
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 30000
  },
  storage: {
    tokenKey: 'colonia_token',
    userKey: 'colonia_user'
  },
  roles: {
    ADMIN: 'admin',
    VECINO: 'vecino'
  }
};
