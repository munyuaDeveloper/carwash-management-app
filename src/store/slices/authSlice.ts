import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials, ForgotPasswordRequest, ResetPasswordRequest } from '../../types/auth';
import { authApi } from '../../services/apiEnhanced';
import { offlineLogin, cacheCredentials, clearCachedCredentials } from '../../services/offlineAuth';
import { networkService } from '../../services/networkService';

// Storage keys
const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'auth_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingCompleted: false,
  error: null,
};

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      const [user, biometricEnabled, onboardingCompleted] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
      ]);

      // Try to get token from SecureStore, fallback to AsyncStorage
      let token = null;
      try {
        token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      } catch (secureStoreError) {
        console.warn('SecureStore not available, checking AsyncStorage:', secureStoreError);
        token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      }

      return {
        user: user ? JSON.parse(user) : null,
        token,
        biometricEnabled: biometricEnabled === 'true',
        onboardingCompleted: onboardingCompleted === 'true',
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // Use offline-first login (tries online first, falls back to offline)
      const response = await offlineLogin(credentials.email, credentials.password);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Login failed');
      }

      // Handle the actual API response structure
      if (!response.data) {
        return rejectWithValue('Invalid response from server');
      }

      // Handle both online and offline login responses
      const { token, data } = response.data;
      const user = data?.user || data; // Handle different response structures

      // Store user data and token
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      // Store token securely, with fallback to AsyncStorage if SecureStore fails
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
      } catch (secureStoreError) {
        console.warn('SecureStore not available, falling back to AsyncStorage:', secureStoreError);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }

      // Cache credentials if online login succeeded (not offline login)
      if (!response.isOffline) {
        await cacheCredentials(credentials.email, credentials.password);
      }

      return { user, token, isOffline: response.isOffline || false };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;

      // Call logout API if we have a token
      if (token) {
        try {
          await authApi.logout(token);
        } catch (apiError) {
          // Continue with local logout even if API call fails
          console.warn('Logout API call failed, continuing with local logout:', apiError);
        }
      }

      // Clear all stored data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        clearCachedCredentials(), // Clear cached login credentials
      ]);

      // Try to clear SecureStore, fallback to AsyncStorage
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      } catch (secureStoreError) {
        console.warn('SecureStore not available, clearing from AsyncStorage:', secureStoreError);
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'auth/completeOnboarding',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (request: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.forgotPassword(request);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to send reset email');
      }

      return { message: 'Reset email sent successfully' };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, request }: { token: string; request: ResetPasswordRequest }, { rejectWithValue }) => {
    try {
      const response = await authApi.resetPassword(token, request);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to reset password');
      }

      return { message: 'Password reset successfully' };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      // Persist updated user to AsyncStorage
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    // Check auth state
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!(action.payload.user && action.payload.token);
        state.onboardingCompleted = action.payload.onboardingCompleted;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Complete onboarding
    builder
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.onboardingCompleted = true;
      });

    // Forgot password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
