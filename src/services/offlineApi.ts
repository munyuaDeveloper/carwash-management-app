/**
 * Offline-First API Service
 * Wraps API calls to work offline-first: saves to local DB and syncs when online
 */

import { databaseService, DatabaseBooking, DatabaseWallet, DatabaseAttendant } from './database';
import { networkService } from './networkService';
import { bookingApi, walletApi, userApi } from './apiEnhanced';
import { walletApi as walletApiAxios } from './apiAxios';
import { syncService } from './syncService';
import { v4 as uuidv4 } from 'uuid';
import type { ApiBooking } from '../store/slices/bookingSlice';

/**
 * Convert API booking to database booking
 */
function apiBookingToDb(apiBooking: any, synced: boolean = true): DatabaseBooking {
  return {
    id: uuidv4(),
    serverId: apiBooking._id,
    carRegistrationNumber: apiBooking.carRegistrationNumber,
    phoneNumber: apiBooking.phoneNumber,
    color: apiBooking.color,
    attendantId: apiBooking.attendant._id,
    attendantName: apiBooking.attendant.name,
    attendantEmail: apiBooking.attendant.email,
    amount: apiBooking.amount,
    serviceType: apiBooking.serviceType,
    vehicleType: apiBooking.vehicleType,
    category: apiBooking.category,
    paymentType: apiBooking.paymentType,
    status: apiBooking.status,
    attendantPaid: apiBooking.attendantPaid,
    note: apiBooking.note,
    createdAt: apiBooking.createdAt,
    updatedAt: apiBooking.updatedAt,
    synced,
    syncStatus: synced ? 'synced' : 'pending',
  };
}

/**
 * Convert database booking to API booking format
 */
function dbBookingToApi(dbBooking: DatabaseBooking): ApiBooking {
  return {
    _id: dbBooking.serverId || dbBooking.id,
    carRegistrationNumber: dbBooking.carRegistrationNumber,
    phoneNumber: dbBooking.phoneNumber,
    color: dbBooking.color,
    attendant: {
      _id: dbBooking.attendantId,
      name: dbBooking.attendantName,
      email: dbBooking.attendantEmail,
    },
    amount: dbBooking.amount,
    serviceType: dbBooking.serviceType as 'full wash' | 'half wash' | undefined,
    vehicleType: dbBooking.vehicleType,
    category: dbBooking.category,
    paymentType: dbBooking.paymentType as any,
    status: dbBooking.status as any,
    attendantPaid: dbBooking.attendantPaid,
    note: dbBooking.note,
    createdAt: dbBooking.createdAt,
    updatedAt: dbBooking.updatedAt,
  };
}

/**
 * Calculate wallet balance changes when a booking is completed
 * Returns the changes to apply to wallet totals
 */
function calculateCompletedBookingWalletChanges(
  amount: number,
  paymentType: string
): {
  balanceChange: number;
  totalEarningsChange: number;
  totalCommissionChange: number;
  totalCompanyShareChange: number;
  companyDebtChange: number;
} {
  const commission = amount * 0.4; // 40% commission
  const companyShare = amount * 0.6; // 60% company share

  let balanceChange = 0;
  let companyDebtChange = 0;

  if (paymentType === 'attendant_cash') {
    // For attendant_cash: balance decreases by companyShare (attendant owes company)
    balanceChange = -companyShare;
    companyDebtChange = companyShare;
  } else {
    // For admin_cash/admin_till: balance increases by commission (no debt)
    balanceChange = commission;
    companyDebtChange = 0;
  }

  return {
    balanceChange,
    totalEarningsChange: amount,
    totalCommissionChange: commission,
    totalCompanyShareChange: companyShare,
    companyDebtChange,
  };
}

/**
 * Update wallet balance when a booking is completed (offline)
 */
