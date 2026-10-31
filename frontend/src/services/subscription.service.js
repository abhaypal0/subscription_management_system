import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const subscriptionService = {
  getSubscriptions: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.SUBSCRIPTIONS.BASE, { params })
    return response.data
  },

  getSubscriptionById: async (subscriptionId) => {
    const response = await api.get(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(subscriptionId))
    return response.data
  },

  createSubscription: async (subscriptionData) => {
    const response = await api.post(API_ENDPOINTS.SUBSCRIPTIONS.BASE, subscriptionData)
    return response.data
  },

  activateSubscription: async (subscriptionId) => {
    const response = await api.patch(API_ENDPOINTS.SUBSCRIPTIONS.ACTIVATE(subscriptionId))
    return response.data
  },

  pauseSubscription: async (subscriptionId) => {
    const response = await api.patch(API_ENDPOINTS.SUBSCRIPTIONS.PAUSE(subscriptionId))
    return response.data
  },

  resumeSubscription: async (subscriptionId) => {
    const response = await api.patch(API_ENDPOINTS.SUBSCRIPTIONS.RESUME(subscriptionId))
    return response.data
  },

  closeSubscription: async (subscriptionId) => {
    const response = await api.patch(API_ENDPOINTS.SUBSCRIPTIONS.CLOSE(subscriptionId))
    return response.data
  },
}
