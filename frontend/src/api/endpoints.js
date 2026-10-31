export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    VERIFY_EMAIL: (token) => `/api/auth/verify-email/${token}`,
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    GOOGLE: '/api/auth/google',
  },

  // Products
  PRODUCTS: {
    BASE: '/api/products',
    BY_ID: (id) => `/api/products/${id}`,
  },

  // Product Variants
  PRODUCT_VARIANTS: {
    BASE: '/api/product-variants',
    BY_ID: (id) => `/api/product-variants/${id}`,
  },

  // Plans
  PLANS: {
    BASE: '/api/plans',
    BY_ID: (id) => `/api/plans/${id}`,
  },

  // Quotations
  QUOTATIONS: {
    BASE: '/api/quotation',
    BY_ID: (id) => `/api/quotation/${id}`,
    STATUS: (id) => `/api/quotation/${id}/status`,
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    BASE: '/api/subscription',
    BY_ID: (id) => `/api/subscription/${id}`,
    ACTIVATE: (id) => `/api/subscription/${id}/activate`,
    PAUSE: (id) => `/api/subscription/${id}/pause`,
    RESUME: (id) => `/api/subscription/${id}/resume`,
    CLOSE: (id) => `/api/subscription/${id}/close`,
  },

  // Invoices
  INVOICES: {
    BASE: '/api/invoice',
    BY_ID: (id) => `/api/invoice/${id}`,
    GENERATE: '/api/invoice/generate',
    CONFIRM: (id) => `/api/invoice/${id}/confirm`,
    SEND: (id) => `/api/invoice/${id}/send`,
    CANCEL: (id) => `/api/invoice/${id}/cancel`,
  },

  // Payments
  PAYMENTS: {
    BASE: '/api/payments',
    BY_ID: (id) => `/api/payments/${id}`,
    CREATE_ORDER: '/api/payments/create-order',
    VERIFY: '/api/payments/verify',
  },

  // Taxes
  TAXES: {
    BASE: '/api/taxes',
    BY_ID: (id) => `/api/taxes/${id}`,
  },

  // Discounts
  DISCOUNTS: {
    BASE: '/api/discounts',
    BY_ID: (id) => `/api/discounts/${id}`,
    VALIDATE: '/api/discounts/validate',
  },
}
