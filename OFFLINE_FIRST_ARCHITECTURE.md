# Offline-First Architecture

This document describes the offline-first architecture implemented in the Car Wash Management App.

## Overview

The app is designed to work fully offline, with automatic synchronization when network connectivity is restored. All data operations (create, read, update, delete) work seamlessly whether the device is online or offline.

## Architecture Components

### 1. Database Service (`src/services/database.ts`)

SQLite-based local storage that persists all app data:
- **Bookings**: All booking records with sync status
- **Wallets**: Wallet information for attendants
- **Attendants**: Attendant user data
- **Sync Queue**: Operations pending synchronization

**Key Features:**
- Automatic table creation and schema management
- Indexed queries for performance
- Sync status tracking for each record
- Conflict resolution support

### 2. Network Service (`src/services/networkService.ts`)

Monitors network connectivity and provides real-time status:
- Detects network connection state
- Monitors internet reachability
- Emits events on connectivity changes
- Provides wait-for-online functionality

**Usage:**
```typescript
import { networkService } from './services/networkService';

// Check if online
if (networkService.isOnline()) {
  // Perform online operations
}

// Wait for network
await networkService.waitForOnline(30000); // 30 second timeout
```

### 3. Sync Service (`src/services/syncService.ts`)

Handles bidirectional synchronization:
- **Pull Sync**: Downloads latest data from server
- **Push Sync**: Uploads local changes to server
- **Queue Processing**: Processes pending operations
- **Conflict Resolution**: Handles data conflicts intelligently

**Sync Strategy:**
1. Attendants are synced first (reference data)
2. Bookings are synced next (main transactional data)
3. Wallets are synced (derived/computed data)
4. Queue operations are processed last

### 4. Offline API (`src/services/offlineApi.ts`)

Offline-first wrapper around API calls:
- **Read Operations**: Always return from local DB first, sync in background
- **Write Operations**: Save locally immediately, queue for sync
- **Automatic Retry**: Failed operations are retried when online

**API Methods:**
- `offlineBookingApi.getAllBookings()` - Get bookings (local + background sync)
- `offlineBookingApi.createVehicleBooking()` - Create booking (local + queue)
- `offlineBookingApi.updateBooking()` - Update booking (local + queue)
- `offlineBookingApi.deleteBooking()` - Delete booking (local + queue)

### 5. Offline Redux Slice (`src/store/slices/offlineSlice.ts`)

Manages offline state in Redux:
- Network connectivity status
- Sync progress and status
- Unsynced item counts
- Last sync timestamp

### 6. Offline Hook (`src/hooks/useOffline.ts`)

React hook for offline functionality:
```typescript
const { isOnline, isSyncing, unsyncedCount, sync } = useOffline();

// Manual sync
await sync();

// Check unsynced items
console.log(unsyncedCount.bookings); // Number of unsynced bookings
```

## Data Flow

### Creating a Booking (Offline)

1. User creates booking → Saved to local SQLite immediately
2. Booking added to sync queue
3. UI updates immediately (optimistic update)
4. When online → Sync service processes queue
5. Server responds → Local record updated with server ID
6. Sync status updated to "synced"

### Fetching Bookings (Offline)

1. Request bookings → Query local SQLite
2. Return local data immediately
3. If online → Background sync starts
4. New data merged with local data
5. UI updates if new data available

### Network Reconnection

1. Network service detects connection
2. Auto-sync triggers after 2-second delay
3. All pending operations processed
4. Local data updated with server data
5. UI reflects synchronized state

## Usage Guide

### 1. Initialize Offline Services

The offline services are automatically initialized when the app starts via the `useOffline` hook. However, you can also initialize manually:

```typescript
import { databaseService } from './services/database';
import { networkService } from './services/networkService';

await databaseService.initialize();
await networkService.initialize();
```

### 2. Using Offline API

Replace regular API calls with offline-first versions:

```typescript
// Before (online-only)
import { bookingApi } from './services/apiAxios';
const response = await bookingApi.getAllBookings(token);

// After (offline-first)
import { offlineBookingApi } from './services/offlineApi';
const response = await offlineBookingApi.getAllBookings(token);
```

### 3. Displaying Offline Status

Add the `OfflineIndicator` component to your app:

```typescript
import { OfflineIndicator } from './components/OfflineIndicator';

// In your app layout
<OfflineIndicator />
```

### 4. Manual Sync

Trigger manual sync when needed:

```typescript
const { sync } = useOffline();

// In a button handler
const handleSync = async () => {
  await sync();
};
```

## Migration Guide

### Step 1: Update Redux Slices

Update your Redux slices to use offline API:

```typescript
// In bookingSlice.ts
import { offlineBookingApi } from '../../services/offlineApi';

export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (filters, { rejectWithValue, getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    // Use offline API instead of regular API
    const response = await offlineBookingApi.getAllBookings(token, filters);
    // ... rest of the code
  }
);
```

### Step 2: Add Offline Indicator

Add the offline indicator to your main app component:

```typescript
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  return (
    <>
      <OfflineIndicator />
      {/* Rest of your app */}
    </>
  );
}
```

### Step 3: Initialize Offline Services

The `useOffline` hook automatically initializes services, but ensure it's called early in your app:

```typescript
// In App.tsx or root component
import { useOffline } from './hooks/useOffline';

export default function App() {
  useOffline(); // Initializes offline services
  
  return (
    // Your app
  );
}
```

## Best Practices

1. **Always Use Offline API**: Use `offlineBookingApi`, `offlineWalletApi`, etc. instead of direct API calls
2. **Handle Sync Errors**: Check `syncError` in offline state and show user-friendly messages
3. **Optimistic Updates**: UI updates immediately, sync happens in background
4. **Conflict Resolution**: Server timestamps are used to resolve conflicts (newer wins)
5. **Queue Management**: Failed operations are retried up to 5 times before being removed

## Performance Considerations

- **Local Queries**: All queries are indexed for fast local access
- **Background Sync**: Sync happens in background, doesn't block UI
- **Batch Operations**: Multiple operations are batched during sync
- **Selective Sync**: Only syncs recent data (last 100 bookings by default)

## Troubleshooting

### Data Not Syncing

1. Check network status: `networkService.isOnline()`
2. Check sync queue: `databaseService.getSyncQueue()`
3. Check sync errors: `offlineState.syncError`
4. Manually trigger sync: `await syncService.syncAll(token)`

### Database Errors

1. Clear database: `await databaseService.clearAllData()`
2. Reinitialize: `await databaseService.initialize()`

### Network Detection Issues

1. Check NetInfo permissions (Android/iOS)
2. Verify network service initialization
3. Test with airplane mode toggle

## Future Enhancements

- [ ] Incremental sync (only changed records)
- [ ] Conflict resolution UI
- [ ] Sync progress indicators
- [ ] Background sync scheduling
- [ ] Data compression for large datasets
- [ ] Multi-device sync support

