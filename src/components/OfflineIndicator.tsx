/**
 * Offline Indicator Component
 * Shows network status and sync information
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { useOffline } from '../hooks/useOffline';
import { useTheme } from '../contexts/ThemeContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, unsyncedCount, sync, lastSyncTime } = useOffline();
  const { theme } = useTheme();

  // Calculate total unsynced items based on the synced flags in the database
  const totalUnsynced = unsyncedCount.bookings + unsyncedCount.wallets + unsyncedCount.attendants + unsyncedCount.queue;

  // Show indicator when:
  // 1. User is offline (regardless of data to sync)
  // 2. User is online but has data to sync
  // Hide syncing indicator entirely - let RefreshControl handle it during pull-to-refresh
  const isVisible = !isOnline || totalUnsynced > 0;

  // Hide/show status bar when indicator is visible to prevent overlap
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setHidden(isVisible, 'slide');
    }
    // On iOS, we'll use translucent status bar instead
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle(isVisible ? 'light-content' : 'default');
    }

    // Cleanup: restore status bar when component unmounts or becomes invisible
    return () => {
      if (Platform.OS === 'android' && !isVisible) {
        StatusBar.setHidden(false, 'slide');
      }
    };
  }, [isVisible]);

  // Hide indicator only when online and no data to sync
  if (!isVisible) {
    return null;
  }

  // Determine what content to show
  const hasContent = !isOnline || totalUnsynced > 0;

  // Don't render container if there's no content to show
  if (!hasContent) {
    return null;
  }

  const backgroundColor = !isOnline ? theme.error : theme.warning;
  const textColor = theme.textInverse;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {!isOnline ? (
          <>
            <Text style={[styles.text, styles.bold, { color: textColor }]}>Offline</Text>
            {totalUnsynced > 0 && (
              <Text style={[styles.text, styles.small, { color: textColor }]}>
                {totalUnsynced} item{totalUnsynced !== 1 ? 's' : ''} pending
              </Text>
            )}
          </>
        ) : totalUnsynced > 0 ? (
          <>
            <Text style={[styles.text, { color: textColor }]}>
              {totalUnsynced} item{totalUnsynced !== 1 ? 's' : ''} pending sync
            </Text>
            <TouchableOpacity
              onPress={sync}
              style={[styles.syncButton, { backgroundColor: textColor }]}
            >
              <Text style={[styles.syncButtonText, { color: backgroundColor }]}>Sync Now</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
      {/* Only show last sync time when there's actual content (offline or pending items) */}
      {lastSyncTime && isOnline && totalUnsynced > 0 && (
        <Text style={[styles.text, styles.small, styles.muted, { color: textColor }]}>
          Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: '#fff',
  },
  small: {
    fontSize: 12,
    marginLeft: 8,
  },
  bold: {
    fontWeight: '600',
  },
  muted: {
    opacity: 0.75,
  },
  spinner: {
    marginRight: 8,
  },
  syncButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

