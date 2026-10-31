import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const planService = {
  getPlans: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.PLANS.BASE, { params })
    return response.data
  },

  getPlanById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PLANS.BY_ID(id))
    return response.data
  },

  createPlan: async (planData) => {
    const response = await api.post(API_ENDPOINTS.PLANS.BASE, planData)
    return response.data
  },

  updatePlan: async (id, planData) => {
    const response = await api.put(API_ENDPOINTS.PLANS.BY_ID(id), planData)
    return response.data
  },

  deletePlan: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PLANS.BY_ID(id))
    return response.data
  },
}
