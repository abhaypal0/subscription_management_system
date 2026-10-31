import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const quotationService = {
  getQuotations: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.QUOTATIONS.BASE, { params })
    return response.data
  },

  getQuotationById: async (quotationId) => {
    const response = await api.get(API_ENDPOINTS.QUOTATIONS.BY_ID(quotationId))
    return response.data
  },

  createQuotation: async (quotationData) => {
    const response = await api.post(API_ENDPOINTS.QUOTATIONS.BASE, quotationData)
    return response.data
  },

  updateQuotation: async (quotationId, updateData) => {
    const response = await api.patch(API_ENDPOINTS.QUOTATIONS.BY_ID(quotationId), updateData)
    return response.data
  },

  updateStatus: async (quotationId, status) => {
    const response = await api.patch(API_ENDPOINTS.QUOTATIONS.STATUS(quotationId), { status })
    return response.data
  },
}
