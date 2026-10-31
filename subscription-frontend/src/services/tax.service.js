import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const taxService = {
  getTaxes: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.TAXES.BASE, { params })
    return response.data
  },

  getTaxById: async (id) => {
    const response = await api.get(API_ENDPOINTS.TAXES.BY_ID(id))
    return response.data
  },

  createTax: async (taxData) => {
    const response = await api.post(API_ENDPOINTS.TAXES.BASE, taxData)
    return response.data
  },

  updateTax: async (id, taxData) => {
    const response = await api.put(API_ENDPOINTS.TAXES.BY_ID(id), taxData)
    return response.data
  },

  deleteTax: async (id) => {
    const response = await api.delete(API_ENDPOINTS.TAXES.BY_ID(id))
    return response.data
  },
}