async function updateWalletForCompletedBooking(
  attendantId: string,
  amount: number,
  paymentType: string,
  isAdding: boolean = true
): Promise<void> {
  try {
    // Get or create wallet
    let wallet = await databaseService.getWalletByAttendantId(attendantId);

    if (!wallet) {
      // Create a new wallet if it doesn't exist
      const now = new Date().toISOString();
      wallet = {
        id: uuidv4(),
        serverId: undefined,
        attendantId,
        attendantName: '',
        attendantEmail: '',
        balance: 0,
        totalEarnings: 0,
        totalCommission: 0,
        totalCompanyShare: 0,
        companyDebt: 0,
        isPaid: true,
        createdAt: now,
        updatedAt: now,
        synced: false,
        syncStatus: 'pending',
      };

      // Get attendant info
      const attendants = await databaseService.getAttendants();
      const attendant = attendants.find((a) => a.id === attendantId || a.serverId === attendantId);
      if (attendant) {
        wallet.attendantName = attendant.name;
        wallet.attendantEmail = attendant.email;
      }
    }

    // Calculate changes
    const changes = calculateCompletedBookingWalletChanges(amount, paymentType);
    const multiplier = isAdding ? 1 : -1; // Reverse if removing

    // Update wallet totals
    wallet.balance = (wallet.balance || 0) + changes.balanceChange * multiplier;
    wallet.totalEarnings = Math.max(0, (wallet.totalEarnings || 0) + changes.totalEarningsChange * multiplier);
    wallet.totalCommission = Math.max(0, (wallet.totalCommission || 0) + changes.totalCommissionChange * multiplier);
    wallet.totalCompanyShare = Math.max(0, (wallet.totalCompanyShare || 0) + changes.totalCompanyShareChange * multiplier);
    wallet.companyDebt = Math.max(0, (wallet.companyDebt || 0) + changes.companyDebtChange * multiplier);

    // Set isPaid to false if balance is not zero
    wallet.isPaid = wallet.balance === 0;
    wallet.updatedAt = new Date().toISOString();
    wallet.synced = false;
    wallet.syncStatus = 'pending';

    // Save wallet
    await databaseService.saveWallet(wallet);
  } catch (error) {
    console.error('[OfflineApi] Error updating wallet for completed booking:', error);
    // Don't throw - wallet update failure shouldn't block booking update
  }
}

/**
 * Offline-first booking API
 */
