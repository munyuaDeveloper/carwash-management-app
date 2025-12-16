/**
 * Axios Configuration
 * Centralized axios instance configuration with interceptors
 * Provides request/response handling, authentication, and error management
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from './api';

// Create axios instance with default configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add authentication token and logging
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from AsyncStorage (you'll need to import AsyncStorage)
    // For now, we'll handle token injection in the API calls
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error: AxiosError) => {
    console.error('[Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API Error]:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
    });

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.warn('[Auth] Authentication failed - token may be expired');
          // You can dispatch logout action here if using Redux
          break;
        case 403:
          // Forbidden - insufficient permissions
          console.warn('[Auth] Access forbidden - insufficient permissions');
          break;
        case 404:
          // Not found
          console.warn('[404] Resource not found');
          break;
        case 422:
          // Validation error
          console.warn('[Validation] Validation error:', (data as any)?.message || data);
          break;
        case 500:
          // Server error
          console.error('[Server] Server error');
          break;
        default:
          console.error(`[HTTP] Error ${status}: ${(data as any)?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('[Network] Network Error:', error.message);
    } else {
      // Request setup error
      console.error('[Setup] Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to set authentication token
export const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Helper function to clear authentication token
export const clearAuthToken = () => {
  delete axiosInstance.defaults.headers.common['Authorization'];
};

// Helper function to get current token
export const getAuthToken = (): string | null => {
  return axiosInstance.defaults.headers.common['Authorization']?.toString().replace('Bearer ', '') || null;
};

// Export the configured axios instance
export default axiosInstance;

// Export types for use in other files
export type { InternalAxiosRequestConfig, AxiosResponse, AxiosError };
