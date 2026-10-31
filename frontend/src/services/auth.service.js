
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

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(
      `/api/auth/reset-password/${token}`,
      { password, confirmPassword }
    )
    return response.data
  },

  getGoogleAuthUrl: () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${baseURL}${API_ENDPOINTS.AUTH.GOOGLE}`
  },
}
