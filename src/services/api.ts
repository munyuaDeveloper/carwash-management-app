/**
 * API Service
 * Centralized API service for making HTTP requests to the backend
 * Based on the actual backend API documentation
 */

import { API_BASE_URL, buildApiUrl, getApiHeaders, API_ENDPOINTS } from '../config/api';

// Types for API responses based on backend documentation
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  results?: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: 'attendant' | 'admin';
  phone?: string;
  photo?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  passwordConfirm: string;
}

export interface UpdatePasswordRequest {
  passwordCurrent: string;
  password: string;
  passwordConfirm: string;
}

// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'attendant' | 'admin';
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking types based on backend documentation
export interface VehicleBookingRequest {
  carRegistrationNumber: string;
  attendant: string; // ObjectId of the attendant
  amount: number;
  serviceType: 'full wash' | 'half wash';
  vehicleType: string;
  category: 'vehicle';
  paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
  status?: 'pending' | 'in progress' | 'completed' | 'cancelled';
}

export interface CarpetBookingRequest {
  phoneNumber: string;
  color: string;
  attendant: string; // ObjectId of the attendant
  amount: number;
  category: 'carpet';
  paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
  status?: 'pending' | 'in progress' | 'completed' | 'cancelled';
}

export interface Booking {
  _id: string;
  carRegistrationNumber?: string;
  phoneNumber?: string;
  color?: string;
  attendant: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  serviceType?: 'full wash' | 'half wash';
  vehicleType?: string;
  category: 'vehicle' | 'carpet';
  paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
  status: 'pending' | 'in progress' | 'completed' | 'cancelled';
  attendantPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

// Wallet types
export interface Wallet {
  _id: string;
  attendant: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  balance: number;
  companyDebt: number;
  totalEarnings: number;
  totalCommission: number;
  totalCompanyShare: number;
  isPaid: boolean;
}

export interface SystemWallet {
  _id: string;
  totalRevenue: number;
  totalCompanyShare: number;
  totalAttendantPayments: number;
  totalAdminCollections: number;
  totalAttendantCollections: number;
  currentBalance: number;
  lastUpdated: string;
}

export interface DailySummary {
  date: string;
  totalAttendants: number;
  totalBookings: number;
  totalAmount: number;
  totalCommission: number;
  totalCompanyShare: number;
  attendants: Array<{
    attendantId: string;
    attendantName: string;
    attendantEmail: string;
    totalBookings: number;
    totalAmount: number;
    totalCommission: number;
    totalCompanyShare: number;
    attendantCashBookings: number;
    attendantCashAmount: number;
    companyDebt: number;
  }>;
}

/**
 * Generic API request function
 */
const apiRequest = async <T>(
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

/**
 * Authentication API calls
 */
export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiRequest(API_ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiRequest(API_ENDPOINTS.USER_SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async (token: string): Promise<ApiResponse> => {
    return apiRequest(API_ENDPOINTS.USER_LOGOUT, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  forgotPassword: async (request: ForgotPasswordRequest): Promise<ApiResponse> => {
    return apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  resetPassword: async (token: string, request: ResetPasswordRequest): Promise<ApiResponse> => {
    return apiRequest(`${API_ENDPOINTS.RESET_PASSWORD}/${token}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  updatePassword: async (request: UpdatePasswordRequest, authToken: string): Promise<ApiResponse> => {
    return apiRequest(API_ENDPOINTS.UPDATE_PASSWORD, {
      method: 'PATCH',
      body: JSON.stringify(request),
      headers: getApiHeaders(authToken),
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
      headers: getApiHeaders(token),
    });
  },

  deleteCurrentUser: async (token: string): Promise<ApiResponse> => {
    return apiRequest(API_ENDPOINTS.DELETE_CURRENT_USER, {
      method: 'DELETE',
      headers: getApiHeaders(token),
    });
  },

  getAllUsers: async (token: string, role?: 'attendant' | 'admin'): Promise<ApiResponse<User[]>> => {
    const url = role ? `${API_ENDPOINTS.GET_ALL_USERS}?role=${role}` : API_ENDPOINTS.GET_ALL_USERS;
    return apiRequest(url, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  createUser: async (userData: RegisterRequest, token: string): Promise<ApiResponse<User>> => {
    return apiRequest(API_ENDPOINTS.CREATE_USER, {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: getApiHeaders(token),
    });
  },

  getUserById: async (id: string, token: string): Promise<ApiResponse<User>> => {
    return apiRequest(`${API_ENDPOINTS.GET_USER_BY_ID}/${id}`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  updateUser: async (id: string, userData: Partial<RegisterRequest>, token: string): Promise<ApiResponse<User>> => {
    return apiRequest(`${API_ENDPOINTS.UPDATE_USER}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
      headers: getApiHeaders(token),
    });
  },

  deleteUser: async (id: string, token: string): Promise<ApiResponse> => {
    return apiRequest(`${API_ENDPOINTS.DELETE_USER}/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(token),
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
    let url = API_ENDPOINTS.GET_ALL_BOOKINGS;
    const params = new URLSearchParams();

    if (filters) {
      if (filters.createdAt?.gte) params.append('createdAt[gte]', filters.createdAt.gte);
      if (filters.createdAt?.lte) params.append('createdAt[lte]', filters.createdAt.lte);
      if (filters.amount?.gte) params.append('amount[gte]', filters.amount.gte.toString());
      if (filters.amount?.lte) params.append('amount[lte]', filters.amount.lte.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.fields) params.append('fields', filters.fields);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return apiRequest(url, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  createVehicleBooking: async (bookingData: VehicleBookingRequest, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      body: JSON.stringify(bookingData),
      headers: getApiHeaders(token),
    });
  },

  createCarpetBooking: async (bookingData: CarpetBookingRequest, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      body: JSON.stringify(bookingData),
      headers: getApiHeaders(token),
    });
  },

  getBookingById: async (id: string, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKING_BY_ID}/${id}`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  updateBooking: async (id: string, bookingData: Partial<VehicleBookingRequest | CarpetBookingRequest>, token: string): Promise<ApiResponse<Booking>> => {
    return apiRequest(`${API_ENDPOINTS.UPDATE_BOOKING}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(bookingData),
      headers: getApiHeaders(token),
    });
  },

  deleteBooking: async (id: string, token: string): Promise<ApiResponse> => {
    return apiRequest(`${API_ENDPOINTS.DELETE_BOOKING}/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(token),
    });
  },

  getBookingsByAttendant: async (attendantId: string, token: string): Promise<ApiResponse<Booking[]>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKINGS_BY_ATTENDANT}/${attendantId}`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getBookingsByStatus: async (status: string, token: string): Promise<ApiResponse<Booking[]>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKINGS_BY_STATUS}/${status}`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },
};

/**
 * Wallet management API calls
 */
export const walletApi = {
  getMyWallet: async (token: string, date?: string): Promise<ApiResponse<{ wallet: Wallet; date: string }>> => {
    const url = date ? `${API_ENDPOINTS.GET_MY_WALLET}?date=${date}` : API_ENDPOINTS.GET_MY_WALLET;
    return apiRequest(url, {
      method: 'GET',
      headers: getApiHeaders(token),
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
      body: JSON.stringify({ attendantIds }),
      headers: getApiHeaders(token),
    });
  },

  getDailyWalletSummary: async (token: string, date?: string): Promise<ApiResponse<{ summary: DailySummary }>> => {
    const url = date ? `${API_ENDPOINTS.GET_DAILY_WALLET_SUMMARY}?date=${date}` : API_ENDPOINTS.GET_DAILY_WALLET_SUMMARY;
    return apiRequest(url, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getAllWallets: async (token: string, date?: string): Promise<ApiResponse<Wallet[]>> => {
    const url = date ? `${API_ENDPOINTS.GET_ALL_WALLETS}?date=${date}` : API_ENDPOINTS.GET_ALL_WALLETS;
    return apiRequest(url, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getWalletSummary: async (token: string): Promise<ApiResponse<any>> => {
    return apiRequest(API_ENDPOINTS.GET_WALLET_SUMMARY, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getCompanyDebtSummary: async (token: string): Promise<ApiResponse<any>> => {
    return apiRequest(API_ENDPOINTS.GET_COMPANY_DEBT_SUMMARY, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getUnpaidWallets: async (token: string): Promise<ApiResponse<Wallet[]>> => {
    return apiRequest(API_ENDPOINTS.GET_UNPAID_WALLETS, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getSystemWallet: async (token: string): Promise<ApiResponse<{ systemWallet: SystemWallet }>> => {
    return apiRequest(API_ENDPOINTS.GET_SYSTEM_WALLET, {
      method: 'GET',
      headers: getApiHeaders(token),
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
      headers: getApiHeaders(token),
    });
  },

  getAttendantWallet: async (attendantId: string, token: string): Promise<ApiResponse<Wallet>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_WALLET}/${attendantId}`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getAttendantDebtDetails: async (attendantId: string, token: string): Promise<ApiResponse<any>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_DEBT_DETAILS}/${attendantId}/debt`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  markAttendantPaid: async (attendantId: string, token: string): Promise<ApiResponse<Wallet>> => {
    return apiRequest(`${API_ENDPOINTS.MARK_ATTENDANT_PAID}/${attendantId}/mark-paid`, {
      method: 'PATCH',
      headers: getApiHeaders(token),
    });
  },

  rebuildWalletBalance: async (attendantId: string, token: string): Promise<ApiResponse<{ wallet: Wallet }>> => {
    return apiRequest(`${API_ENDPOINTS.REBUILD_WALLET_BALANCE}/${attendantId}/rebuild`, {
      method: 'PATCH',
      headers: getApiHeaders(token),
    });
  },

  getAttendantBookings: async (attendantId: string, token: string): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_BOOKINGS}/${attendantId}/bookings`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getMyBookings: async (token: string): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    return apiRequest(`${API_ENDPOINTS.GET_ATTENDANT_BOOKINGS}/my-wallet/bookings`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },

  getBookingDetails: async (bookingId: string, token: string): Promise<ApiResponse<{ booking: Booking }>> => {
    return apiRequest(`${API_ENDPOINTS.GET_BOOKING_DETAILS}/${bookingId}`, {
      method: 'GET',
      headers: getApiHeaders(token),
    });
  },
};
