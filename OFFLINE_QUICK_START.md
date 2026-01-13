# Offline-First Quick Start Guide

## What Was Implemented

A complete offline-first architecture that allows your app to:
- ✅ Work fully offline
- ✅ Automatically detect network connectivity
- ✅ Queue operations when offline
- ✅ Sync data when connection is restored
- ✅ Handle conflicts intelligently

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
├─────────────────────────────────────────────────────────┤
│  Redux Store (State Management)                         │
│  ├── Auth State                                          │
│  ├── Bookings State                                      │
│  ├── Wallets State                                       │
│  └── Offline State (NEW)                                  │
├─────────────────────────────────────────────────────────┤
│  Offline Services                                        │
│  ├── Database Service (SQLite) - Local Storage          │
│  ├── Network Service - Connectivity Detection            │
│  ├── Sync Service - Data Synchronization                │
│  └── Offline API - Offline-First API Wrapper            │
├─────────────────────────────────────────────────────────┤
│  Local SQLite Database                                   │
│  ├── bookings table                                      │
│  ├── wallets table                                       │
│  ├── attendants table                                    │
│  └── sync_queue table                                    │
└─────────────────────────────────────────────────────────┘
         ↕ (when online)
┌─────────────────────────────────────────────────────────┐
│              Backend API Server                          │
└─────────────────────────────────────────────────────────┘
```

## Key Files Created

1. **`src/services/database.ts`** - SQLite database service
2. **`src/services/networkService.ts`** - Network connectivity monitoring
3. **`src/services/syncService.ts`** - Data synchronization service
4. **`src/services/offlineApi.ts`** - Offline-first API wrapper
5. **`src/store/slices/offlineSlice.ts`** - Redux slice for offline state
6. **`src/hooks/useOffline.ts`** - React hook for offline functionality
7. **`src/components/OfflineIndicator.tsx`** - UI component showing offline status
8. **`src/components/OfflineInitializer.tsx`** - Initializes offline services

## How to Use

### 1. The App is Already Set Up!

The offline services are automatically initialized via `AppProvider` which includes `OfflineInitializer`. The offline indicator will appear at the top of your app showing:
- Network status (Online/Offline)
- Sync progress
- Number of unsynced items
- Manual sync button

### 2. Using Offline-First APIs

To make your API calls work offline, replace them with offline-first versions:

**Before:**
```typescript
import { bookingApi } from './services/apiAxios';
const response = await bookingApi.getAllBookings(token, filters);
```

**After:**
```typescript
import { offlineBookingApi } from './services/offlineApi';
const response = await offlineBookingApi.getAllBookings(token, filters);
```

### 3. Update Your Redux Slices (Optional)

You can update your existing slices to use offline APIs. For example, in `bookingSlice.ts`:

```typescript
// Change this import
import { bookingApi } from '../../services/apiAxios';

// To this
import { offlineBookingApi } from '../../services/offlineApi';

// Then update the thunk
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (filters, { rejectWithValue, getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    // Use offline API
    const response = await offlineBookingApi.getAllBookings(token, filters);
    // ... rest stays the same
  }
);
```

### 4. Access Offline State

Use the `useOffline` hook in any component:

```typescript
import { useOffline } from '../hooks/useOffline';

function MyComponent() {
  const { isOnline, isSyncing, unsyncedCount, sync } = useOffline();

  return (
    <View>
      {!isOnline && <Text>You're offline</Text>}
      {isSyncing && <Text>Syncing...</Text>}
      <Text>Unsynced bookings: {unsyncedCount.bookings}</Text>
      <Button onPress={sync} title="Sync Now" />
    </View>
  );
}
```

## How It Works

### Creating Data (Offline)

1. User creates a booking → Saved to SQLite immediately
2. Booking appears in UI instantly (optimistic update)
3. Operation added to sync queue
4. When online → Automatically synced to server
5. Server ID assigned to local record

### Reading Data (Offline)

1. Request bookings → Query local SQLite
2. Data returned immediately (no network delay)
3. If online → Background sync updates local data
4. UI automatically reflects latest data

### Network Reconnection

1. Network service detects connection
2. Auto-sync triggers after 2 seconds
3. All pending operations processed
4. Local data merged with server data
5. UI updates automatically

## Testing Offline Mode

1. **Enable Airplane Mode** on your device
2. **Create a booking** - Should work immediately
3. **View bookings** - Should show from local storage
4. **Disable Airplane Mode** - Should auto-sync
5. **Check sync status** - Offline indicator shows sync progress

## Configuration

Edit `src/config/offline.ts` to customize behavior:

```typescript
export const OFFLINE_CONFIG = {
  enabled: true,                    // Enable/disable offline mode
  autoSync: {
    enabled: true,                  // Auto-sync when online
    delay: 2000,                    // Delay before sync (ms)
    interval: 300000,               // Sync interval (5 min)
  },
  sync: {
    maxBookings: 100,               // Max bookings to sync
    maxRetries: 5,                  // Max retry attempts
  },
};
```

## Troubleshooting

### Data Not Syncing

1. Check if device is online: `networkService.isOnline()`
2. Check sync queue: Look at offline indicator
3. Manually trigger sync: Use sync button in offline indicator
4. Check console logs for errors

### Database Issues

If you need to reset the database:

```typescript
import { databaseService } from './services/database';
await databaseService.clearAllData();
await databaseService.initialize();
```

## Next Steps

1. **Update existing slices** to use `offlineBookingApi`, `offlineWalletApi`, etc.
2. **Test offline scenarios** thoroughly
3. **Customize sync behavior** in `syncService.ts` if needed
4. **Add conflict resolution UI** if needed for your use case

## Benefits

- ✅ **Instant UI Updates** - No waiting for network
- ✅ **Works Offline** - Full functionality without internet
- ✅ **Automatic Sync** - No manual intervention needed
- ✅ **Conflict Resolution** - Handles data conflicts intelligently
- ✅ **Better UX** - Users never see "no connection" errors
- ✅ **Data Persistence** - All data saved locally

## Support

For detailed documentation, see `OFFLINE_FIRST_ARCHITECTURE.md`.

