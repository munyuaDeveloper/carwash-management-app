import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '../../services/apiAxios';
import { Attendant } from '../../types/booking';

interface AttendantState {
  attendants: Attendant[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: AttendantState = {
  attendants: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const fetchAttendants = createAsyncThunk(
  'attendants/fetchAttendants',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await userApi.getAllUsers(token, 'attendant');

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch attendants');
      }

      // Transform the API response to include isAvailable (defaulting to true)
      // The API returns { data: { users: [...] } } structure
      const users = (response.data as any)?.data?.users || [];
      const attendants = Array.isArray(users)
        ? users.map((user: any) => ({
          ...user,
          isAvailable: true, // Default to available, can be updated based on business logic
        }))
        : [];

      return attendants;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const updateAttendantAvailability = createAsyncThunk(
  'attendants/updateAvailability',
  async ({ attendantId, isAvailable }: { attendantId: string; isAvailable: boolean }, { getState }) => {
    // This is a local update - in a real app, you might want to sync with backend
    return { attendantId, isAvailable };
  }
);

const attendantSlice = createSlice({
  name: 'attendants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAttendantAvailability: (state, action: PayloadAction<{ attendantId: string; isAvailable: boolean }>) => {
      const { attendantId, isAvailable } = action.payload;
      const attendant = state.attendants.find(att => att._id === attendantId);
      if (attendant) {
        attendant.isAvailable = isAvailable;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch attendants
    builder
      .addCase(fetchAttendants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendants = action.payload;
        state.error = null;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAttendants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update attendant availability
    builder
      .addCase(updateAttendantAvailability.fulfilled, (state, action) => {
        const { attendantId, isAvailable } = action.payload;
        const attendant = state.attendants.find(att => att._id === attendantId);
        if (attendant) {
          attendant.isAvailable = isAvailable;
        }
      });
  },
});

export const { clearError, setAttendantAvailability } = attendantSlice.actions;
export default attendantSlice.reducer;
