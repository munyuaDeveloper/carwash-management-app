import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { walletApi } from '../../services/apiAxios';
import {
  Wallet,
} from '../../types/wallet';

interface WalletState {
  // All attendant wallets
  allWallets: Wallet[];
  allWalletsLoading: boolean;
  allWalletsError: string | null;

  // Selected date for filtering
  selectedDate: string | null;

  // Selected attendant for filtering
  selectedAttendant: string | null;

  // Last fetched timestamps
  lastFetched: {
    allWallets: string | null;
  };
}

const initialState: WalletState = {
  allWallets: [],
  allWalletsLoading: false,
  allWalletsError: null,

  selectedDate: null,
  selectedAttendant: null,

  lastFetched: {
    allWallets: null,
  },
};

// Async thunks
export const fetchAllWallets = createAsyncThunk(
  'wallet/fetchAllWallets',
  async ({ token, date }: { token: string; date?: string }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getAllWallets(token, date);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch wallets');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);




export const settleAttendantBalances = createAsyncThunk(
  'wallet/settleAttendantBalances',
  async ({ attendantIds, token }: { attendantIds: string[]; token: string }, { rejectWithValue }) => {
    try {
      const response = await walletApi.settleAttendantBalances(attendantIds, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to settle attendant balances');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const markAttendantPaid = createAsyncThunk(
  'wallet/markAttendantPaid',
  async ({ attendantId, token }: { attendantId: string; token: string }, { rejectWithValue }) => {
    try {
      const response = await walletApi.markAttendantPaid(attendantId, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to mark attendant as paid');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const adjustWalletBalance = createAsyncThunk(
  'wallet/adjustWalletBalance',
  async (
    {
      attendantId,
      adjustmentData,
      token,
    }: {
      attendantId: string;
      adjustmentData: { amount: number; type: string; reason?: string };
      token: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await walletApi.adjustWalletBalance(attendantId, adjustmentData, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to adjust wallet balance');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.allWalletsError = null;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    setSelectedAttendant: (state, action: PayloadAction<string | null>) => {
      state.selectedAttendant = action.payload;
    },
    clearWalletData: (state) => {
      state.allWallets = [];
      state.lastFetched = {
        allWallets: null,
      };
    },
  },
  extraReducers: (builder) => {

    // Fetch all wallets
    builder
      .addCase(fetchAllWallets.pending, (state) => {
        state.allWalletsLoading = true;
        state.allWalletsError = null;
      })
      .addCase(fetchAllWallets.fulfilled, (state, action) => {
        state.allWalletsLoading = false;
        const response = action.payload as any;
        state.allWallets = response?.data?.wallets || [];
        state.allWalletsError = null;
        state.lastFetched.allWallets = new Date().toISOString();
      })
      .addCase(fetchAllWallets.rejected, (state, action) => {
        state.allWalletsLoading = false;
        state.allWalletsError = action.payload as string;
      });




    // Settle attendant balances
    builder
      .addCase(settleAttendantBalances.fulfilled, (state) => {
        // Refresh data after settlement
        state.lastFetched.allWallets = null;
      });

    // Mark attendant paid
    builder
      .addCase(markAttendantPaid.fulfilled, (state) => {
        // Refresh data after marking as paid
        state.lastFetched.allWallets = null;
      });

    // Adjust wallet balance
    builder
      .addCase(adjustWalletBalance.fulfilled, (state) => {
        // Refresh data after adjusting balance
        state.lastFetched.allWallets = null;
      });
  },
});

export const { clearErrors, setSelectedDate, setSelectedAttendant, clearWalletData } = walletSlice.actions;
export default walletSlice.reducer;
