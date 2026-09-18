import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agriowl_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productApi = {
  getCategories: () => api.get('/categories/'),
  getProducts: (params) => api.get('/products/', { params }),
  getProductDetail: (id) => api.get(`/products/${id}/`),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.put(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
};

export const orderApi = {
  createOrder: (data) => api.post('/orders/create/', data),
  getOrders: (params) => api.get('/orders/', { params }),
  getOrderDetail: (orderId) => api.get(`/orders/${orderId}/`),
  updateOrderStatus: (orderId, data) => api.post(`/orders/${orderId}/status/`, data),
  getOrderTracking: (orderId) => api.get(`/orders/${orderId}/tracking/`),
  deleteOrder: (orderId) => api.delete(`/orders/${orderId}/delete/`),
};

export const paymentApi = {
  // Step 1 of online payment: ask backend to open a matching Razorpay Order for an AgriOwl order
  createRazorpayOrder: (orderId) => api.post(`/orders/${orderId}/razorpay/create/`),
  // Step 2: send back what Razorpay Checkout returned so the backend can verify the signature
  verifyRazorpayPayment: (orderId, data) => api.post(`/orders/${orderId}/razorpay/verify/`, data),
};

export const mlApi = {
  getRecommendation: (crop, problem) => api.post('/ml/recommend/', { crop, problem }),
};

export const authApi = {
  login: (data) => api.post('/login/', data),
  register: (data) => api.post('/register/', data),
  getProfile: () => api.get('/profile/'),
  updateProfile: (data) => api.put('/profile/', data),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats/'),
  getNotifications: () => api.get('/notifications/'),
  markNotificationRead: (id) => api.patch(`/notifications/${id}/read/`),
  deleteNotification: (id) => api.delete(`/notifications/${id}/delete/`),
  getFarmers: () => api.get('/admin/farmers/'),
  toggleFarmer: (id) => api.post(`/admin/farmers/${id}/toggle/`),
  getRevenue: () => api.get('/admin/revenue/'),
  getInventory: () => api.get('/admin/inventory/'),
};

export default api;

