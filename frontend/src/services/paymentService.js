import api from './api.js'

export const paymentService = {
  getBalance() {
    return api.get('/payments/balance')
  },
  
  getHistory() {
    return api.get('/payments/history')
  },
  
  getConcepts() {
    return api.get('/payments/concepts')
  },
  
  createPayment(paymentData) {
    return api.post('/payments', paymentData)
  }
}
