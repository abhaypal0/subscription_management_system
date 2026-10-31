import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const paymentService = {
  getPayments: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.BASE, { params })
    return response.data
  },

  getPaymentById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.BY_ID(id))
    return response.data
  },

  createOrder: async (invoiceId) => {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, { invoiceId })
    return response.data
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.VERIFY, paymentData)
    return response.data
  },
}
