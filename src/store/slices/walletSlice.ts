import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { walletApi } from '../../services/apiAxios';
import {
  Wallet,
  SystemWallet,
  DailySummary,
  WalletSummary,
  AllWalletsResponse,
  UnpaidWalletsResponse,
  DebtSummaryResponse,
  AttendantBookingsResponse,
  BookingDetailsResponse
} from '../../types/wallet';

interface WalletState {
  // My wallet (for attendants)
  myWallet: Wallet | null;
  myWalletLoading: boolean;
  myWalletError: string | null;

  // All wallets (for admins)
  allWallets: Wallet[];
  allWalletsLoading: boolean;
  allWalletsError: string | null;

  // Unpaid wallets (for admins)
  unpaidWallets: Wallet[];
  unpaidWalletsLoading: boolean;
  unpaidWalletsError: string | null;

  // Daily summary (for admins)
  dailySummary: DailySummary | null;
  dailySummaryLoading: boolean;
  dailySummaryError: string | null;

  // System wallet (for admins)
  systemWallet: SystemWallet | null;
  systemWalletLoading: boolean;
  systemWalletError: string | null;

  // Wallet summary (for admins)
  walletSummary: WalletSummary | null;
  walletSummaryLoading: boolean;
  walletSummaryError: string | null;

  // Debt summary (for admins)
  debtSummary: any | null;
  debtSummaryLoading: boolean;
  debtSummaryError: string | null;

  // Attendant bookings
  attendantBookings: any[];
  attendantBookingsLoading: boolean;
  attendantBookingsError: string | null;

  // Selected date for filtering
  selectedDate: string | null;

  // Last fetched timestamps
  lastFetched: {
    myWallet: string | null;
    allWallets: string | null;
    unpaidWallets: string | null;
    dailySummary: string | null;
    systemWallet: string | null;
    walletSummary: string | null;
    debtSummary: string | null;
    attendantBookings: string | null;
  };
}

const initialState: WalletState = {
  myWallet: null,
  myWalletLoading: false,
  myWalletError: null,

  allWallets: [],
  allWalletsLoading: false,
  allWalletsError: null,

  unpaidWallets: [],
  unpaidWalletsLoading: false,
  unpaidWalletsError: null,

  dailySummary: null,
  dailySummaryLoading: false,
  dailySummaryError: null,

  systemWallet: null,
  systemWalletLoading: false,
  systemWalletError: null,

  walletSummary: null,
  walletSummaryLoading: false,
  walletSummaryError: null,

  debtSummary: null,
  debtSummaryLoading: false,
  debtSummaryError: null,

  attendantBookings: [],
  attendantBookingsLoading: false,
  attendantBookingsError: null,

  selectedDate: null,

  lastFetched: {
    myWallet: null,
    allWallets: null,
    unpaidWallets: null,
    dailySummary: null,
    systemWallet: null,
    walletSummary: null,
    debtSummary: null,
    attendantBookings: null,
  },
};

