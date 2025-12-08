import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iris_token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('iris_token');
      localStorage.removeItem('iris_user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  verify: () => api.get('/auth/verify'),
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  
  updateProfile: (formData: FormData) =>
    api.put('/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  deleteAccount: () => api.delete('/profile'),
};

// Payment API
export const paymentAPI = {
  createOrder: (amount: number, planName: string) =>
    api.post('/payment/create-order', { amount, planName }),
  
  verifyPayment: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planName: string;
  }) => api.post('/payment/verify-payment', paymentData),
  
  getSubscriptionStatus: () => api.get('/payment/subscription-status'),
};

export default api;