export const offlineBookingApi = {
  /**
   * Get all bookings (from local DB, syncs in background if online)
   */
  getAllBookings: async (
    token: string,
    filters?: any
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      // Always try to get from local DB first
      const localBookings = await databaseService.getBookings({
        status: filters?.status,
        category: filters?.category,
        attendantId: filters?.attendant,
        limit: filters?.limit || 50,
        offset: filters?.page ? (filters.page - 1) * (filters.limit || 50) : 0,
      });

      // Convert to API format
      const apiBookings = localBookings.map(dbBookingToApi);

      // If online, sync in background (don't wait)
      if (networkService.isOnline()) {
        syncService.syncAll(token).catch((error) => {
          console.error('[OfflineApi] Background sync error:', error);
        });
      }

      return {
        status: 'success',
        data: {
          status: 'success',
          results: apiBookings.length,
          data: {
            bookings: apiBookings,
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to fetch bookings',
      };
    }
  },

  /**
   * Create booking (saves locally, queues for sync)
   */
  createVehicleBooking: async (
    bookingData: any,
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const isOnline = networkService.isOnline();

      // Create local booking
      const dbBooking: DatabaseBooking = {
        id: uuidv4(),
        serverId: undefined,
        carRegistrationNumber: bookingData.carRegistrationNumber,
        phoneNumber: bookingData.phoneNumber,
        color: bookingData.color,
        attendantId: bookingData.attendant,
        attendantName: '', // Will be filled from attendant data
        attendantEmail: '',
        amount: bookingData.amount,
        serviceType: bookingData.serviceType,
        vehicleType: bookingData.vehicleType,
        category: bookingData.category || 'vehicle',
        paymentType: bookingData.paymentType,
        status: bookingData.status || 'pending',
        attendantPaid: false,
        note: bookingData.note,
        createdAt: now,
        updatedAt: now,
        synced: false,
        syncStatus: 'pending',
      };

      // Get attendant info
      const attendants = await databaseService.getAttendants();
      const attendant = attendants.find((a) => a.id === bookingData.attendant || a.serverId === bookingData.attendant);
      if (attendant) {
        dbBooking.attendantName = attendant.name;
        dbBooking.attendantEmail = attendant.email;
      }

      // Save locally
      await databaseService.saveBooking(dbBooking);

      // Update wallet if booking is created with completed status
      if (dbBooking.status === 'completed') {
        await updateWalletForCompletedBooking(
          dbBooking.attendantId,
          dbBooking.amount,
          dbBooking.paymentType,
          true // isAdding
        );
      }

      // If online, try to sync immediately
      if (isOnline) {
        try {
          const response = await bookingApi.createVehicleBooking(bookingData, token);
          if (response.status === 'success') {
            // Update with server ID
            dbBooking.serverId = (response.data as any)?.data?.booking?._id;
            dbBooking.synced = true;
            dbBooking.syncStatus = 'synced';
            await databaseService.saveBooking(dbBooking);

            return {
              status: 'success',
              data: response.data,
            };
          } else {
            // API call succeeded but returned error status, queue for retry
            await databaseService.addToSyncQueue('create', 'booking', dbBooking.id, bookingData);
          }
        } catch (error: any) {
          // Online sync failed, queue for later
          console.error('[OfflineApi] Online create failed, will sync later:', error);
          await databaseService.addToSyncQueue('create', 'booking', dbBooking.id, bookingData);
        }
      } else {
        // Offline, queue for sync
        await databaseService.addToSyncQueue('create', 'booking', dbBooking.id, bookingData);
      }

      return {
        status: 'success',
        data: {
          status: 'success',
          data: {
            booking: dbBookingToApi(dbBooking),
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to create booking',
      };
    }
  },

  /**
   * Create carpet booking (saves locally, queues for sync)
   */
  createCarpetBooking: async (
    bookingData: any,
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const isOnline = networkService.isOnline();

      // Create local booking
      const dbBooking: DatabaseBooking = {
        id: uuidv4(),
        serverId: undefined,
        carRegistrationNumber: undefined,
        phoneNumber: bookingData.phoneNumber,
        color: bookingData.color,
        attendantId: bookingData.attendant,
        attendantName: '',
        attendantEmail: '',
        amount: bookingData.amount,
        serviceType: undefined,
        vehicleType: undefined,
        category: 'carpet',
        paymentType: bookingData.paymentType,
        status: bookingData.status || 'pending',
        attendantPaid: false,
        note: bookingData.note,
        createdAt: now,
        updatedAt: now,
        synced: false,
        syncStatus: 'pending',
      };

      // Get attendant info
      const attendants = await databaseService.getAttendants();
      const attendant = attendants.find((a) => a.id === bookingData.attendant || a.serverId === bookingData.attendant);
      if (attendant) {
        dbBooking.attendantName = attendant.name;
        dbBooking.attendantEmail = attendant.email;
      }

      // Save locally
      await databaseService.saveBooking(dbBooking);

      // Update wallet if booking is created with completed status
      if (dbBooking.status === 'completed') {
        await updateWalletForCompletedBooking(
          dbBooking.attendantId,
          dbBooking.amount,
          dbBooking.paymentType,
          true // isAdding
        );
      }

      // If online, try to sync immediately
      if (isOnline) {
        try {
          const response = await bookingApi.createCarpetBooking(bookingData, token);
          if (response.status === 'success') {
            // Update with server ID
            dbBooking.serverId = (response.data as any)?.data?.booking?._id;
            dbBooking.synced = true;
            dbBooking.syncStatus = 'synced';
            await databaseService.saveBooking(dbBooking);

            return {
              status: 'success',
              data: response.data,
            };
          } else {
            // API call succeeded but returned error status, queue for retry
            await databaseService.addToSyncQueue('create', 'booking', dbBooking.id, bookingData);
          }
        } catch (error: any) {
          // Online sync failed, queue for later
          console.error('[OfflineApi] Online create failed, will sync later:', error);
          await databaseService.addToSyncQueue('create', 'booking', dbBooking.id, bookingData);
        }
      } else {
        // Offline, queue for sync
        await databaseService.addToSyncQueue('create', 'booking', dbBooking.id, bookingData);
      }

      return {
        status: 'success',
        data: {
          status: 'success',
          data: {
            booking: dbBookingToApi(dbBooking),
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to create booking',
      };
    }
  },

  /**
   * Update booking (updates locally, queues for sync)
   */
  updateBooking: async (
    id: string,
    bookingData: any,
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      // Ensure database is initialized
      await databaseService.initialize();

      // Try to find booking by local ID first, then by server ID
      let booking = await databaseService.getBookingById(id);
      let localId = id;
      if (!booking) {
        booking = await databaseService.getBookingByServerId(id);
        if (booking) {
          localId = booking.id;
        }
      }
      if (!booking) {
        return {
          status: 'error',
          error: 'Booking not found',
        };
      }

      // Map bookingData to DatabaseBooking format
      // Get attendant info if attendant ID changed
      let attendantName = booking.attendantName;
      let attendantEmail = booking.attendantEmail;
      let attendantId = booking.attendantId;

      if (bookingData.attendant && bookingData.attendant !== booking.attendantId) {
        const attendants = await databaseService.getAttendants();
        const attendant = attendants.find(
          (a) => a.id === bookingData.attendant || a.serverId === bookingData.attendant
        );
        if (attendant) {
          attendantId = attendant.id;
          attendantName = attendant.name;
          attendantEmail = attendant.email;
        }
      }

      // Determine status and payment type changes
      const oldStatus = booking.status;
      const newStatus = bookingData.status ?? booking.status;
      const oldPaymentType = booking.paymentType;
      const newPaymentType = bookingData.paymentType ?? booking.paymentType;
      const oldAmount = booking.amount;
      const newAmount = bookingData.amount ?? booking.amount;
      const oldAttendantId = booking.attendantId;
      const statusChangedToCompleted = oldStatus !== 'completed' && newStatus === 'completed';
      const statusChangedFromCompleted = oldStatus === 'completed' && newStatus !== 'completed';
      const wasCompleted = oldStatus === 'completed';
      const amountChanged = oldAmount !== newAmount;
      const paymentTypeChanged = oldPaymentType !== newPaymentType;
      const attendantChanged = oldAttendantId !== attendantId;

      // Update local booking with proper field mapping
      // IMPORTANT: Preserve serverId from original booking
      const updatedBooking: DatabaseBooking = {
        ...booking,
        carRegistrationNumber: bookingData.carRegistrationNumber ?? booking.carRegistrationNumber,
        phoneNumber: bookingData.phoneNumber ?? booking.phoneNumber,
        color: bookingData.color ?? booking.color,
        attendantId,
        attendantName,
        attendantEmail,
        amount: newAmount,
        serviceType: bookingData.serviceType ?? booking.serviceType,
        vehicleType: bookingData.vehicleType ?? booking.vehicleType,
        paymentType: newPaymentType,
        status: newStatus,
        note: bookingData.note ?? booking.note,
        updatedAt: new Date().toISOString(),
        // Don't set synced to false yet - we'll update it after attempting online sync
        synced: booking.synced, // Preserve original sync status
        syncStatus: booking.syncStatus, // Preserve original sync status
      };

      await databaseService.saveBooking(updatedBooking);

      // Update wallet balances based on status changes
      // Case 1: Status changed from completed to something else - remove from wallet
      if (statusChangedFromCompleted) {
        await updateWalletForCompletedBooking(
          oldAttendantId,
          oldAmount,
          oldPaymentType,
          false // isAdding = false (removing)
        );
      }

      // Case 2: Status changed to completed - add to wallet
      if (statusChangedToCompleted) {
        await updateWalletForCompletedBooking(
          attendantId,
          newAmount,
          newPaymentType,
          true // isAdding
        );
      }

      // Case 3: Booking was completed and amount/paymentType changed - update incrementally
      if (wasCompleted && !statusChangedToCompleted && !statusChangedFromCompleted && (amountChanged || paymentTypeChanged)) {
        // Remove old booking contribution
        await updateWalletForCompletedBooking(
          attendantId,
          oldAmount,
          oldPaymentType,
          false // isAdding = false (removing)
        );
        // Add new booking contribution
        await updateWalletForCompletedBooking(
          attendantId,
          newAmount,
          newPaymentType,
          true // isAdding
        );
      }

      // Case 4: Booking was completed and attendant changed - move between wallets
      if (wasCompleted && attendantChanged) {
        // Remove from original attendant's wallet
        await updateWalletForCompletedBooking(
          oldAttendantId,
          newAmount,
          newPaymentType,
          false // isAdding = false (removing)
        );
        // Add to new attendant's wallet
        await updateWalletForCompletedBooking(
          attendantId,
          newAmount,
          newPaymentType,
          true // isAdding
        );
      }

      // If online, try to sync immediately
      const isOnline = networkService.isOnline();
      const serverId = updatedBooking.serverId;
      const hasServerId = serverId && serverId.trim() !== '';


      if (isOnline && hasServerId && serverId) {
        try {
          console.log('[OfflineApi] Attempting online booking update for booking:', serverId);
          const response = await bookingApi.updateBooking(serverId, bookingData, token);
          if (response.status === 'success') {
            // Update booking with server response data if available
            const serverBooking = (response.data as any)?.data?.booking;
            if (serverBooking) {
              updatedBooking.serverId = serverBooking._id || updatedBooking.serverId;
              updatedBooking.updatedAt = serverBooking.updatedAt || updatedBooking.updatedAt;
            }
            updatedBooking.synced = true;
            updatedBooking.syncStatus = 'synced';
            await databaseService.saveBooking(updatedBooking);
            console.log('[OfflineApi] Booking update synced successfully online');

            return {
              status: 'success',
              data: response.data,
            };
          } else {
            // API call succeeded but returned error status, queue for retry
            console.warn('[OfflineApi] Booking update returned error status:', response.error);
            // Mark as unsynced and queue
            updatedBooking.synced = false;
            updatedBooking.syncStatus = 'pending';
            await databaseService.saveBooking(updatedBooking);
            await databaseService.addToSyncQueue('update', 'booking', localId, bookingData);
          }
        } catch (error: any) {
          // Online sync failed, queue for later
          const errorMessage = error?.message || error?.toString() || 'Unknown error';
          console.error('[OfflineApi] Online booking update failed, will sync later:', errorMessage);
          // Log full error for debugging
          if (error?.response) {
            console.error('[OfflineApi] API response error:', JSON.stringify(error.response, null, 2));
          }
          if (error?.request) {
            console.error('[OfflineApi] Request error:', error.request);
          }
          // Mark as unsynced and queue
          updatedBooking.synced = false;
          updatedBooking.syncStatus = 'pending';
          await databaseService.saveBooking(updatedBooking);
          await databaseService.addToSyncQueue('update', 'booking', localId, bookingData);
        }
      } else {
        // Offline or no serverId, queue for sync
        if (!isOnline) {
          console.log('[OfflineApi] Device is offline, queuing booking update for sync');
        } else if (!hasServerId) {
          console.warn('[OfflineApi] Booking has no serverId, cannot sync online. Queuing for sync. Booking ID:', localId);
        }
        // Mark as unsynced and queue
        updatedBooking.synced = false;
        updatedBooking.syncStatus = 'pending';
        await databaseService.saveBooking(updatedBooking);
        await databaseService.addToSyncQueue('update', 'booking', localId, bookingData);
      }

      return {
        status: 'success',
        data: {
          status: 'success',
          data: {
            booking: dbBookingToApi(updatedBooking),
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to update booking',
      };
    }
  },

  /**
   * Delete booking (deletes locally, queues for sync)
   */
  deleteBooking: async (
    id: string,
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      // Try to find booking by local ID first, then by server ID
      let booking = await databaseService.getBookingById(id);
      let localId = id;
      if (!booking) {
        booking = await databaseService.getBookingByServerId(id);
        if (booking) {
          localId = booking.id;
        }
      }
      if (!booking) {
        return {
          status: 'error',
          error: 'Booking not found',
        };
      }

      // If online and has server ID, delete from server
      if (networkService.isOnline() && booking.serverId) {
        try {
          const response = await bookingApi.deleteBooking(booking.serverId, token);
          if (response.status === 'success') {
            await databaseService.deleteBooking(id);
            return {
              status: 'success',
              data: response.data,
            };
          }
        } catch (error: any) {
          console.error('[OfflineApi] Online delete failed, will sync later:', error);
        }
      }

      // Mark as deleted locally (soft delete) or queue for sync
      await databaseService.addToSyncQueue('delete', 'booking', localId, {});
      await databaseService.deleteBooking(localId);

      return {
        status: 'success',
        data: { status: 'success' },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to delete booking',
      };
    }
  },
};

/**
 * Offline-first wallet API
 */
export const offlineWalletApi = {
  /**
   * Get all wallets (from local DB, syncs in background if online)
   */
  getAllWallets: async (
    token: string,
    date?: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      // Get from local DB
      const localWallets = await databaseService.getWallets();

      // If online, sync in background
      if (networkService.isOnline()) {
        syncService.syncAll(token).catch((error) => {
          console.error('[OfflineApi] Background sync error:', error);
        });
      }

      // Convert to API format
      const apiWallets = localWallets.map((wallet) => ({
        _id: wallet.serverId || wallet.id,
        attendant: {
          _id: wallet.attendantId,
          name: wallet.attendantName,
          email: wallet.attendantEmail,
          role: 'attendant' as const,
        },
        balance: wallet.balance,
        totalEarnings: wallet.totalEarnings,
        totalCommission: wallet.totalCommission,
        totalCompanyShare: wallet.totalCompanyShare,
        companyDebt: wallet.companyDebt,
        lastPaymentDate: wallet.lastPaymentDate,
        isPaid: wallet.isPaid,
        adjustments: wallet.adjustments || [], // Include adjustments from local DB
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      }));

      return {
        status: 'success',
        data: {
          status: 'success',
          data: {
            wallets: apiWallets,
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to fetch wallets',
      };
    }
  },

  /**
   * Get my wallet (from local DB, syncs in background if online)
   */
  getMyWallet: async (
    token: string,
    date?: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      // Get user ID from token (we'll need to get it from auth state)
      // For now, get all wallets and filter - in production, store user ID in wallet
      const localWallets = await databaseService.getWallets();

      // If online, sync in background
      if (networkService.isOnline()) {
        syncService.syncAll(token).catch((error) => {
          console.error('[OfflineApi] Background sync error:', error);
        });
      }

      // Return first wallet for now (in production, filter by current user)
      // This is a limitation - we'd need to store user ID in the wallet record
      const wallet = localWallets[0];

      if (!wallet) {
        return {
          status: 'error',
          error: 'Wallet not found',
        };
      }

      const apiWallet = {
        _id: wallet.serverId || wallet.id,
        attendant: {
          _id: wallet.attendantId,
          name: wallet.attendantName,
          email: wallet.attendantEmail,
          role: 'attendant' as const,
        },
        balance: wallet.balance,
        totalEarnings: wallet.totalEarnings,
        totalCommission: wallet.totalCommission,
        totalCompanyShare: wallet.totalCompanyShare,
        companyDebt: wallet.companyDebt,
        lastPaymentDate: wallet.lastPaymentDate,
        isPaid: wallet.isPaid,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      };

      return {
        status: 'success',
        data: {
          status: 'success',
          data: {
            wallet: apiWallet,
            date: date || new Date().toISOString().split('T')[0],
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to fetch wallet',
      };
    }
  },

  /**
   * Settle attendant balances (requires online - queues if offline)
   * Note: This is a financial operation, so we require online connection
   */
  settleAttendantBalances: async (
    attendantIds: string[],
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      const isOnline = networkService.isOnline();

      if (!isOnline) {
        // Queue for sync when online
        await databaseService.addToSyncQueue('update', 'wallet', `settle_${Date.now()}`, {
          operation: 'settleAttendantBalances',
          attendantIds,
        });

        return {
          status: 'success',
          data: {
            status: 'success',
            message: 'Settlement queued. Will process when online.',
            data: {
              settledWallets: [],
              errors: [],
            },
          },
        };
      }

      // If online, try to settle immediately
      try {
        const response = await walletApi.settleAttendantBalances(attendantIds, token);
        if (response.status === 'success') {
          // Update local wallets after settlement
          // The sync service will handle updating wallet data
          return response;
        }
        throw new Error(response.error || 'Failed to settle balances');
      } catch (error: any) {
        // If online operation fails, queue it
        await databaseService.addToSyncQueue('update', 'wallet', `settle_${Date.now()}`, {
          operation: 'settleAttendantBalances',
          attendantIds,
        });

        return {
          status: 'error',
          error: error.message || 'Failed to settle balances. Queued for retry.',
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to settle attendant balances',
      };
    }
  },

  /**
   * Mark attendant as paid (requires online - queues if offline)
   */
  markAttendantPaid: async (
    attendantId: string,
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      const isOnline = networkService.isOnline();

      if (!isOnline) {
        // Queue for sync when online
        await databaseService.addToSyncQueue('update', 'wallet', `mark_paid_${attendantId}_${Date.now()}`, {
          operation: 'markAttendantPaid',
          attendantId,
        });

        // Update local wallet optimistically
        const wallet = await databaseService.getWalletByAttendantId(attendantId);
        if (wallet) {
          wallet.isPaid = true;
          wallet.synced = false;
          wallet.syncStatus = 'pending';
          await databaseService.saveWallet(wallet);
        }

        return {
          status: 'success',
          data: {
            status: 'success',
            message: 'Marked as paid locally. Will sync when online.',
            data: {
              wallet: wallet ? {
                _id: wallet.serverId || wallet.id,
                attendant: {
                  _id: wallet.attendantId,
                  name: wallet.attendantName,
                  email: wallet.attendantEmail,
                  role: 'attendant' as const,
                },
                balance: wallet.balance,
                totalEarnings: wallet.totalEarnings,
                totalCommission: wallet.totalCommission,
                totalCompanyShare: wallet.totalCompanyShare,
                companyDebt: wallet.companyDebt,
                lastPaymentDate: wallet.lastPaymentDate,
                isPaid: true,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt,
              } : null,
            },
          },
        };
      }

      // If online, try to mark as paid immediately
      try {
        const response = await walletApi.markAttendantPaid(attendantId, token);
        if (response.status === 'success') {
          // Update local wallet
          const wallet = await databaseService.getWalletByAttendantId(attendantId);
          if (wallet) {
            wallet.isPaid = true;
            wallet.synced = true;
            wallet.syncStatus = 'synced';
            await databaseService.saveWallet(wallet);
          }
          return response;
        }
        throw new Error(response.error || 'Failed to mark attendant as paid');
      } catch (error: any) {
        // If online operation fails, queue it
        await databaseService.addToSyncQueue('update', 'wallet', `mark_paid_${attendantId}_${Date.now()}`, {
          operation: 'markAttendantPaid',
          attendantId,
        });

        return {
          status: 'error',
          error: error.message || 'Failed to mark as paid. Queued for retry.',
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to mark attendant as paid',
      };
    }
  },

  /**
   * Adjust wallet balance (updates locally optimistically, queues for sync)
   */
  adjustWalletBalance: async (
    attendantId: string,
    adjustmentData: { amount: number; type: string; reason?: string },
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      const isOnline = networkService.isOnline();

      // Get current wallet
      const wallet = await databaseService.getWalletByAttendantId(attendantId);
      if (!wallet) {
        return {
          status: 'error',
          error: 'Wallet not found',
        };
      }

      // Calculate new balance based on adjustment type
      let newBalance = wallet.balance;
      if (adjustmentData.type === 'add' || adjustmentData.type === 'credit' || adjustmentData.type === 'tip') {
        // Add to balance (tip, add, credit)
        newBalance += adjustmentData.amount;
      } else if (adjustmentData.type === 'subtract' || adjustmentData.type === 'debit' || adjustmentData.type === 'deduction') {
        // Subtract from balance (deduction, subtract, debit)
        newBalance -= adjustmentData.amount;
      } else if (adjustmentData.type === 'set') {
        // For 'set' type, use amount directly
        newBalance = adjustmentData.amount;
      } else {
        // Default: treat as add if unknown type
        console.warn(`[OfflineApi] Unknown adjustment type: ${adjustmentData.type}, treating as add`);
        newBalance += adjustmentData.amount;
      }

      // Update local wallet optimistically
      const updatedWallet: DatabaseWallet = {
        ...wallet,
        balance: newBalance,
        updatedAt: new Date().toISOString(),
        synced: false,
        syncStatus: 'pending',
      };

      await databaseService.saveWallet(updatedWallet);

      if (!isOnline) {
        // Queue for sync when online
        await databaseService.addToSyncQueue('update', 'wallet', `adjust_${attendantId}_${Date.now()}`, {
          operation: 'adjustWalletBalance',
          attendantId,
          adjustmentData,
        });

        return {
          status: 'success',
          data: {
            status: 'success',
            message: 'Balance adjusted locally. Will sync when online.',
            data: {
              wallet: {
                _id: updatedWallet.serverId || updatedWallet.id,
                attendant: {
                  _id: updatedWallet.attendantId,
                  name: updatedWallet.attendantName,
                  email: updatedWallet.attendantEmail,
                  role: 'attendant' as const,
                },
                balance: updatedWallet.balance,
                totalEarnings: updatedWallet.totalEarnings,
                totalCommission: updatedWallet.totalCommission,
                totalCompanyShare: updatedWallet.totalCompanyShare,
                companyDebt: updatedWallet.companyDebt,
                lastPaymentDate: updatedWallet.lastPaymentDate,
                isPaid: updatedWallet.isPaid,
                createdAt: updatedWallet.createdAt,
                updatedAt: updatedWallet.updatedAt,
              },
            },
          },
        };
      }

      // If online, try to adjust immediately
      try {
        const response = await walletApiAxios.adjustWalletBalance(attendantId, adjustmentData, token);
        if (response.status === 'success') {
          // Update local wallet with server response
          const serverWallet = (response.data as any)?.data?.wallet;
          if (serverWallet) {
            updatedWallet.balance = serverWallet.balance;
            updatedWallet.totalEarnings = serverWallet.totalEarnings || updatedWallet.totalEarnings;
            updatedWallet.totalCommission = serverWallet.totalCommission || updatedWallet.totalCommission;
            updatedWallet.totalCompanyShare = serverWallet.totalCompanyShare || updatedWallet.totalCompanyShare;
            updatedWallet.companyDebt = serverWallet.companyDebt || updatedWallet.companyDebt;
          }
          updatedWallet.synced = true;
          updatedWallet.syncStatus = 'synced';
          await databaseService.saveWallet(updatedWallet);

          return response;
        }
        throw new Error(response.error || 'Failed to adjust wallet balance');
      } catch (error: any) {
        // If online operation fails, queue it (wallet already updated locally)
        await databaseService.addToSyncQueue('update', 'wallet', `adjust_${attendantId}_${Date.now()}`, {
          operation: 'adjustWalletBalance',
          attendantId,
          adjustmentData,
        });

        // Return success with local update, but note it needs sync
        return {
          status: 'success',
          data: {
            status: 'success',
            message: 'Balance adjusted locally. Will sync when connection is restored.',
            data: {
              wallet: {
                _id: updatedWallet.serverId || updatedWallet.id,
                attendant: {
                  _id: updatedWallet.attendantId,
                  name: updatedWallet.attendantName,
                  email: updatedWallet.attendantEmail,
                  role: 'attendant' as const,
                },
                balance: updatedWallet.balance,
                totalEarnings: updatedWallet.totalEarnings,
                totalCommission: updatedWallet.totalCommission,
                totalCompanyShare: updatedWallet.totalCompanyShare,
                companyDebt: updatedWallet.companyDebt,
                lastPaymentDate: updatedWallet.lastPaymentDate,
                isPaid: updatedWallet.isPaid,
                createdAt: updatedWallet.createdAt,
                updatedAt: updatedWallet.updatedAt,
              },
            },
          },
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to adjust wallet balance',
      };
    }
  },
};

/**
 * Offline-first attendant API
 */
export const offlineAttendantApi = {
  /**
   * Get all attendants (from local DB, syncs immediately if online and empty)
   */
  getAllAttendants: async (
    token: string
  ): Promise<{ status: 'success' | 'error'; data?: any; error?: string }> => {
    try {
      // Get from local DB first
      let localAttendants = await databaseService.getAttendants({ role: 'attendant' });

      // If online and no local attendants, fetch immediately
      if (networkService.isOnline() && localAttendants.length === 0) {
        try {
          const response = await userApi.getAllUsers(token, 'attendant');
          if (response.status === 'success') {
            const users = (response.data as any)?.data?.users || [];

            // Save attendants to local DB
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

              // Check if already exists
              const existing = await databaseService.getAttendants({ role: 'attendant' });
              const existingAttendant = existing.find((a) => a.serverId === user._id);
              if (existingAttendant) {
                attendant.id = existingAttendant.id;
              }

              await databaseService.saveAttendant(attendant);
            }

            // Reload from DB
            localAttendants = await databaseService.getAttendants({ role: 'attendant' });
          }
        } catch (error: any) {
          console.error('[OfflineApi] Error fetching attendants:', error);
          // Continue with empty list if fetch fails
        }
      } else if (networkService.isOnline()) {
        // If online and we have local data, sync in background to update
        syncService.syncAll(token).catch((error) => {
          console.error('[OfflineApi] Background sync error:', error);
        });
      }

      // Convert to API format
      const apiAttendants = localAttendants.map((attendant) => ({
        _id: attendant.serverId || attendant.id,
        name: attendant.name,
        email: attendant.email,
        role: attendant.role,
        photo: attendant.photo,
        isAvailable: attendant.isAvailable,
        createdAt: attendant.createdAt,
        updatedAt: attendant.updatedAt,
      }));

      return {
        status: 'success',
        data: {
          status: 'success',
          data: {
            users: apiAttendants,
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to fetch attendants',
      };
    }
  },
};

