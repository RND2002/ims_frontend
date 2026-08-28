export const BACKEND_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    : "";

export const API_ENDPOINTS = {
  // Proxy Auth Routes (Next.js API Route Handlers)
  auth: {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
    otpSend: "/api/auth/otp/send",
    otpVerify: "/api/auth/otp/verify",
    otpRegister: "/api/auth/otp/register",
  },
  
  // Direct FastAPI Backend Routes (organized by resource prefix)
  backend: {
    auth: {
      signup: `${BACKEND_URL}/api/v1/auth/signup`,
      token: `${BACKEND_URL}/api/v1/auth/token`,
      refresh: `${BACKEND_URL}/api/v1/auth/refresh`,
      activate: `${BACKEND_URL}/api/v1/auth/activate`,
      otpSend: `${BACKEND_URL}/api/v1/auth/otp/send`,
      otpVerify: `${BACKEND_URL}/api/v1/auth/otp/verify`,
      otpRegister: `${BACKEND_URL}/api/v1/auth/otp/register`,
    },
    stores: {
      base: `${BACKEND_URL}/api/v1/stores`,
      activeStore: `${BACKEND_URL}/api/v1/stores/active-store`,
      inviteMember: `${BACKEND_URL}/api/v1/stores/members/invite`,
      members: `${BACKEND_URL}/api/v1/stores/members`,
      memberById: (userId: string) => `${BACKEND_URL}/api/v1/stores/members/${userId}`,
      memberPermissions: (userId: string) => `${BACKEND_URL}/api/v1/stores/members/${userId}/permissions`,
    },
    catalog: {
      categories: `${BACKEND_URL}/api/v1/catalog/categories`,
      categoryById: (categoryId: string) => `${BACKEND_URL}/api/v1/catalog/categories/${categoryId}`,
      units: `${BACKEND_URL}/api/v1/catalog/units`,
      unitById: (unitId: string) => `${BACKEND_URL}/api/v1/catalog/units/${unitId}`,
      taxRates: `${BACKEND_URL}/api/v1/catalog/tax-rates`,
      taxRateById: (taxRateId: string) => `${BACKEND_URL}/api/v1/catalog/tax-rates/${taxRateId}`,
      products: `${BACKEND_URL}/api/v1/catalog/products`,
      productById: (productId: string) => `${BACKEND_URL}/api/v1/catalog/products/${productId}`,
      productBatches: (productId: string) => `${BACKEND_URL}/api/v1/catalog/products/${productId}/batches`,
      importCsv: `${BACKEND_URL}/api/v1/catalog/import-csv`,
      aiOnboard: `${BACKEND_URL}/api/v1/catalog/ai-onboard`,
    },
    parties: {
      base: `${BACKEND_URL}/api/v1/parties`,
      partyById: (partyId: string) => `${BACKEND_URL}/api/v1/parties/${partyId}`,
    },
    expenses: {
      base: `${BACKEND_URL}/api/v1/expenses`,
      expenseById: (expenseId: string) => `${BACKEND_URL}/api/v1/expenses/${expenseId}`,
    },
    transactions: {
      sales: `${BACKEND_URL}/api/v1/transactions/sales`,
      saleById: (saleId: string) => `${BACKEND_URL}/api/v1/transactions/sales/${saleId}`,
      purchases: `${BACKEND_URL}/api/v1/transactions/purchases`,
    },
    ledger: {
      base: `${BACKEND_URL}/api/v1/ledger`,
      payments: `${BACKEND_URL}/api/v1/ledger/payments`,
      statement: (partyId: string) => `${BACKEND_URL}/api/v1/ledger/statement/${partyId}`,
    },
    stock: {
      adjust: `${BACKEND_URL}/api/v1/stock/adjust`,
      ledger: `${BACKEND_URL}/api/v1/stock/ledger`,
      lowStockAlerts: `${BACKEND_URL}/api/v1/stock/low-stock-alerts`,
    },
    dashboard: {
      summary: `${BACKEND_URL}/api/v1/dashboard/summary`,
    },
    notifications: {
      base: `${BACKEND_URL}/api/v1/notifications`,
      read: (notificationId: string) => `${BACKEND_URL}/api/v1/notifications/${notificationId}/read`,
    },
    imports: {
      upload: `${BACKEND_URL}/api/v1/imports/upload`,
      batches: `${BACKEND_URL}/api/v1/imports/batches`,
      batchById: (id: string) => `${BACKEND_URL}/api/v1/imports/batches/${id}`,
      review: (id: string) => `${BACKEND_URL}/api/v1/imports/batches/${id}/review`,
      commit: (id: string) => `${BACKEND_URL}/api/v1/imports/batches/${id}/commit`,
      discard: (id: string) => `${BACKEND_URL}/api/v1/imports/batches/${id}/discard`,
      reMatch: (lineId: string) => `${BACKEND_URL}/api/v1/imports/lines/${lineId}/re-match`,
    }
  }
};
