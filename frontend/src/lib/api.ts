import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

// Products API
export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (id: number) => api.get(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  generateBarcode: (id: number, format?: string) =>
    api.post(`/products/${id}/generate-barcode`, null, { params: { format } }),
  getLowStock: () => api.get('/products/low-stock'),
};

// Customers API
export const customersApi = {
  getAll: (search?: string) => api.get('/customers', { params: { search } }),
  getOne: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Suppliers API
export const suppliersApi = {
  getAll: (search?: string) => api.get('/suppliers', { params: { search } }),
  getOne: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Warehouses API
export const warehousesApi = {
  getAll: () => api.get('/warehouses'),
  getOne: (id: number) => api.get(`/warehouses/${id}`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: number, data: any) => api.put(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

// Sales API
export const salesApi = {
  getAll: (params?: any) => api.get('/sales', { params }),
  getOne: (id: number) => api.get(`/sales/${id}`),
  createPOS: (data: any) => api.post('/sales/pos', data),
  recordPayment: (id: number, data: any) => api.post(`/sales/${id}/receipt`, data),
  getDailyReport: (date: string) =>
    api.get('/sales/daily-report', { params: { date } }),
};

// Purchases API
export const purchasesApi = {
  getAll: (params?: any) => api.get('/purchases', { params }),
  getOne: (id: number) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post('/purchases', data),
  recordPayment: (id: number, data: any) =>
    api.post(`/purchases/${id}/payment`, data),
};

// Inventory API
export const inventoryApi = {
  getStock: (params?: any) => api.get('/inventory/stock', { params }),
  getMovements: (params?: any) => api.get('/inventory/movements', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
};

// Accounting API
export const accountingApi = {
  getCOA: (type?: string) => api.get('/accounting/coa', { params: { type } }),
  createAccount: (data: any) => api.post('/accounting/coa', data),
  getVouchers: (params?: any) => api.get('/accounting/vouchers', { params }),
  createJournalVoucher: (data: any) =>
    api.post('/accounting/vouchers/journal', data),
  getLedger: (accountId: number, params?: any) =>
    api.get(`/accounting/ledger/${accountId}`, { params }),
  getProfitAndLoss: (startDate: string, endDate: string) =>
    api.get('/accounting/pnl', { params: { startDate, endDate } }),
  getTrialBalance: (date: string) =>
    api.get('/accounting/trial-balance', { params: { date } }),
};

// Reports API
export const reportsApi = {
  getSalesSummary: (startDate: string, endDate: string) =>
    api.get('/reports/sales/summary', { params: { startDate, endDate } }),
  getDailySales: (startDate: string, endDate: string) =>
    api.get('/reports/sales/daily', { params: { startDate, endDate } }),
  getTopProducts: (startDate: string, endDate: string, limit?: number) =>
    api.get('/reports/sales/top-products', {
      params: { startDate, endDate, limit },
    }),
  getStockReorder: () => api.get('/reports/stock/reorder'),
  getInventoryValuation: () => api.get('/reports/stock/valuation'),
  getPurchasesSummary: (startDate: string, endDate: string) =>
    api.get('/reports/purchases/summary', { params: { startDate, endDate } }),
  getInventoryMovements: (startDate: string, endDate: string) =>
    api.get('/reports/inventory/movements', { params: { startDate, endDate } }),
};


