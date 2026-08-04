import axios from 'axios';

// Base configuration for API requests
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.orderly-app.example';

// Create axios instance for auth requests
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
authApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('orderlyAuthToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('orderlyRefreshToken');
        if (refreshToken) {
          const response = await authApi.post('/auth/refresh-token', { refreshToken });
          const { token } = response.data;
          
          // Update the token in localStorage
          localStorage.setItem('orderlyAuthToken', token);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return authApi(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('orderlyAuthToken');
          localStorage.removeItem('orderlyRefreshToken');
          localStorage.removeItem('orderlyUserData');
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Authentication service with methods for login, signup, etc.
 */
const authService = {
  /**
   * Login with email and password
   * @param {Object} credentials - The user credentials
   * @param {string} credentials.email - The user's email
   * @param {string} credentials.password - The user's password
   * @returns {Promise<Object>} - The authentication response
   */
  async login(credentials) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.post('/auth/login', credentials);
      // return response.data;
      
      // For development, simulate a successful response
      return {
        token: `mock-auth-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        user: {
          id: '1',
          name: credentials.email.split('@')[0] || 'User',
          email: credentials.email,
          role: 'restaurant_manager',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },
  
  /**
   * Sign up a new user
   * @param {Object} userData - The user data
   * @returns {Promise<Object>} - The authentication response
   */
  async signup(userData) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.post('/auth/signup', userData);
      // return response.data;
      
      // For development, simulate a successful response
      return {
        token: `mock-auth-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        user: {
          id: Date.now().toString(),
          name: userData.name || userData.email.split('@')[0],
          email: userData.email,
          role: 'restaurant_manager',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  },
  
  /**
   * Log out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // In a real app, you might want to invalidate the token on the server
      // await authApi.post('/auth/logout');
      
      // For development, just clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orderlyAuthToken');
        localStorage.removeItem('orderlyRefreshToken');
        localStorage.removeItem('orderlyUserData');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if the API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orderlyAuthToken');
        localStorage.removeItem('orderlyRefreshToken');
        localStorage.removeItem('orderlyUserData');
      }
    }
  },
  
  /**
   * Authenticate with Google
   * @param {string} idToken - The Google ID token
   * @returns {Promise<Object>} - The authentication response
   */
  async loginWithGoogle(idToken) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.post('/auth/google', { idToken });
      // return response.data;
      
      // For development, simulate a successful response
      // We'd normally decode the ID token to get user info
      return {
        token: `mock-google-auth-token-${Date.now()}`,
        refreshToken: `mock-google-refresh-token-${Date.now()}`,
        user: {
          id: `google-user-${Date.now()}`,
          name: 'Google User',
          email: 'user@gmail.com',
          profilePicture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          role: 'restaurant_manager',
          authProvider: 'google',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Google authentication failed');
    }
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - The updated profile data
   * @returns {Promise<Object>} - The updated user data
   */
  async updateProfile(profileData) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.put('/user/profile', profileData);
      // return response.data;
      
      // For development, simulate a successful response
      return {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  },
  
  /**
   * Change password
   * @param {Object} passwordData - The password data
   * @param {string} passwordData.currentPassword - The current password
   * @param {string} passwordData.newPassword - The new password
   * @returns {Promise<Object>} - The response
   */
  async changePassword(passwordData) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.post('/user/change-password', passwordData);
      // return response.data;
      
      // For development, simulate a successful response
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  },
  
  /**
   * Request password reset
   * @param {string} email - The user's email
   * @returns {Promise<Object>} - The response
   */
  async requestPasswordReset(email) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.post('/auth/request-reset', { email });
      // return response.data;
      
      // For development, simulate a successful response
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  },
  
  /**
   * Reset password using token
   * @param {Object} resetData - The reset data
   * @param {string} resetData.token - The reset token
   * @param {string} resetData.newPassword - The new password
   * @returns {Promise<Object>} - The response
   */
  async resetPassword(resetData) {
    try {
      // In a real app, this would be an API call
      // const response = await authApi.post('/auth/reset-password', resetData);
      // return response.data;
      
      // For development, simulate a successful response
      return {
        success: true,
        message: 'Password reset successful'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  },
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} - Whether the user is authenticated
   */
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('orderlyAuthToken');
  },
  
  /**
   * Get the authentication token
   * @returns {string|null} - The authentication token or null if not logged in
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('orderlyAuthToken');
  }
};

export default authService; 