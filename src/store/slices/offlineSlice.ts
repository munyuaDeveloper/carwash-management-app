/**
 * Offline State Slice
 * Manages offline state, sync status, and network connectivity
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { networkService } from '../../services/networkService';
import { syncService } from '../../services/syncService';
import { databaseService } from '../../services/database';

export interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  unsyncedCount: {
    bookings: number;
    wallets: number;
    attendants: number;
    queue: number;
  };
  syncError: string | null;
}

const initialState: OfflineState = {
  isOnline: false,
  isConnected: false,
  isInternetReachable: null,
  isSyncing: false,
  lastSyncTime: null,
  unsyncedCount: {
    bookings: 0,
    wallets: 0,
    attendants: 0,
    queue: 0,
  },
  syncError: null,
};

/**
 * Initialize offline services
 */
export const initializeOffline = createAsyncThunk(
  'offline/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Initialize database
      await databaseService.initialize();

      // Initialize network service
      await networkService.initialize();

      // Get initial network state
      const networkState = networkService.getState();

      // Get initial unsynced count
      const unsyncedCount = await databaseService.getUnsyncedCount();

      return {
        networkState,
        unsyncedCount,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize offline services');
    }
  }
);

/**
 * Sync all data
 */
export const syncAll = createAsyncThunk(
  'offline/syncAll',
  async (token: string, { rejectWithValue }) => {
    try {
      const result = await syncService.syncAll(token);
      const unsyncedCount = await databaseService.getUnsyncedCount();

      return {
        result,
        unsyncedCount,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync');
    }
  }
);

/**
 * Check unsynced count
 */
export const checkUnsyncedCount = createAsyncThunk(
  'offline/checkUnsyncedCount',
  async (_, { rejectWithValue }) => {
    try {
      const unsyncedCount = await databaseService.getUnsyncedCount();
      return unsyncedCount;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check unsynced count');
    }
  }
);

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setNetworkState: (state, action: PayloadAction<{ isConnected: boolean; isInternetReachable: boolean | null }>) => {
      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
      state.isOnline = action.payload.isConnected && action.payload.isInternetReachable === true;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
    },
    updateUnsyncedCount: (state, action: PayloadAction<typeof initialState.unsyncedCount>) => {
      state.unsyncedCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize offline
    builder
      .addCase(initializeOffline.fulfilled, (state, action) => {
        const { networkState, unsyncedCount } = action.payload;
        state.isConnected = networkState.isConnected;
        state.isInternetReachable = networkState.isInternetReachable;
        state.isOnline = networkState.isConnected && networkState.isInternetReachable === true;
        state.unsyncedCount = unsyncedCount;
      })
      .addCase(initializeOffline.rejected, (state, action) => {
        state.syncError = action.payload as string;
      });

    // Sync all
    builder
      .addCase(syncAll.pending, (state) => {
        state.isSyncing = true;
        state.syncError = null;
      })
      .addCase(syncAll.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = new Date().toISOString();
        state.unsyncedCount = action.payload.unsyncedCount;
        state.syncError = action.payload.result.success ? null : 'Some items failed to sync';
      })
      .addCase(syncAll.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncError = action.payload as string;
      });

    // Check unsynced count
    builder
      .addCase(checkUnsyncedCount.fulfilled, (state, action) => {
        state.unsyncedCount = action.payload;
      });
  },
});

export const { setNetworkState, setSyncing, setSyncError, updateUnsyncedCount } = offlineSlice.actions;
export default offlineSlice.reducer;

