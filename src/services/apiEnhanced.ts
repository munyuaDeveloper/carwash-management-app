/**
 * Enhanced API Service
 * Combines the original fetch-based API with axios for better error handling and interceptors
 * Provides both fetch and axios implementations for gradual migration
 */

import { API_BASE_URL, buildApiUrl, getApiHeaders, API_ENDPOINTS } from '../config/api';
import axiosInstance, { setAuthToken, clearAuthToken } from '../config/axios';
import { AxiosError } from 'axios';

// Import and re-export all types from the original API service
import type {
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

// Stats types
export interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  todayTotalBookings: number;
}

// Re-export types
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
};

/**
 * Enhanced error handling for axios requests
 */
const handleAxiosError = (error: AxiosError): ApiResponse => {
  if (error.response) {
    const { status, data } = error.response;
    const message = (data as any)?.message || `HTTP error! status: ${status}`;
    return { status: 'error', error: message };
  } else if (error.request) {
    return { status: 'error', error: 'Network error - please check your connection' };
  } else {
    return { status: 'error', error: error.message || 'An unknown error occurred' };
  }
};

/**
 * Generic API request function using axios (recommended)
 */
const apiRequestAxios = async <T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    params?: any;
    headers?: Record<string, string>;
    token?: string;
  } = {}
): Promise<ApiResponse<T>> => {
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
    return handleAxiosError(error as AxiosError);
  }
};

/**
 * Generic API request function using fetch (original implementation)
 */
const apiRequestFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getApiHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        error: data.message || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      status: 'success',
      data,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};

// Choose which implementation to use (axios is recommended)
const apiRequest = apiRequestAxios;

/**
 * Authentication API calls
 */
