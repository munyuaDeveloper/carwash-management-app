/**
 * Offline Hook
 * Provides offline functionality and sync status
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { initializeOffline, syncAll, checkUnsyncedCount, setNetworkState, setSyncing } from '../store/slices/offlineSlice';
import { networkService } from '../services/networkService';
import { syncService } from '../services/syncService';

export const useOffline = () => {
  const dispatch = useDispatch<AppDispatch>();
  const offlineState = useSelector((state: RootState) => state.offline);
  const token = useSelector((state: RootState) => state.auth.token);

  // Initialize offline services on mount
  useEffect(() => {
    dispatch(initializeOffline());

    // Set up network state listener for connectivity changes
    const handleConnectivityChange = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => {
      dispatch(setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      }));
    };

    // Set up network state listener for internet reachability changes
    const handleInternetReachabilityChange = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => {
      dispatch(setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      }));
    };

    // Set up listener for online status changes (combined event)
    const handleOnlineStatusChange = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => {
      dispatch(setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      }));
    };

    networkService.on('connectivityChange', handleConnectivityChange);
    networkService.on('internetReachabilityChange', handleInternetReachabilityChange);
    networkService.on('onlineStatusChange', handleOnlineStatusChange);

    // Set up sync status listener
    const unsubscribeSync = syncService.onSyncStatusChange((isSyncing) => {
      dispatch(setSyncing(isSyncing));
      // When sync completes, refresh the unsynced count based on synced flags in database
      if (!isSyncing) {
        // Sync just finished, refresh count to reflect current synced state
        dispatch(checkUnsyncedCount());
      }
    });

    // Set up auto-sync if token is available
    if (token) {
      syncService.setupAutoSync(token).catch((error) => {
        console.error('[useOffline] Auto-sync setup error:', error);
      });
    }

    return () => {
      networkService.off('connectivityChange', handleConnectivityChange);
      networkService.off('internetReachabilityChange', handleInternetReachabilityChange);
      networkService.off('onlineStatusChange', handleOnlineStatusChange);
      unsubscribeSync();
    };
  }, [dispatch, token]);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!token) {
      console.warn('[useOffline] Cannot sync: no token');
      return;
    }

    if (!offlineState.isOnline) {
      console.warn('[useOffline] Cannot sync: device is offline');
      return;
    }

    await dispatch(syncAll(token));
    await dispatch(checkUnsyncedCount());
  }, [dispatch, token, offlineState.isOnline]);

  // Check unsynced count
  const refreshUnsyncedCount = useCallback(async () => {
    await dispatch(checkUnsyncedCount());
  }, [dispatch]);

  return {
    ...offlineState,
    sync,
    refreshUnsyncedCount,
  };
};

