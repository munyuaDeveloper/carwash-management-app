import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { bookingApi } from '../../services/apiAxios';
import { RootState } from '../index';

// API Response Types based on the API documentation
export interface ApiBooking {
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

export interface ApiBookingsResponse {
  status: string;
  results: number;
  data: {
    bookings: ApiBooking[];
  };
}

export interface BookingFilters {
  createdAt?: { gte?: string; lte?: string };
  amount?: { gte?: number; lte?: number };
  sort?: string;
  page?: number;
  limit?: number;
  fields?: string;
  status?: string;
  category?: 'vehicle' | 'carpet';
}

interface BookingState {
  bookings: ApiBooking[];
  isLoading: boolean;
  error: string | null;
  filters: BookingFilters;
  totalResults: number;
}

const initialState: BookingState = {
  bookings: [],
  isLoading: false,
  error: null,
  filters: {
    sort: '-createdAt', // Default to newest first
    limit: 50,
  },
  totalResults: 0,
};

// Async thunks
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (filters: BookingFilters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await bookingApi.getAllBookings(token, filters);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch bookings');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const createVehicleBooking = createAsyncThunk(
  'bookings/createVehicleBooking',
  async (bookingData: {
    carRegistrationNumber: string;
    attendant: string;
    amount: number;
    serviceType: 'full wash' | 'half wash';
    vehicleType: string;
    category: 'vehicle';
    paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await bookingApi.createVehicleBooking(bookingData, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to create booking');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const createCarpetBooking = createAsyncThunk(
  'bookings/createCarpetBooking',
  async (bookingData: {
    phoneNumber: string;
    color: string;
    attendant: string;
    amount: number;
    category: 'carpet';
    paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await bookingApi.createCarpetBooking(bookingData, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to create booking');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const updateBooking = createAsyncThunk(
  'bookings/updateBooking',
  async ({ id, bookingData }: { id: string; bookingData: any }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await bookingApi.updateBooking(id, bookingData, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to update booking');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const deleteBooking = createAsyncThunk(
  'bookings/deleteBooking',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await bookingApi.deleteBooking(id, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to delete booking');
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<BookingFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearBookings: (state) => {
      state.bookings = [];
      state.totalResults = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch bookings
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as ApiBookingsResponse;
        state.bookings = payload.data.bookings;
        state.totalResults = payload.results;
        state.error = null;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create vehicle booking
    builder
      .addCase(createVehicleBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createVehicleBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new booking to the list
        const payload = action.payload as any;
        state.bookings.unshift(payload.data.booking);
        state.totalResults += 1;
        state.error = null;
      })
      .addCase(createVehicleBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create carpet booking
    builder
      .addCase(createCarpetBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCarpetBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new booking to the list
        const payload = action.payload as any;
        state.bookings.unshift(payload.data.booking);
        state.totalResults += 1;
        state.error = null;
      })
      .addCase(createCarpetBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update booking
    builder
      .addCase(updateBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the booking in the list
        const payload = action.payload as any;
        const index = state.bookings.findIndex(booking => booking._id === payload.data.booking._id);
        if (index !== -1) {
          state.bookings[index] = payload.data.booking;
        }
        state.error = null;
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete booking
    builder
      .addCase(deleteBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the booking from the list
        state.bookings = state.bookings.filter(booking => booking._id !== action.payload);
        state.totalResults -= 1;
        state.error = null;
      })
      .addCase(deleteBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
