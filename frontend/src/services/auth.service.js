import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const authService = {
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    return response.data
  },

  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData)
    return response.data
  },

  logout: async () => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    return response.data
  },

  getMe: async () => {
    const response = await api.get(API_ENDPOINTS.AUTH.ME)
    return response.data
  },

  verifyEmail: async (token) => {
    const response = await api.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL(token))
    return response.data
  },

  resendVerificationEmail: async (email) => {
    const response = await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email })
    return response.data
  },

  getGoogleAuthUrl: () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${baseURL}${API_ENDPOINTS.AUTH.GOOGLE}`
  },
}
