import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offlineWalletApi } from '../../services/offlineApi';
import {
  Wallet,
} from '../../types/wallet';

interface WalletState {
  // All attendant wallets
  allWallets: Wallet[];
  allWalletsLoading: boolean;
  allWalletsError: string | null;

  // My wallet (for attendants)
  myWallet: Wallet | null;
  myWalletLoading: boolean;
  myWalletError: string | null;

  // Selected date for filtering
  selectedDate: string | null;

  // Selected attendant for filtering
  selectedAttendant: string | null;

  // Last fetched timestamps
  lastFetched: {
    allWallets: string | null;
    myWallet: string | null;
  };
}

const initialState: WalletState = {
  allWallets: [],
  allWalletsLoading: false,
  allWalletsError: null,

  myWallet: null,
  myWalletLoading: false,
  myWalletError: null,

  selectedDate: null,
  selectedAttendant: null,

  lastFetched: {
    allWallets: null,
    myWallet: null,
  },
};

// Async thunks
export const fetchAllWallets = createAsyncThunk(
  'wallet/fetchAllWallets',
  async ({ token, date }: { token: string; date?: string }, { rejectWithValue }) => {
    try {
      const response = await offlineWalletApi.getAllWallets(token, date);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch wallets');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchMyWallet = createAsyncThunk(
  'wallet/fetchMyWallet',
  async ({ token, date }: { token: string; date?: string }, { rejectWithValue }) => {
    try {
      const response = await offlineWalletApi.getMyWallet(token, date);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch wallet');
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
      const response = await offlineWalletApi.settleAttendantBalances(attendantIds, token);

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
      const response = await offlineWalletApi.markAttendantPaid(attendantId, token);

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
      const response = await offlineWalletApi.adjustWalletBalance(attendantId, adjustmentData, token);

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
      state.myWalletError = null;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    setSelectedAttendant: (state, action: PayloadAction<string | null>) => {
      state.selectedAttendant = action.payload;
    },
    clearWalletData: (state) => {
      state.allWallets = [];
      state.myWallet = null;
      state.lastFetched = {
        allWallets: null,
        myWallet: null,
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
        state.lastFetched.myWallet = null;
      });

    // Fetch my wallet
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.myWalletLoading = true;
        state.myWalletError = null;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.myWalletLoading = false;
        const response = action.payload as any;
        state.myWallet = response?.data?.wallet || null;
        state.myWalletError = null;
        state.lastFetched.myWallet = new Date().toISOString();
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.myWalletLoading = false;
        state.myWalletError = action.payload as string;
      });
  },
});

export const { clearErrors, setSelectedDate, setSelectedAttendant, clearWalletData } = walletSlice.actions;
export default walletSlice.reducer;
