import api from './api.js'

export const balanceService = {
  getBalance() {
    return api.get('/balance')
  },
  
  getHistory() {
    return api.get('/balance/historial')
  },
  
  getConcepts() {
    return api.get('/balance/conceptos')
  }/*,
  
  createPayment(paymentData) {
    return api.post('/payments', paymentData)
  }*/
}
