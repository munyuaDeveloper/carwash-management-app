import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials } from '../../types/auth';

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
      // Simulate API call - replace with actual authentication logic
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login response
      const mockUser: User = {
        id: '1',
        phone: credentials.phone,
        name: 'John Doe',
        role: 'owner',
        businessId: 'business_1',
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      // Store user data and token
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

      // Store token securely, with fallback to AsyncStorage if SecureStore fails
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, mockToken);
      } catch (secureStoreError) {
        console.warn('SecureStore not available, falling back to AsyncStorage:', secureStoreError);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
      }

      return { user: mockUser, token: mockToken };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear all stored data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
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
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
