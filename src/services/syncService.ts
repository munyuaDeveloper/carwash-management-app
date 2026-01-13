/**
 * Sync Service
 * Handles synchronization of local data with server when online
 */

import { databaseService, DatabaseBooking, DatabaseWallet, DatabaseAttendant, DatabaseWalletAdjustment } from './database';
import { networkService, NetworkState } from './networkService';
import { bookingApi, walletApi, userApi } from './apiEnhanced';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
  success: boolean;
  synced: {
    bookings: number;
    wallets: number;
    attendants: number;
    queue: number;
  };
  errors: Array<{
    type: string;
    id: string;
    error: string;
  }>;
}

class SyncService {
  private isSyncing = false;
  private syncListeners: Set<(isSyncing: boolean) => void> = new Set();

  /**
   * Check if sync is currently in progress
   */
  getSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (isSyncing: boolean) => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifySyncStatus(isSyncing: boolean): void {
    this.isSyncing = isSyncing;
    this.syncListeners.forEach((callback) => callback(isSyncing));
  }

  /**
   * Full sync - syncs all data types
   */
  async syncAll(token: string): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress, skipping...');
      return {
        success: false,
        synced: { bookings: 0, wallets: 0, attendants: 0, queue: 0 },
        errors: [{ type: 'sync', id: 'all', error: 'Sync already in progress' }],
      };
    }

    if (!networkService.isOnline()) {
      console.log('[SyncService] Device is offline, cannot sync');
      return {
        success: false,
        synced: { bookings: 0, wallets: 0, attendants: 0, queue: 0 },
        errors: [{ type: 'network', id: 'all', error: 'Device is offline' }],
      };
    }

    this.notifySyncStatus(true);

    try {
      const result: SyncResult = {
        success: true,
        synced: { bookings: 0, wallets: 0, attendants: 0, queue: 0 },
        errors: [],
      };

      // Sync in order: attendants -> bookings -> wallets -> queue
      const [attendantsResult, bookingsResult, walletsResult, queueResult] = await Promise.allSettled([
        this.syncAttendants(token),
        this.syncBookings(token),
        this.syncWallets(token),
        this.syncQueue(token),
      ]);

      if (attendantsResult.status === 'fulfilled') {
        result.synced.attendants = attendantsResult.value;
      } else {
        result.errors.push({ type: 'attendants', id: 'all', error: attendantsResult.reason?.message || 'Unknown error' });
      }

      if (bookingsResult.status === 'fulfilled') {
        result.synced.bookings = bookingsResult.value;
      } else {
        result.errors.push({ type: 'bookings', id: 'all', error: bookingsResult.reason?.message || 'Unknown error' });
      }

      if (walletsResult.status === 'fulfilled') {
        result.synced.wallets = walletsResult.value;
      } else {
        result.errors.push({ type: 'wallets', id: 'all', error: walletsResult.reason?.message || 'Unknown error' });
      }

      if (queueResult.status === 'fulfilled') {
        result.synced.queue = queueResult.value;
      } else {
        result.errors.push({ type: 'queue', id: 'all', error: queueResult.reason?.message || 'Unknown error' });
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      // Suppress network errors - they're expected in offline mode
      const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
      if (!isNetworkError) {
        console.error('[SyncService] Sync error:', error);
      }
      return {
        success: false,
        synced: { bookings: 0, wallets: 0, attendants: 0, queue: 0 },
        errors: [{ type: 'sync', id: 'all', error: error.message || 'Unknown error' }],
      };
    } finally {
      this.notifySyncStatus(false);
    }
  }

  /**
   * Sync attendants from server to local
   */
  private async syncAttendants(token: string): Promise<number> {
    try {
      const response = await userApi.getAllUsers(token, 'attendant');
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to fetch attendants');
      }

      const users = (response.data as any)?.data?.users || [];
      let syncedCount = 0;

      for (const user of users) {
        const attendant: DatabaseAttendant = {
          id: uuidv4(),
          serverId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          photo: user.photo,
          isAvailable: true,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
          synced: true,
          syncStatus: 'synced',
        };

        // Check if we already have this attendant locally
        const existing = await databaseService.getAttendants({ role: 'attendant' });
        const existingAttendant = existing.find((a) => a.serverId === user._id);

        if (existingAttendant) {
          attendant.id = existingAttendant.id;
          attendant.updatedAt = user.updatedAt || new Date().toISOString();
        }

        await databaseService.saveAttendant(attendant);
        syncedCount++;
      }

      console.log(`[SyncService] Synced ${syncedCount} attendants`);
      return syncedCount;
    } catch (error: any) {
      // Suppress network errors - they're expected in offline mode
      const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
      if (!isNetworkError) {
        console.error('[SyncService] Error syncing attendants:', error);
      }
      throw error;
    }
  }

  /**
   * Sync bookings from server to local
   */
  private async syncBookings(token: string): Promise<number> {
    try {
      // Fetch recent bookings (last 100)
      const response = await bookingApi.getAllBookings(token, {
        limit: 100,
        sort: '-createdAt',
      });

      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to fetch bookings');
      }

      const bookings = (response.data as any)?.data?.bookings || [];
      let syncedCount = 0;

      for (const booking of bookings) {
        const dbBooking: DatabaseBooking = {
          id: uuidv4(),
          serverId: booking._id,
          carRegistrationNumber: booking.carRegistrationNumber,
          phoneNumber: booking.phoneNumber,
          color: booking.color,
          attendantId: booking.attendant._id,
          attendantName: booking.attendant.name,
          attendantEmail: booking.attendant.email,
          amount: booking.amount,
          serviceType: booking.serviceType,
          vehicleType: booking.vehicleType,
          category: booking.category,
          paymentType: booking.paymentType,
          status: booking.status,
          attendantPaid: booking.attendantPaid,
          note: booking.note,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          synced: true,
          syncStatus: 'synced',
        };

        // Check if we already have this booking locally
        const existing = await databaseService.getBookingByServerId(booking._id);
        if (existing) {
          dbBooking.id = existing.id;
          // Only update if server version is newer
          if (new Date(booking.updatedAt) > new Date(existing.updatedAt)) {
            dbBooking.updatedAt = booking.updatedAt;
          } else {
            // Keep local changes if they're newer
            dbBooking.updatedAt = existing.updatedAt;
            dbBooking.synced = existing.synced;
            dbBooking.syncStatus = existing.syncStatus;
          }
        }

        await databaseService.saveBooking(dbBooking);
        syncedCount++;
      }

      console.log(`[SyncService] Synced ${syncedCount} bookings`);
      return syncedCount;
    } catch (error: any) {
      // Suppress network errors - they're expected in offline mode
      const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
      if (!isNetworkError) {
        console.error('[SyncService] Error syncing bookings:', error);
      }
      throw error;
    }
  }

  /**
   * Sync wallets from server to local
   */
  private async syncWallets(token: string): Promise<number> {
    try {
      const response = await walletApi.getAllWallets(token);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to fetch wallets');
      }

      const wallets = (response.data as any)?.data?.wallets || [];
      let syncedCount = 0;

      for (const wallet of wallets) {
        // Map server adjustments to database format
        const adjustments: DatabaseWalletAdjustment[] | undefined = wallet.adjustments
          ? wallet.adjustments.map((adj: any) => ({
            type: adj.type as 'tip' | 'deduction',
            amount: adj.amount,
            reason: adj.reason || null,
            adjustedBy: adj.adjustedBy,
            adjustedAt: adj.adjustedAt || new Date().toISOString(),
          }))
          : undefined;

        const dbWallet: DatabaseWallet = {
          id: uuidv4(),
          serverId: wallet._id,
          attendantId: wallet.attendant._id,
          attendantName: wallet.attendant.name,
          attendantEmail: wallet.attendant.email,
          balance: wallet.balance,
          totalEarnings: wallet.totalEarnings,
          totalCommission: wallet.totalCommission,
          totalCompanyShare: wallet.totalCompanyShare,
          companyDebt: wallet.companyDebt,
          lastPaymentDate: wallet.lastPaymentDate,
          isPaid: wallet.isPaid,
          adjustments,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
          synced: true,
          syncStatus: 'synced',
        };

        // Check if we already have this wallet locally
        const existing = await databaseService.getWalletByAttendantId(wallet.attendant._id);
        if (existing) {
          dbWallet.id = existing.id;

          // Check if there are pending adjustments in the sync queue for this wallet
          const syncQueue = await databaseService.getSyncQueue();
          const hasPendingAdjustments = syncQueue.some(
            (item) =>
              item.entityType === 'wallet' &&
              item.data?.attendantId === wallet.attendant._id &&
              item.data?.operation === 'adjustWalletBalance'
          );

          // Check if local wallet has unsynced changes (adjustments, etc.)
          const hasUnsyncedChanges = !existing.synced || existing.syncStatus !== 'synced' || hasPendingAdjustments;

          if (hasUnsyncedChanges) {
            // Preserve local unsynced changes - don't override with server data
            // Keep local balance and other values that might have been adjusted offline
            // This ensures adjustments are not lost when syncing wallets
            dbWallet.balance = existing.balance;
            dbWallet.totalEarnings = existing.totalEarnings;
            dbWallet.totalCommission = existing.totalCommission;
            dbWallet.totalCompanyShare = existing.totalCompanyShare;
            dbWallet.companyDebt = existing.companyDebt;
            dbWallet.isPaid = existing.isPaid;
            dbWallet.lastPaymentDate = existing.lastPaymentDate;
            dbWallet.adjustments = existing.adjustments; // Preserve local adjustments
            dbWallet.updatedAt = existing.updatedAt;
            dbWallet.synced = existing.synced;
            dbWallet.syncStatus = existing.syncStatus;

            // Only update server ID if we don't have one yet
            if (!existing.serverId) {
              dbWallet.serverId = wallet._id;
            }
          } else {
            // Local wallet is synced and no pending adjustments, so we can safely update from server
            if (new Date(wallet.updatedAt) > new Date(existing.updatedAt)) {
              // Server version is newer, use server data including adjustments
              dbWallet.balance = wallet.balance;
              dbWallet.totalEarnings = wallet.totalEarnings;
              dbWallet.totalCommission = wallet.totalCommission;
              dbWallet.totalCompanyShare = wallet.totalCompanyShare;
              dbWallet.companyDebt = wallet.companyDebt;
              dbWallet.isPaid = wallet.isPaid;
              dbWallet.lastPaymentDate = wallet.lastPaymentDate;
              dbWallet.adjustments = adjustments; // Use server adjustments
              dbWallet.updatedAt = wallet.updatedAt;
              dbWallet.synced = true;
              dbWallet.syncStatus = 'synced';
            } else {
              // Local version is newer or same, keep local data including adjustments
              dbWallet.balance = existing.balance;
              dbWallet.totalEarnings = existing.totalEarnings;
              dbWallet.totalCommission = existing.totalCommission;
              dbWallet.totalCompanyShare = existing.totalCompanyShare;
              dbWallet.companyDebt = existing.companyDebt;
              dbWallet.isPaid = existing.isPaid;
              dbWallet.lastPaymentDate = existing.lastPaymentDate;
              dbWallet.adjustments = existing.adjustments; // Keep local adjustments
              dbWallet.updatedAt = existing.updatedAt;
              dbWallet.synced = existing.synced;
              dbWallet.syncStatus = existing.syncStatus;
            }
          }
        }

        await databaseService.saveWallet(dbWallet);
        syncedCount++;
      }

      console.log(`[SyncService] Synced ${syncedCount} wallets`);
      return syncedCount;
    } catch (error: any) {
      // Suppress network errors - they're expected in offline mode
      const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
      if (!isNetworkError) {
        console.error('[SyncService] Error syncing wallets:', error);
      }
      throw error;
    }
  }

  /**
   * Sync pending queue operations to server
   */
  private async syncQueue(token: string): Promise<number> {
    try {
      const queue = await databaseService.getSyncQueue();
      let syncedCount = 0;

      for (const item of queue) {
        try {
          let success = false;

          switch (item.entityType) {
            case 'booking':
              success = await this.syncQueueBooking(item, token);
              break;
            case 'wallet':
              success = await this.syncQueueWallet(item, token);
              break;
            case 'attendant':
              success = await this.syncQueueAttendant(item, token);
              break;
          }

          if (success) {
            await databaseService.removeFromSyncQueue(item.id);
            syncedCount++;
            console.log(`[SyncService] Successfully synced queue item ${item.id} (${item.entityType}/${item.operation})`);
          } else {
            // Update retry count and error
            const retryCount = (item.retryCount || 0) + 1;
            const errorMessage = `Sync failed for ${item.entityType}/${item.operation}`;
            await databaseService.updateSyncQueueError(
              item.id,
              errorMessage,
              retryCount
            );

            // Log failure (but suppress network errors)
            const isNetworkError = errorMessage?.includes('Network error') || errorMessage?.includes('network');
            if (!isNetworkError) {
              console.warn(`[SyncService] Failed to sync queue item ${item.id} (${item.entityType}/${item.operation}), retry ${retryCount}/5`);
            }

            // Remove from queue after too many retries
            if (retryCount >= 5) {
              console.warn(`[SyncService] Removing queue item ${item.id} after ${retryCount} failed attempts`);
              await databaseService.removeFromSyncQueue(item.id);
            }
          }
        } catch (error: any) {
          // Suppress network errors - they're expected in offline mode
          const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
          if (!isNetworkError) {
            console.error(`[SyncService] Error syncing queue item ${item.id} (${item.entityType}/${item.operation}):`, error);
          }
          const retryCount = (item.retryCount || 0) + 1;
          await databaseService.updateSyncQueueError(
            item.id,
            error.message || 'Unknown error',
            retryCount
          );
        }
      }

      console.log(`[SyncService] Synced ${syncedCount} queue items`);
      return syncedCount;
    } catch (error: any) {
      console.error('[SyncService] Error syncing queue:', error);
      throw error;
    }
  }

  private async syncQueueBooking(item: any, token: string): Promise<boolean> {
    const { operation, data, entityId } = item;

    try {
      if (operation === 'create') {
        // Check the booking category to use the correct API
        const booking = await databaseService.getBookingById(entityId);
        if (!booking) {
          console.error(`[SyncService] Booking ${entityId} not found in local database`);
          return false;
        }

        let response;
        if (booking.category === 'carpet') {
          response = await bookingApi.createCarpetBooking(data, token);
        } else {
          response = await bookingApi.createVehicleBooking(data, token);
        }

        if (response.status === 'success') {
          // Update local booking with server ID
          booking.serverId = (response.data as any)?.data?.booking?._id;
          booking.synced = true;
          booking.syncStatus = 'synced';
          await databaseService.saveBooking(booking);
          return true;
        } else {
          console.error(`[SyncService] Failed to create booking: ${response.error}`);
          return false;
        }
      } else if (operation === 'update') {
        const booking = await databaseService.getBookingById(entityId);
        if (!booking) {
          console.error(`[SyncService] Booking ${entityId} not found in local database`);
          return false;
        }

        if (!booking.serverId) {
          console.error(`[SyncService] Booking ${entityId} has no serverId, cannot update`);
          return false;
        }

        const response = await bookingApi.updateBooking(booking.serverId, data, token);
        if (response.status === 'success') {
          booking.synced = true;
          booking.syncStatus = 'synced';
          await databaseService.saveBooking(booking);
          return true;
        } else {
          console.error(`[SyncService] Failed to update booking: ${response.error}`);
          return false;
        }
      } else if (operation === 'delete') {
        const booking = await databaseService.getBookingById(entityId);
        if (!booking?.serverId) {
          console.error(`[SyncService] Booking ${entityId} has no serverId, cannot delete`);
          return false;
        }

        const response = await bookingApi.deleteBooking(booking.serverId, token);
        if (response.status === 'success') {
          await databaseService.deleteBooking(entityId);
          return true;
        } else {
          console.error(`[SyncService] Failed to delete booking: ${response.error}`);
          return false;
        }
      }
    } catch (error: any) {
      // Suppress network errors - they're expected in offline mode
      const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
      if (!isNetworkError) {
        console.error('[SyncService] Error syncing booking:', error);
      }
    }

    return false;
  }

  private async syncQueueWallet(item: any, token: string): Promise<boolean> {
    // For wallet operations, the actual operation type is stored in data.operation
    // The item.operation is just 'update' (the queue operation type)
    const operation = item.data?.operation || item.operation;
    const { data } = item;

    try {
      if (operation === 'settleAttendantBalances') {
        const response = await walletApi.settleAttendantBalances(data.attendantIds, token);
        if (response.status === 'success') {
          // Update local wallets with reset balances from server response
          const responseData = (response.data as any)?.data;
          const settledWallets = responseData?.settledWallets || [];

          for (const settledWallet of settledWallets) {
            const wallet = await databaseService.getWalletByAttendantId(settledWallet.attendantId);
            if (wallet) {
              // Update with server data (balance reset to 0, isPaid = true)
              wallet.balance = settledWallet.wallet.balance || 0;
              wallet.totalEarnings = settledWallet.wallet.totalEarnings || 0;
              wallet.totalCommission = settledWallet.wallet.totalCommission || 0;
              wallet.totalCompanyShare = settledWallet.wallet.totalCompanyShare || 0;
              wallet.companyDebt = settledWallet.wallet.companyDebt || 0;
              wallet.isPaid = true;
              wallet.lastPaymentDate = new Date().toISOString();
              wallet.synced = true;
              wallet.syncStatus = 'synced';
              wallet.updatedAt = new Date().toISOString();
              await databaseService.saveWallet(wallet);
            }
          }

          // Also sync wallets to get any other updates
          await this.syncWallets(token);
          return true;
        }
      } else if (operation === 'markAttendantPaid') {
        const response = await walletApi.markAttendantPaid(data.attendantId, token);
        if (response.status === 'success') {
          // Update local wallet with server response (balance should be reset)
          const responseData = (response.data as any)?.data;
          const serverWallet = responseData?.wallet;

          const wallet = await databaseService.getWalletByAttendantId(data.attendantId);
          if (wallet) {
            if (serverWallet) {
              // Update with server data (balance reset to 0, isPaid = true)
              wallet.balance = serverWallet.balance || 0;
              wallet.totalEarnings = serverWallet.totalEarnings || wallet.totalEarnings;
              wallet.totalCommission = serverWallet.totalCommission || wallet.totalCommission;
              wallet.totalCompanyShare = serverWallet.totalCompanyShare || wallet.totalCompanyShare;
              wallet.companyDebt = serverWallet.companyDebt || 0;
              wallet.lastPaymentDate = serverWallet.lastPaymentDate || new Date().toISOString();
            } else {
              // Fallback: reset balance if server data not available
              wallet.balance = 0;
              wallet.companyDebt = 0;
              wallet.lastPaymentDate = new Date().toISOString();
            }
            wallet.isPaid = true;
            wallet.synced = true;
            wallet.syncStatus = 'synced';
            wallet.updatedAt = new Date().toISOString();
            await databaseService.saveWallet(wallet);
          }
          return true;
        }
      } else if (operation === 'adjustWalletBalance') {
        // Use apiAxios since apiEnhanced doesn't have this method
        const { walletApi: walletApiAxios } = await import('./apiAxios');
        const response = await walletApiAxios.adjustWalletBalance(
          data.attendantId,
          data.adjustmentData,
          token
        );
        if (response.status === 'success') {
          // Update local wallet with server response
          // The server has applied the adjustment, so we use the server balance
          const responseData = (response.data as any)?.data;
          const serverWallet = responseData?.wallet;

          if (serverWallet) {
            const wallet = await databaseService.getWalletByAttendantId(data.attendantId);
            if (wallet) {
              // Use server balance as it includes the adjustment we just synced
              wallet.balance = serverWallet.balance;
              wallet.totalEarnings = serverWallet.totalEarnings || wallet.totalEarnings;
              wallet.totalCommission = serverWallet.totalCommission || wallet.totalCommission;
              wallet.totalCompanyShare = serverWallet.totalCompanyShare || wallet.totalCompanyShare;
              wallet.companyDebt = serverWallet.companyDebt || wallet.companyDebt;
              wallet.synced = true;
              wallet.syncStatus = 'synced';
              wallet.updatedAt = new Date().toISOString();
              await databaseService.saveWallet(wallet);
            }
          }
          return true;
        }
      }
    } catch (error: any) {
      // Suppress network errors - they're expected in offline mode
      const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
      if (!isNetworkError) {
        console.error('[SyncService] Error syncing wallet operation:', error);
      }
    }

    return false;
  }

  private async syncQueueAttendant(item: any, token: string): Promise<boolean> {
    // Attendant operations are typically read-only from client
    // Most attendant updates come from server
    return true;
  }

  /**
   * Auto-sync when network comes online
   */
  async setupAutoSync(token: string): Promise<void> {
    // Check if already online and sync immediately
    if (networkService.isOnline()) {
      console.log('[SyncService] Already online, starting initial sync...');
      setTimeout(() => {
        this.syncAll(token).catch((error) => {
          // Suppress network errors
          const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
          if (!isNetworkError) {
            console.error('[SyncService] Auto-sync error:', error);
          }
        });
      }, 1000);
    }

    // Listen for connectivity changes
    const handleConnectivityChange = async (state: NetworkState) => {
      if (state.isConnected && state.isInternetReachable === true) {
        console.log('[SyncService] Network online, starting auto-sync...');
        // Wait a bit before syncing to ensure connection is stable
        setTimeout(() => {
          this.syncAll(token).catch((error) => {
            // Suppress network errors
            const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
            if (!isNetworkError) {
              console.error('[SyncService] Auto-sync error:', error);
            }
          });
        }, 2000);
      }
    };

    // Listen for online status changes (combined event)
    const handleOnlineStatusChange = async (state: NetworkState) => {
      if (state.isConnected && state.isInternetReachable === true) {
        console.log('[SyncService] Online status changed, starting auto-sync...');
        setTimeout(() => {
          this.syncAll(token).catch((error) => {
            // Suppress network errors
            const isNetworkError = error?.message?.includes('Network error') || error?.message?.includes('network');
            if (!isNetworkError) {
              console.error('[SyncService] Auto-sync error:', error);
            }
          });
        }, 2000);
      }
    };

    networkService.on('connectivityChange', handleConnectivityChange);
    networkService.on('onlineStatusChange', handleOnlineStatusChange);
  }
}

export const syncService = new SyncService();

