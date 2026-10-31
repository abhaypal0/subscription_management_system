import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const discountService = {
  getDiscounts: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.DISCOUNTS.BASE, { params })
    return response.data
  },

  getDiscountById: async (id) => {
    const response = await api.get(API_ENDPOINTS.DISCOUNTS.BY_ID(id))
    return response.data
  },

  createDiscount: async (discountData) => {
    const response = await api.post(API_ENDPOINTS.DISCOUNTS.BASE, discountData)
    return response.data
  },

  updateDiscount: async (id, discountData) => {
    const response = await api.put(API_ENDPOINTS.DISCOUNTS.BY_ID(id), discountData)
    return response.data
  },

  deleteDiscount: async (id) => {
    const response = await api.delete(API_ENDPOINTS.DISCOUNTS.BY_ID(id))
    return response.data
  },

  validateDiscount: async (validationData) => {
    const response = await api.post(API_ENDPOINTS.DISCOUNTS.VALIDATE, validationData)
    return response.data
  },
}
