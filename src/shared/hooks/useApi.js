import { useState, useCallback } from 'react';

/**
 * Custom hook for making API requests to our backend.
 * Provides a standardized way to handle API calls, loading states, and errors.
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Make a GET request to the API
   * @param {string} endpoint - The API endpoint to call
   * @param {Object} params - Query parameters to include in the request
   * @returns {Promise} - Promise that resolves with the API response data
   */
  const get = useCallback(async (endpoint, params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construct URL with query parameters
      const url = new URL(`/api${endpoint}`, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => url.searchParams.append(key, item));
          } else {
            url.searchParams.append(key, value);
          }
        }
      });
      
      // Make the request
      const response = await fetch(url.toString());
      const data = await response.json();
      
      // Handle API response
      if (data.status === 'success') {
        setLoading(false);
        return data.data;
      } else {
        throw new Error(data.message || 'API request failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      throw err;
    }
  }, []);
  
  /**
   * Make a POST request to the API
   * @param {string} endpoint - The API endpoint to call
   * @param {Object} data - The data to send in the request body
   * @returns {Promise} - Promise that resolves with the API response data
   */
  const post = useCallback(async (endpoint, data = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Make the request
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      // Handle API response
      if (responseData.status === 'success') {
        setLoading(false);
        return responseData.data;
      } else {
        throw new Error(responseData.message || 'API request failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      throw err;
    }
  }, []);
  
  /**
   * Make a PUT request to the API
   * @param {string} endpoint - The API endpoint to call
   * @param {Object} data - The data to send in the request body
   * @returns {Promise} - Promise that resolves with the API response data
   */
  const put = useCallback(async (endpoint, data = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Make the request
      const response = await fetch(`/api${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      // Handle API response
      if (responseData.status === 'success') {
        setLoading(false);
        return responseData.data;
      } else {
        throw new Error(responseData.message || 'API request failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      throw err;
    }
  }, []);
  
  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - The API endpoint to call
   * @returns {Promise} - Promise that resolves with the API response data
   */
  const del = useCallback(async (endpoint) => {
    setLoading(true);
    setError(null);
    
    try {
      // Make the request
      const response = await fetch(`/api${endpoint}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      // Handle API response
      if (data.status === 'success') {
        setLoading(false);
        return data.data;
      } else {
        throw new Error(data.message || 'API request failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      throw err;
    }
  }, []);
  
  /**
   * Clear any existing errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    get,
    post,
    put,
    del,
    clearError
  };
};

export default useApi; 