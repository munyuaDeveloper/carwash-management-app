/**
 * API Configuration
 * Centralized configuration for API endpoints and base URL
 * Based on the actual backend API documentation
 */

// For React Native/Expo, you'll need to use expo-constants to access environment variables
import Constants from 'expo-constants';

// Get the API base URL from environment variables
export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'https://carwash-backend-sandy.vercel.app';

// API version prefix
const API_VERSION = '/api/v1';

// API endpoints based on actual backend documentation
export const API_ENDPOINTS = {
  // Authentication endpoints
  USER_SIGNUP: `${API_VERSION}/users/signup`,
  USER_LOGIN: `${API_VERSION}/users/login`,
  USER_LOGOUT: `${API_VERSION}/users/logout`,
  FORGOT_PASSWORD: `${API_VERSION}/users/forgotPassword`,
  RESET_PASSWORD: `${API_VERSION}/users/resetPassword`,
  UPDATE_PASSWORD: `${API_VERSION}/users/updateMyPassword`,

  // User management endpoints
  GET_CURRENT_USER: `${API_VERSION}/users/me`,
  DELETE_CURRENT_USER: `${API_VERSION}/users/deleteMe`,
  GET_ALL_USERS: `${API_VERSION}/users`,
  CREATE_USER: `${API_VERSION}/users`,
  GET_USER_BY_ID: `${API_VERSION}/users`,
  UPDATE_USER: `${API_VERSION}/users`,
  DELETE_USER: `${API_VERSION}/users`,

  // Booking management endpoints
  GET_ALL_BOOKINGS: `${API_VERSION}/bookings`,
  CREATE_BOOKING: `${API_VERSION}/bookings`,
  GET_BOOKING_BY_ID: `${API_VERSION}/bookings`,
  UPDATE_BOOKING: `${API_VERSION}/bookings`,
  DELETE_BOOKING: `${API_VERSION}/bookings`,
  GET_BOOKINGS_BY_ATTENDANT: `${API_VERSION}/bookings/attendant`,
  GET_BOOKINGS_BY_STATUS: `${API_VERSION}/bookings/status`,

  // Wallet management endpoints
  GET_MY_WALLET: `${API_VERSION}/wallets/my-wallet`,
  SETTLE_ATTENDANT_BALANCES: `${API_VERSION}/wallets/settle`,
  GET_DAILY_WALLET_SUMMARY: `${API_VERSION}/wallets/daily-summary`,
  GET_ALL_WALLETS: `${API_VERSION}/wallets`,
  GET_WALLET_SUMMARY: `${API_VERSION}/wallets/summary`,
  GET_COMPANY_DEBT_SUMMARY: `${API_VERSION}/wallets/debt-summary`,
  GET_UNPAID_WALLETS: `${API_VERSION}/wallets/unpaid`,
  GET_SYSTEM_WALLET: `${API_VERSION}/wallets/system`,
  GET_SYSTEM_WALLET_SUMMARY: `${API_VERSION}/wallets/system/summary`,
  GET_ATTENDANT_WALLET: `${API_VERSION}/wallets`,
  GET_ATTENDANT_DEBT_DETAILS: `${API_VERSION}/wallets`,
  MARK_ATTENDANT_PAID: `${API_VERSION}/wallets`,
  REBUILD_WALLET_BALANCE: `${API_VERSION}/wallets`,
  GET_ATTENDANT_BOOKINGS: `${API_VERSION}/wallets`,
  GET_BOOKING_DETAILS: `${API_VERSION}/wallets/bookings`,

  // Stats endpoints
  GET_STATS: `${API_VERSION}/stats`,
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get API headers
export const getApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
