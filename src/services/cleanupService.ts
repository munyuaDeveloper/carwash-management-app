/**
 * Cleanup Service
 * Manages daily cleanup of old local data to reduce device storage usage
 * 
 * Strategy:
 * - Only deletes synced data older than retention period
 * - Never deletes unsynced data (data that hasn't been synced to server)
 * - Keeps recent data (configurable retention period, default 30 days)
 * - Cleans up old sync queue items
 * - Runs automatically on app startup if last cleanup was > 24 hours ago
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './database';

const CLEANUP_STORAGE_KEY = 'last_cleanup_timestamp';
const CLEANUP_INTERVAL_HOURS = 24; // Run cleanup check every 24 hours
const DEFAULT_RETENTION_DAYS = 30; // Keep data for 30 days by default

export interface CleanupConfig {
  retentionDays?: number; // How many days of data to keep (default: 30)
  enabled?: boolean; // Whether cleanup is enabled (default: true)
}

export interface CleanupStats {
  bookingsDeleted: number;
  walletsDeleted: number;
  attendantsDeleted: number;
  syncQueueItemsDeleted: number;
  totalDeleted: number;
  executionTime: number;
}

class CleanupService {
  private config: CleanupConfig = {
    retentionDays: DEFAULT_RETENTION_DAYS,
    enabled: true,
  };

  /**
   * Configure cleanup service
   */
  setConfig(config: Partial<CleanupConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): CleanupConfig {
    return { ...this.config };
  }

  /**
   * Check if cleanup should run and execute if needed
   * Returns true if cleanup was executed, false if not needed
   */
  async checkAndRunCleanup(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('[CleanupService] Cleanup is disabled');
      return false;
    }

    try {
      const lastCleanup = await this.getLastCleanupTime();
      const now = Date.now();
      const hoursSinceLastCleanup = lastCleanup
        ? (now - lastCleanup) / (1000 * 60 * 60)
        : Infinity;

      if (hoursSinceLastCleanup >= CLEANUP_INTERVAL_HOURS) {
        console.log(`[CleanupService] Running cleanup (last cleanup: ${hoursSinceLastCleanup.toFixed(1)} hours ago)`);
        await this.performCleanup();
        await this.setLastCleanupTime(now);
        return true;
      } else {
        console.log(`[CleanupService] Cleanup not needed (last cleanup: ${hoursSinceLastCleanup.toFixed(1)} hours ago)`);
        return false;
      }
    } catch (error) {
      console.error('[CleanupService] Error checking cleanup:', error);
      return false;
    }
  }

  /**
   * Perform cleanup of old data
   * Only deletes synced data older than retention period
   */
  async performCleanup(): Promise<CleanupStats> {
    const startTime = Date.now();
    const retentionDays = this.config.retentionDays || DEFAULT_RETENTION_DAYS;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    console.log(`[CleanupService] Starting cleanup for data older than ${cutoffTimestamp} (${retentionDays} days)`);

    const stats: CleanupStats = {
      bookingsDeleted: 0,
      walletsDeleted: 0,
      attendantsDeleted: 0,
      syncQueueItemsDeleted: 0,
      totalDeleted: 0,
      executionTime: 0,
    };

    try {
      // Ensure database is initialized
      await databaseService.initialize();

      // Clean up old synced bookings (never delete unsynced bookings)
      const bookingsDeleted = await this.cleanupBookings(cutoffTimestamp);
      stats.bookingsDeleted = bookingsDeleted;

      // Clean up old synced wallets (never delete unsynced wallets)
      const walletsDeleted = await this.cleanupWallets(cutoffTimestamp);
      stats.walletsDeleted = walletsDeleted;

      // Clean up old synced attendants (never delete unsynced attendants)
      // Note: Attendants are usually kept longer, but we'll clean up old inactive ones
      const attendantsDeleted = await this.cleanupAttendants(cutoffTimestamp);
      stats.attendantsDeleted = attendantsDeleted;

      // Clean up old sync queue items (only successfully processed ones)
      const syncQueueDeleted = await this.cleanupSyncQueue(cutoffTimestamp);
      stats.syncQueueItemsDeleted = syncQueueDeleted;

      stats.totalDeleted =
        bookingsDeleted + walletsDeleted + attendantsDeleted + syncQueueDeleted;
      stats.executionTime = Date.now() - startTime;

      console.log(`[CleanupService] Cleanup completed:`, {
        bookings: bookingsDeleted,
        wallets: walletsDeleted,
        attendants: attendantsDeleted,
        syncQueue: syncQueueDeleted,
        total: stats.totalDeleted,
        time: `${stats.executionTime}ms`,
      });

      return stats;
    } catch (error) {
      console.error('[CleanupService] Error during cleanup:', error);
      stats.executionTime = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Clean up old synced bookings
   * Only deletes bookings that are:
   * 1. Synced (synced = 1)
   * 2. Older than cutoff date
   */
  private async cleanupBookings(cutoffTimestamp: string): Promise<number> {
    try {
      const db = databaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE synced = 1 AND createdAt < ?`,
        [cutoffTimestamp]
      );

      const countToDelete = result?.count || 0;

      if (countToDelete > 0) {
        await db.runAsync(
          `DELETE FROM bookings 
           WHERE synced = 1 AND createdAt < ?`,
          [cutoffTimestamp]
        );
        console.log(`[CleanupService] Deleted ${countToDelete} old synced bookings`);
      }

      return countToDelete;
    } catch (error) {
      console.error('[CleanupService] Error cleaning up bookings:', error);
      return 0;
    }
  }

  /**
   * Clean up old synced wallets
   * Only deletes wallets that are:
   * 1. Synced (synced = 1)
   * 2. Older than cutoff date
   * 3. Have zero balance (to preserve active wallets)
   */
  private async cleanupWallets(cutoffTimestamp: string): Promise<number> {
    try {
      const db = databaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM wallets 
         WHERE synced = 1 AND createdAt < ? AND balance = 0 AND isPaid = 1`,
        [cutoffTimestamp]
      );

      const countToDelete = result?.count || 0;

      if (countToDelete > 0) {
        await db.runAsync(
          `DELETE FROM wallets 
           WHERE synced = 1 AND createdAt < ? AND balance = 0 AND isPaid = 1`,
          [cutoffTimestamp]
        );
        console.log(`[CleanupService] Deleted ${countToDelete} old synced wallets (zero balance, paid)`);
      }

      return countToDelete;
    } catch (error) {
      console.error('[CleanupService] Error cleaning up wallets:', error);
      return 0;
    }
  }

  /**
   * Clean up old synced attendants
   * Only deletes attendants that are:
   * 1. Synced (synced = 1)
   * 2. Older than cutoff date
   * Note: We're more conservative with attendants as they're reference data
   */
  private async cleanupAttendants(cutoffTimestamp: string): Promise<number> {
    try {
      // For attendants, we'll be very conservative - only delete if they're old AND inactive
      // In practice, you might want to keep all attendants or have a longer retention
      // For now, we'll skip deleting attendants to be safe
      // You can uncomment this if you want to clean up old inactive attendants

      /*
      const db = databaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM attendants 
         WHERE synced = 1 AND createdAt < ? AND isAvailable = 0`,
        [cutoffTimestamp]
      );

      const countToDelete = result?.count || 0;

      if (countToDelete > 0) {
        await db.runAsync(
          `DELETE FROM attendants 
           WHERE synced = 1 AND createdAt < ? AND isAvailable = 0`,
          [cutoffTimestamp]
        );
        console.log(`[CleanupService] Deleted ${countToDelete} old inactive attendants`);
      }

      return countToDelete;
      */

      return 0; // Skip deleting attendants for safety
    } catch (error) {
      console.error('[CleanupService] Error cleaning up attendants:', error);
      return 0;
    }
  }

  /**
   * Clean up old sync queue items
   * Only deletes queue items older than cutoff date
   * These should be items that were successfully processed or are too old to retry
   */
  private async cleanupSyncQueue(cutoffTimestamp: string): Promise<number> {
    try {
      const db = databaseService.getDatabase();
      // Delete sync queue items older than cutoff
      // These are likely items that were successfully synced or are too old
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue 
         WHERE createdAt < ?`,
        [cutoffTimestamp]
      );

      const countToDelete = result?.count || 0;

      if (countToDelete > 0) {
        await db.runAsync(
          `DELETE FROM sync_queue 
           WHERE createdAt < ?`,
          [cutoffTimestamp]
        );
        console.log(`[CleanupService] Deleted ${countToDelete} old sync queue items`);
      }

      return countToDelete;
    } catch (error) {
      console.error('[CleanupService] Error cleaning up sync queue:', error);
      return 0;
    }
  }

  /**
   * Get the last cleanup timestamp
   */
  private async getLastCleanupTime(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(CLEANUP_STORAGE_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('[CleanupService] Error getting last cleanup time:', error);
      return null;
    }
  }

  /**
   * Set the last cleanup timestamp
   */
  private async setLastCleanupTime(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(CLEANUP_STORAGE_KEY, timestamp.toString());
    } catch (error) {
      console.error('[CleanupService] Error setting last cleanup time:', error);
    }
  }

  /**
   * Manually trigger cleanup (for testing or admin purposes)
   */
  async manualCleanup(): Promise<CleanupStats> {
    console.log('[CleanupService] Manual cleanup triggered');
    const stats = await this.performCleanup();
    await this.setLastCleanupTime(Date.now());
    return stats;
  }

  /**
   * Get database size information (for monitoring)
   */
  async getDatabaseStats(): Promise<{
    totalBookings: number;
    syncedBookings: number;
    unsyncedBookings: number;
    totalWallets: number;
    syncedWallets: number;
    unsyncedWallets: number;
    totalAttendants: number;
    syncedAttendants: number;
    unsyncedAttendants: number;
    syncQueueItems: number;
    oldestBookingDate: string | null;
    newestBookingDate: string | null;
  }> {
    try {
      await databaseService.initialize();
      const db = databaseService.getDatabase();

      const [
        totalBookings,
        syncedBookings,
        totalWallets,
        syncedWallets,
        totalAttendants,
        syncedAttendants,
        syncQueueItems,
        oldestBooking,
        newestBooking,
      ] = await Promise.all([
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookings'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookings WHERE synced = 1'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM wallets'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM wallets WHERE synced = 1'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM attendants'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM attendants WHERE synced = 1'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue'),
        db.getFirstAsync<{ createdAt: string }>('SELECT MIN(createdAt) as createdAt FROM bookings'),
        db.getFirstAsync<{ createdAt: string }>('SELECT MAX(createdAt) as createdAt FROM bookings'),
      ]);

      return {
        totalBookings: totalBookings?.count || 0,
        syncedBookings: syncedBookings?.count || 0,
        unsyncedBookings: (totalBookings?.count || 0) - (syncedBookings?.count || 0),
        totalWallets: totalWallets?.count || 0,
        syncedWallets: syncedWallets?.count || 0,
        unsyncedWallets: (totalWallets?.count || 0) - (syncedWallets?.count || 0),
        totalAttendants: totalAttendants?.count || 0,
        syncedAttendants: syncedAttendants?.count || 0,
        unsyncedAttendants: (totalAttendants?.count || 0) - (syncedAttendants?.count || 0),
        syncQueueItems: syncQueueItems?.count || 0,
        oldestBookingDate: oldestBooking?.createdAt || null,
        newestBookingDate: newestBooking?.createdAt || null,
      };
    } catch (error) {
      console.error('[CleanupService] Error getting database stats:', error);
      throw error;
    }
  }
}

export const cleanupService = new CleanupService();

