/**
 * API Service with Axios
 * Enhanced API service using axios instance with better error handling and interceptors
 * Maintains the same interface as the original API service
 */

import axiosInstance, { setAuthToken, clearAuthToken } from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { AxiosError } from 'axios';

// Re-export types from the original API service for consistency
export type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  User,
  VehicleBookingRequest,
  CarpetBookingRequest,
  Booking,
  Wallet,
  SystemWallet,
  DailySummary,
} from './api';

/**
 * Enhanced error handling for axios requests
 */
const handleApiError = (error: AxiosError): { status: 'error'; error: string } => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = (data as any)?.message || `HTTP error! status: ${status}`;
    return { status: 'error', error: message };
  } else if (error.request) {
    // Network error
    return { status: 'error', error: 'Network error - please check your connection' };
  } else {
    // Request setup error
    return { status: 'error', error: error.message || 'An unknown error occurred' };
  }
};

/**
 * Generic API request function using axios
 */
const apiRequest = async <T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    params?: any;
    headers?: Record<string, string>;
    token?: string;
  } = {}
): Promise<{ status: 'success' | 'error'; data?: T; error?: string }> => {
  try {
    const { method = 'GET', data, params, headers = {}, token } = options;

    // Set auth token if provided
    if (token) {
      setAuthToken(token);
    }

    const response = await axiosInstance({
      url: endpoint,
      method,
      data,
      params,
      headers,
    });

    return {
      status: 'success',
      data: response.data,
    };
  } catch (error) {
    const errorResult = handleApiError(error as AxiosError);
    return errorResult;
  }
};

/**
 * Authentication API calls
 */
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    return apiRequest(API_ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      data: credentials,
    });
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    role: 'attendant' | 'admin';
    phone?: string;
    photo?: string;
  }) => {
    return apiRequest(API_ENDPOINTS.USER_SIGNUP, {
      method: 'POST',
      data: userData,
    });
  },

  logout: async (token: string) => {
    const result = await apiRequest(API_ENDPOINTS.USER_LOGOUT, {
      method: 'GET',
      token,
    });
    // Clear token after logout
    clearAuthToken();
    return result;
  },

  forgotPassword: async (request: { email: string }) => {
    return apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      data: request,
    });
  },

  resetPassword: async (resetToken: string, request: { password: string; passwordConfirm: string }) => {
    return apiRequest(`${API_ENDPOINTS.RESET_PASSWORD}/${resetToken}`, {
      method: 'PATCH',
      data: request,
    });
  },

  updatePassword: async (request: { passwordCurrent: string; password: string; passwordConfirm: string }, authToken: string) => {
    return apiRequest(API_ENDPOINTS.UPDATE_PASSWORD, {
      method: 'PATCH',
      data: request,
      token: authToken,
    });
  },
};

/**
 * User management API calls
 */
export const userApi = {
  getCurrentUser: async (token: string) => {
    return apiRequest(API_ENDPOINTS.GET_CURRENT_USER, {
      method: 'GET',
      token,
    });
  },

  deleteCurrentUser: async (token: string) => {
    return apiRequest(API_ENDPOINTS.DELETE_CURRENT_USER, {
      method: 'DELETE',
      token,
    });
  },

  getAllUsers: async (token: string, role?: 'attendant' | 'admin') => {
    const params = role ? { role } : {};
    return apiRequest(API_ENDPOINTS.GET_ALL_USERS, {
      method: 'GET',
      params,
      token,
    });
  },

  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    role: 'attendant' | 'admin';
    phone?: string;
    photo?: string;
  }, token: string) => {
    return apiRequest(API_ENDPOINTS.CREATE_USER, {
      method: 'POST',
      data: userData,
      token,
    });
  },

  getUserById: async (id: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_USER_BY_ID}/${id}`, {
      method: 'GET',
      token,
    });
  },

  updateUser: async (id: string, userData: any, token: string) => {
    return apiRequest(`${API_ENDPOINTS.UPDATE_USER}/${id}`, {
      method: 'PATCH',
      data: userData,
      token,
    });
  },

  deleteUser: async (id: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.DELETE_USER}/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

/**
 * Booking API calls
 */
export const bookingApi = {
  getAllBookings: async (token: string, filters?: {
    createdAt?: { gte?: string; lte?: string };
    amount?: { gte?: number; lte?: number };
    sort?: string;
    page?: number;
    limit?: number;
    fields?: string;
  }) => {
    const params: any = {};

    if (filters) {
      if (filters.createdAt?.gte) params['createdAt[gte]'] = filters.createdAt.gte;
      if (filters.createdAt?.lte) params['createdAt[lte]'] = filters.createdAt.lte;
      if (filters.amount?.gte) params['amount[gte]'] = filters.amount.gte;
      if (filters.amount?.lte) params['amount[lte]'] = filters.amount.lte;
      if (filters.sort) params.sort = filters.sort;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.fields) params.fields = filters.fields;
    }

    return apiRequest(API_ENDPOINTS.GET_ALL_BOOKINGS, {
      method: 'GET',
      params,
      token,
    });
  },

  createVehicleBooking: async (bookingData: {
    carRegistrationNumber: string;
    attendant: string;
    amount: number;
    serviceType: 'full wash' | 'half wash';
    vehicleType: string;
    category: 'vehicle';
    paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
    status?: 'pending' | 'in progress' | 'completed' | 'cancelled';
  }, token: string) => {
    return apiRequest(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      data: bookingData,
      token,
    });
  },

  createCarpetBooking: async (bookingData: {
    phoneNumber: string;
    color: string;
    attendant: string;
    amount: number;
    category: 'carpet';
    paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
    status?: 'pending' | 'in progress' | 'completed' | 'cancelled';
  }, token: string) => {
    return apiRequest(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      data: bookingData,
      token,
    });
  },

  getBookingById: async (id: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKING_BY_ID}/${id}`, {
      method: 'GET',
      token,
    });
  },

  updateBooking: async (id: string, bookingData: any, token: string) => {
    return apiRequest(`${API_ENDPOINTS.UPDATE_BOOKING}/${id}`, {
      method: 'PATCH',
      data: bookingData,
      token,
    });
  },

  deleteBooking: async (id: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.DELETE_BOOKING}/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  getBookingsByAttendant: async (attendantId: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKINGS_BY_ATTENDANT}/${attendantId}`, {
      method: 'GET',
      token,
    });
  },

  getBookingsByStatus: async (status: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKINGS_BY_STATUS}/${status}`, {
      method: 'GET',
      token,
    });
  },
};

