import axios from 'axios';

// Set up base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.orderly-app.com';

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (web) or AsyncStorage (mobile)
    const token = typeof window !== 'undefined' ? localStorage.getItem('orderlyAuthToken') : null;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orderlyAuthToken');
      }
      
      // Redirect to login (handled differently in web vs mobile)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API service methods
const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
  },
  
  // Admin endpoints
  admin: {
    login: (credentials) => api.post('/admin/login', credentials),
    getVendors: () => api.get('/admin/vendors'),
    approveVendor: (vendorId) => api.post(`/admin/vendors/${vendorId}/approve`),
    rejectVendor: (vendorId, reason) => api.post(`/admin/vendors/${vendorId}/reject`, { reason }),
    getUsers: () => api.get('/admin/users'),
  },
  
  // Food endpoints
  food: {
    getAll: (params) => api.get('/foods', { params }),
    getById: (id) => api.get(`/foods/${id}`),
    getFeatured: () => api.get('/foods/featured'),
  },
  
  // Restaurant endpoints
  restaurants: {
    getAll: (params) => api.get('/restaurants', { params }),
    getById: (id) => api.get(`/restaurants/${id}`),
    getMenu: (id) => api.get(`/restaurants/${id}/menu`),
  },
  
  // Order endpoints
  orders: {
    create: (orderData) => api.post('/orders', orderData),
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  },
  
  // User profile endpoints
  user: {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (profileData) => api.put('/user/profile', profileData),
    getAddresses: () => api.get('/user/addresses'),
    addAddress: (addressData) => api.post('/user/addresses', addressData),
    deleteAddress: (id) => api.delete(`/user/addresses/${id}`),
  }
};

export default apiService; 