export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<{ token: string; data: { user: User } }>> => {
    return apiRequest(API_ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      data: credentials,
    });
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiRequest(API_ENDPOINTS.USER_SIGNUP, {
      method: 'POST',
      data: userData,
    });
  },

  logout: async (token: string): Promise<ApiResponse> => {
    const result = await apiRequest(API_ENDPOINTS.USER_LOGOUT, {
      method: 'GET',
      token,
    });
    // Clear token after logout
    clearAuthToken();
    return result;
  },

  forgotPassword: async (request: ForgotPasswordRequest): Promise<ApiResponse> => {
    return apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      data: request,
    });
  },

  resetPassword: async (resetToken: string, request: ResetPasswordRequest): Promise<ApiResponse> => {
    return apiRequest(`${API_ENDPOINTS.RESET_PASSWORD}/${resetToken}`, {
      method: 'PATCH',
      data: request,
    });
  },

  updatePassword: async (request: UpdatePasswordRequest, authToken: string): Promise<ApiResponse> => {
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
  getCurrentUser: async (token: string): Promise<ApiResponse<User>> => {
    return apiRequest(API_ENDPOINTS.GET_CURRENT_USER, {
      method: 'GET',
      token,
    });
  },

  deleteCurrentUser: async (token: string): Promise<ApiResponse> => {
    return apiRequest(API_ENDPOINTS.DELETE_CURRENT_USER, {
      method: 'DELETE',
      token,
    });
  },

  getAllUsers: async (token: string, role?: 'attendant' | 'admin'): Promise<ApiResponse<User[]>> => {
    const params = role ? { role } : {};
    return apiRequest(API_ENDPOINTS.GET_ALL_USERS, {
      method: 'GET',
      params,
      token,
    });
  },

  createUser: async (userData: RegisterRequest, token: string): Promise<ApiResponse<User>> => {
    return apiRequest(API_ENDPOINTS.CREATE_USER, {
      method: 'POST',
      data: userData,
      token,
    });
  },

  getUserById: async (id: string, token: string): Promise<ApiResponse<User>> => {
    return apiRequest(`${API_ENDPOINTS.GET_USER_BY_ID}/${id}`, {
      method: 'GET',
      token,
    });
  },

  updateUser: async (id: string, userData: Partial<RegisterRequest>, token: string): Promise<ApiResponse<User>> => {
    return apiRequest(`${API_ENDPOINTS.UPDATE_USER}/${id}`, {
      method: 'PATCH',
      data: userData,
      token,
    });
  },

  deleteUser: async (id: string, token: string): Promise<ApiResponse> => {
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
  }): Promise<ApiResponse<Booking[]>> => {
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

  createVehicleBooking: async (bookingData: VehicleBookingRequest, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      data: bookingData,
      token,
    });
  },

  createCarpetBooking: async (bookingData: CarpetBookingRequest, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      data: bookingData,
      token,
    });
  },

  getBookingById: async (id: string, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKING_BY_ID}/${id}`, {
      method: 'GET',
      token,
    });
  },

  updateBooking: async (id: string, bookingData: Partial<VehicleBookingRequest | CarpetBookingRequest>, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(`${API_ENDPOINTS.UPDATE_BOOKING}/${id}`, {
      method: 'PATCH',
      data: bookingData,
      token,
    });
  },

  deleteBooking: async (id: string, token: string): Promise<ApiResponse> => {
    return apiRequest(`${API_ENDPOINTS.DELETE_BOOKING}/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  getBookingsByAttendant: async (attendantId: string, token: string): Promise<ApiResponse<Booking[]>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKINGS_BY_ATTENDANT}/${attendantId}`, {
      method: 'GET',
      token,
    });
  },

  getBookingsByStatus: async (status: string, token: string): Promise<ApiResponse<Booking[]>> => {
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
  getMyWallet: async (token: string, date?: string): Promise<ApiResponse<{ wallet: Wallet; date: string }>> => {
    const params = date ? { date } : {};
    return apiRequest(API_ENDPOINTS.GET_MY_WALLET, {
      method: 'GET',
      params,
      token,
    });
  },

  settleAttendantBalances: async (attendantIds: string[], token: string): Promise<ApiResponse<{
    settledWallets: Array<{
      attendantId: string;
      attendantName: string;
      attendantEmail: string;
      wallet: Wallet;
      bookingsUpdated: number;
    }>;
    errors: any[];
  }>> => {
    return apiRequest(API_ENDPOINTS.SETTLE_ATTENDANT_BALANCES, {
      method: 'POST',
      data: { attendantIds },
      token,
    });
  },

  getDailyWalletSummary: async (token: string, date?: string): Promise<ApiResponse<{ summary: DailySummary }>> => {
    const params = date ? { date } : {};
    return apiRequest(API_ENDPOINTS.GET_DAILY_WALLET_SUMMARY, {
      method: 'GET',
      params,
      token,
    });
  },

  getAllWallets: async (token: string, date?: string): Promise<ApiResponse<Wallet[]>> => {
    const params = date ? { date } : {};
    return apiRequest(API_ENDPOINTS.GET_ALL_WALLETS, {
      method: 'GET',
      params,
      token,
    });
  },

  getWalletSummary: async (token: string): Promise<ApiResponse<any>> => {
    return apiRequest(API_ENDPOINTS.GET_WALLET_SUMMARY, {
      method: 'GET',
      token,
    });
  },

  getCompanyDebtSummary: async (token: string): Promise<ApiResponse<any>> => {
    return apiRequest(API_ENDPOINTS.GET_COMPANY_DEBT_SUMMARY, {
      method: 'GET',
      token,
    });
  },

  getUnpaidWallets: async (token: string): Promise<ApiResponse<Wallet[]>> => {
    return apiRequest(API_ENDPOINTS.GET_UNPAID_WALLETS, {
      method: 'GET',
      token,
    });
  },

  getSystemWallet: async (token: string): Promise<ApiResponse<{ systemWallet: SystemWallet }>> => {
    return apiRequest(API_ENDPOINTS.GET_SYSTEM_WALLET, {
      method: 'GET',
      token,
    });
  },

  getSystemWalletSummary: async (token: string): Promise<ApiResponse<{
    summary: {
      systemWallet: SystemWallet;
      totalAttendantDebts: number;
      netCompanyBalance: number;
    };
  }>> => {
    return apiRequest(API_ENDPOINTS.GET_SYSTEM_WALLET_SUMMARY, {
      method: 'GET',
      token,
    });
  },

  getAttendantWallet: async (attendantId: string, token: string): Promise<ApiResponse<Wallet>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_WALLET}/${attendantId}`, {
      method: 'GET',
      token,
    });
  },

  getAttendantDebtDetails: async (attendantId: string, token: string): Promise<ApiResponse<any>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_DEBT_DETAILS}/${attendantId}/debt`, {
      method: 'GET',
      token,
    });
  },

  markAttendantPaid: async (attendantId: string, token: string): Promise<ApiResponse<Wallet>> => {
    return apiRequest(`${API_ENDPOINTS.MARK_ATTENDANT_PAID}/${attendantId}/mark-paid`, {
      method: 'PATCH',
      token,
    });
  },

  rebuildWalletBalance: async (attendantId: string, token: string): Promise<ApiResponse<{ wallet: Wallet }>> => {
    return apiRequest(`${API_ENDPOINTS.REBUILD_WALLET_BALANCE}/${attendantId}/rebuild`, {
      method: 'PATCH',
      token,
    });
  },

  getAttendantBookings: async (attendantId: string, token: string): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_BOOKINGS}/${attendantId}/bookings`, {
      method: 'GET',
      token,
    });
  },

  getMyBookings: async (token: string): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_BOOKINGS}/my-wallet/bookings`, {
      method: 'GET',
      token,
    });
  },

  getBookingDetails: async (bookingId: string, token: string): Promise<ApiResponse<{ booking: Booking }>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKING_DETAILS}/${bookingId}`, {
      method: 'GET',
      token,
    });
  },
};

/**
 * Stats API calls
 */
export const statsApi = {
  getStats: async (token: string): Promise<ApiResponse<{ stats: Stats }>> => {
    return apiRequest(API_ENDPOINTS.GET_STATS, {
      method: 'GET',
      token,
    });
  },
};

// Export the axios instance and utilities for direct use
export { axiosInstance, setAuthToken, clearAuthToken };
