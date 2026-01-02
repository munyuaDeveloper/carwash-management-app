/**
 * Axios Configuration
 * Centralized axios instance configuration with interceptors
 * Provides request/response handling, authentication, and error management
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from './api';
import { showToast } from '../utils/toast';

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

    // Extract error message from response
    const getErrorMessage = (): string => {
      if (error.response?.data) {
        const data = error.response.data as any;
        if (data.message) {
          return data.message;
        }
        if (data.error) {
          return data.error;
        }
        if (typeof data === 'string') {
          return data;
        }
      }
      return error.message || 'An error occurred';
    };

    // Skip showing toast for authentication endpoints - they're handled in their respective screens
    const url = error.config?.url || '';
    // Check for auth endpoints - handle both relative paths and full URLs
    const isAuthEndpoint =
      url.includes('/login') ||
      url.includes('/signup') ||
      url.includes('/forgotPassword') ||
      url.includes('/resetPassword') ||
      url.includes('users/login') ||
      url.includes('users/signup') ||
      url.includes('users/forgotPassword') ||
      url.includes('users/resetPassword') ||
      url.endsWith('/login') ||
      url.endsWith('/signup');

    // Safely show toast with error handling to prevent crashes
    // Skip entirely for auth endpoints to avoid showing errors during login/signup
    const safeShowToast = (message: string) => {
      // Early return for auth endpoints - don't show any toast
      if (isAuthEndpoint) {
        return;
      }

      try {
        showToast.error(message);
      } catch (toastError) {
        // Silently fail if toast can't be shown (prevents crash)
        console.warn('[Toast Error]:', toastError);
      }
    };

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorMessage = getErrorMessage();

      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.warn('[Auth] Authentication failed - token may be expired');
          safeShowToast(errorMessage || 'Authentication failed. Please log in again.');
          // You can dispatch logout action here if using Redux
          break;
        case 403:
          // Forbidden - insufficient permissions
          console.warn('[Auth] Access forbidden - insufficient permissions');
          safeShowToast(errorMessage || 'You do not have permission to perform this action.');
          break;
        case 404:
          // Not found
          console.warn('[404] Resource not found');
          safeShowToast(errorMessage || 'Resource not found.');
          break;
        case 422:
          // Validation error
          console.warn('[Validation] Validation error:', (data as any)?.message || data);
          safeShowToast(errorMessage || 'Validation error. Please check your input.');
          break;
        case 500:
          // Server error
          console.error('[Server] Server error');
          safeShowToast(errorMessage || 'Server error. Please try again later.');
          break;
        default:
          console.error(`[HTTP] Error ${status}: ${errorMessage}`);
          safeShowToast(errorMessage || `Error ${status}. Please try again.`);
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('[Network] Network Error:', error.message);
      safeShowToast('Network error. Please check your internet connection.');
    } else {
      // Request setup error
      console.error('[Setup] Request Setup Error:', error.message);
      safeShowToast(error.message || 'Request failed. Please try again.');
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
