import api from './api.js';

export const paymentService = {
  async getBalance() {
    return api.get('/payments/balance');
  },
  
  async getHistory() {
    return api.get('/payments/history');
  },
  
  async getConcepts() {
    return api.get('/payments/concepts');
  },
  
  async createPayment(paymentData) {
    return api.post('/payments', paymentData);
  }
};