// Async thunks
export const fetchMyWallet = createAsyncThunk(
  'wallet/fetchMyWallet',
  async ({ token, date }: { token: string; date?: string }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getMyWallet(token, date);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch wallet');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

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

export const fetchUnpaidWallets = createAsyncThunk(
  'wallet/fetchUnpaidWallets',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await walletApi.getUnpaidWallets(token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch unpaid wallets');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchDailySummary = createAsyncThunk(
  'wallet/fetchDailySummary',
  async ({ token, date }: { token: string; date?: string }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getDailyWalletSummary(token, date);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch daily summary');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchSystemWallet = createAsyncThunk(
  'wallet/fetchSystemWallet',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await walletApi.getSystemWallet(token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch system wallet');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchWalletSummary = createAsyncThunk(
  'wallet/fetchWalletSummary',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await walletApi.getWalletSummary(token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch wallet summary');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchDebtSummary = createAsyncThunk(
  'wallet/fetchDebtSummary',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await walletApi.getCompanyDebtSummary(token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch debt summary');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchAttendantBookings = createAsyncThunk(
  'wallet/fetchAttendantBookings',
  async ({ attendantId, token }: { attendantId: string; token: string }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getAttendantBookings(attendantId, token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch attendant bookings');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'wallet/fetchMyBookings',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await walletApi.getMyBookings(token);

      if (response.status === 'error') {
        return rejectWithValue(response.error || 'Failed to fetch my bookings');
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

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.myWalletError = null;
      state.allWalletsError = null;
      state.unpaidWalletsError = null;
      state.dailySummaryError = null;
      state.systemWalletError = null;
      state.walletSummaryError = null;
      state.debtSummaryError = null;
      state.attendantBookingsError = null;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    clearWalletData: (state) => {
      state.myWallet = null;
      state.allWallets = [];
      state.unpaidWallets = [];
      state.dailySummary = null;
      state.systemWallet = null;
      state.walletSummary = null;
      state.debtSummary = null;
      state.attendantBookings = [];
      state.lastFetched = {
        myWallet: null,
        allWallets: null,
        unpaidWallets: null,
        dailySummary: null,
        systemWallet: null,
        walletSummary: null,
        debtSummary: null,
        attendantBookings: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch my wallet
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.myWalletLoading = true;
        state.myWalletError = null;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.myWalletLoading = false;
        const response = action.payload as any;
        state.myWallet = response?.data?.wallet;
        state.myWalletError = null;
        state.lastFetched.myWallet = new Date().toISOString();
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.myWalletLoading = false;
        state.myWalletError = action.payload as string;
      });

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

    // Fetch unpaid wallets
    builder
      .addCase(fetchUnpaidWallets.pending, (state) => {
        state.unpaidWalletsLoading = true;
        state.unpaidWalletsError = null;
      })
      .addCase(fetchUnpaidWallets.fulfilled, (state, action) => {
        state.unpaidWalletsLoading = false;
        const response = action.payload as any;
        state.unpaidWallets = response?.data?.wallets || [];
        state.unpaidWalletsError = null;
        state.lastFetched.unpaidWallets = new Date().toISOString();
      })
      .addCase(fetchUnpaidWallets.rejected, (state, action) => {
        state.unpaidWalletsLoading = false;
        state.unpaidWalletsError = action.payload as string;
      });

    // Fetch daily summary
    builder
      .addCase(fetchDailySummary.pending, (state) => {
        state.dailySummaryLoading = true;
        state.dailySummaryError = null;
      })
      .addCase(fetchDailySummary.fulfilled, (state, action) => {
        state.dailySummaryLoading = false;
        state.dailySummary = (action.payload as any).summary;
        state.dailySummaryError = null;
        state.lastFetched.dailySummary = new Date().toISOString();
      })
      .addCase(fetchDailySummary.rejected, (state, action) => {
        state.dailySummaryLoading = false;
        state.dailySummaryError = action.payload as string;
      });

    // Fetch system wallet
    builder
      .addCase(fetchSystemWallet.pending, (state) => {
        state.systemWalletLoading = true;
        state.systemWalletError = null;
      })
      .addCase(fetchSystemWallet.fulfilled, (state, action) => {
        state.systemWalletLoading = false;
        state.systemWallet = (action.payload as any).systemWallet;
        state.systemWalletError = null;
        state.lastFetched.systemWallet = new Date().toISOString();
      })
      .addCase(fetchSystemWallet.rejected, (state, action) => {
        state.systemWalletLoading = false;
        state.systemWalletError = action.payload as string;
      });

    // Fetch wallet summary
    builder
      .addCase(fetchWalletSummary.pending, (state) => {
        state.walletSummaryLoading = true;
        state.walletSummaryError = null;
      })
      .addCase(fetchWalletSummary.fulfilled, (state, action) => {
        state.walletSummaryLoading = false;
        state.walletSummary = (action.payload as any).summary;
        state.walletSummaryError = null;
        state.lastFetched.walletSummary = new Date().toISOString();
      })
      .addCase(fetchWalletSummary.rejected, (state, action) => {
        state.walletSummaryLoading = false;
        state.walletSummaryError = action.payload as string;
      });

    // Fetch debt summary
    builder
      .addCase(fetchDebtSummary.pending, (state) => {
        state.debtSummaryLoading = true;
        state.debtSummaryError = null;
      })
      .addCase(fetchDebtSummary.fulfilled, (state, action) => {
        state.debtSummaryLoading = false;
        state.debtSummary = (action.payload as any).summary;
        state.debtSummaryError = null;
        state.lastFetched.debtSummary = new Date().toISOString();
      })
      .addCase(fetchDebtSummary.rejected, (state, action) => {
        state.debtSummaryLoading = false;
        state.debtSummaryError = action.payload as string;
      });

    // Fetch attendant bookings
    builder
      .addCase(fetchAttendantBookings.pending, (state) => {
        state.attendantBookingsLoading = true;
        state.attendantBookingsError = null;
      })
      .addCase(fetchAttendantBookings.fulfilled, (state, action) => {
        state.attendantBookingsLoading = false;
        state.attendantBookings = (action.payload as any).bookings || [];
        state.attendantBookingsError = null;
        state.lastFetched.attendantBookings = new Date().toISOString();
      })
      .addCase(fetchAttendantBookings.rejected, (state, action) => {
        state.attendantBookingsLoading = false;
        state.attendantBookingsError = action.payload as string;
      });

    // Fetch my bookings
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.attendantBookingsLoading = true;
        state.attendantBookingsError = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.attendantBookingsLoading = false;
        state.attendantBookings = (action.payload as any).bookings || [];
        state.attendantBookingsError = null;
        state.lastFetched.attendantBookings = new Date().toISOString();
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.attendantBookingsLoading = false;
        state.attendantBookingsError = action.payload as string;
      });

    // Settle attendant balances
    builder
      .addCase(settleAttendantBalances.fulfilled, (state) => {
        // Refresh data after settlement
        state.lastFetched.allWallets = null;
        state.lastFetched.unpaidWallets = null;
        state.lastFetched.dailySummary = null;
        state.lastFetched.systemWallet = null;
        state.lastFetched.walletSummary = null;
        state.lastFetched.debtSummary = null;
      });

    // Mark attendant paid
    builder
      .addCase(markAttendantPaid.fulfilled, (state) => {
        // Refresh data after marking as paid
        state.lastFetched.allWallets = null;
        state.lastFetched.unpaidWallets = null;
        state.lastFetched.dailySummary = null;
        state.lastFetched.systemWallet = null;
        state.lastFetched.walletSummary = null;
        state.lastFetched.debtSummary = null;
      });
  },
});

export const { clearErrors, setSelectedDate, clearWalletData } = walletSlice.actions;
export default walletSlice.reducer;
