import api from '../api/axios'
import { API_ENDPOINTS } from '../api/endpoints'

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.BASE, { params })
    return response.data
  },

  getProductById: async (productId) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.BY_ID(productId))
    return response.data
  },

  createProduct: async (productData) => {
    const response = await api.post(API_ENDPOINTS.PRODUCTS.BASE, productData)
    return response.data
  },

  updateProduct: async (productId, updateData) => {
    const response = await api.patch(API_ENDPOINTS.PRODUCTS.BY_ID(productId), updateData)
    return response.data
  },

  deactivateProduct: async (productId) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCTS.BY_ID(productId))
    return response.data
  },

  // Variants
  createVariant: async (variantData) => {
    const response = await api.post(API_ENDPOINTS.PRODUCT_VARIANTS.BASE, variantData)
    return response.data
  },

  updateVariant: async (variantId, variantData) => {
    const response = await api.patch(API_ENDPOINTS.PRODUCT_VARIANTS.BY_ID(variantId), variantData)
    return response.data
  },

  deactivateVariant: async (variantId) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_VARIANTS.BY_ID(variantId))
    return response.data
  },
}
