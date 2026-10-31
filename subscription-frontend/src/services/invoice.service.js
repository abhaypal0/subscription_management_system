import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const invoiceService = {
  getInvoices: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.INVOICES.BASE, { params })
    return response.data
  },

  getInvoiceById: async (invoiceId) => {
    const response = await api.get(API_ENDPOINTS.INVOICES.BY_ID(invoiceId))
    return response.data
  },

  generateInvoice: async (subscriptionId) => {
    const response = await api.post(API_ENDPOINTS.INVOICES.GENERATE, { subscriptionId })
    return response.data
  },

  confirmInvoice: async (invoiceId) => {
    const response = await api.patch(API_ENDPOINTS.INVOICES.CONFIRM(invoiceId))
    return response.data
  },

  sendInvoice: async (invoiceId) => {
    const response = await api.patch(API_ENDPOINTS.INVOICES.SEND(invoiceId))
    return response.data
  },

  cancelInvoice: async (invoiceId) => {
    const response = await api.patch(API_ENDPOINTS.INVOICES.CANCEL(invoiceId))
    return response.data
  },
}