/**
 * Wallet management API calls
 */
export const walletApi = {
  getMyWallet: async (token: string, date?: string) => {
    const params = date ? { date } : {};
    return apiRequest(API_ENDPOINTS.GET_MY_WALLET, {
      method: 'GET',
      params,
      token,
    });
  },

  settleAttendantBalances: async (attendantIds: string[], token: string) => {
    return apiRequest(API_ENDPOINTS.SETTLE_ATTENDANT_BALANCES, {
      method: 'POST',
      data: { attendantIds },
      token,
    });
  },

  getDailyWalletSummary: async (token: string, date?: string) => {
    const params = date ? { date } : {};
    return apiRequest(API_ENDPOINTS.GET_DAILY_WALLET_SUMMARY, {
      method: 'GET',
      params,
      token,
    });
  },

  getAllWallets: async (token: string, date?: string) => {
    const params = date ? { date } : {};
    return apiRequest(API_ENDPOINTS.GET_ALL_WALLETS, {
      method: 'GET',
      params,
      token,
    });
  },

  getWalletSummary: async (token: string) => {
    return apiRequest(API_ENDPOINTS.GET_WALLET_SUMMARY, {
      method: 'GET',
      token,
    });
  },

  getCompanyDebtSummary: async (token: string) => {
    return apiRequest(API_ENDPOINTS.GET_COMPANY_DEBT_SUMMARY, {
      method: 'GET',
      token,
    });
  },

  getUnpaidWallets: async (token: string) => {
    return apiRequest(API_ENDPOINTS.GET_UNPAID_WALLETS, {
      method: 'GET',
      token,
    });
  },

  getSystemWallet: async (token: string) => {
    return apiRequest(API_ENDPOINTS.GET_SYSTEM_WALLET, {
      method: 'GET',
      token,
    });
  },

  getSystemWalletSummary: async (token: string) => {
    return apiRequest(API_ENDPOINTS.GET_SYSTEM_WALLET_SUMMARY, {
      method: 'GET',
      token,
    });
  },

  getAttendantWallet: async (attendantId: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_WALLET}/${attendantId}`, {
      method: 'GET',
      token,
    });
  },

  getAttendantDebtDetails: async (attendantId: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_DEBT_DETAILS}/${attendantId}/debt`, {
      method: 'GET',
      token,
    });
  },

  markAttendantPaid: async (attendantId: string, token: string) => {
    const endpoint = `${API_ENDPOINTS.MARK_ATTENDANT_PAID}/${attendantId}/mark-paid`;
    console.log('Marking attendant as paid:', { attendantId, endpoint });
    return apiRequest(endpoint, {
      method: 'PATCH',
      token,
    });
  },

  rebuildWalletBalance: async (attendantId: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.REBUILD_WALLET_BALANCE}/${attendantId}/rebuild`, {
      method: 'PATCH',
      token,
    });
  },

  getAttendantBookings: async (attendantId: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_BOOKINGS}/${attendantId}/bookings`, {
      method: 'GET',
      token,
    });
  },

  getMyBookings: async (token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_BOOKINGS}/my-wallet/bookings`, {
      method: 'GET',
      token,
    });
  },

  getBookingDetails: async (bookingId: string, token: string) => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKING_DETAILS}/${bookingId}`, {
      method: 'GET',
      token,
    });
  },
};

// Export the axios instance for direct use if needed
export { axiosInstance, setAuthToken, clearAuthToken };
