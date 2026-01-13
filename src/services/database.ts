/**
 * Offline Database Service
 * SQLite-based local storage for offline-first architecture
 */

import * as SQLite from 'expo-sqlite';

export interface DatabaseBooking {
  id: string;
  serverId?: string; // ID from server (null if not synced)
  carRegistrationNumber?: string;
  phoneNumber?: string;
  color?: string;
  attendantId: string;
  attendantName: string;
  attendantEmail: string;
  amount: number;
  serviceType?: string;
  vehicleType?: string;
  category: 'vehicle' | 'carpet';
  paymentType: string;
  status: string;
  attendantPaid: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean; // Whether this record has been synced to server
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt?: string;
}

export interface DatabaseWalletAdjustment {
  type: 'tip' | 'deduction';
  amount: number;
  reason: string | null;
  adjustedBy: string;
  adjustedAt: string;
}

export interface DatabaseWallet {
  id: string;
  serverId?: string;
  attendantId: string;
  attendantName: string;
  attendantEmail: string;
  balance: number;
  totalEarnings: number;
  totalCommission: number;
  totalCompanyShare: number;
  companyDebt: number;
  lastPaymentDate?: string;
  isPaid: boolean;
  adjustments?: DatabaseWalletAdjustment[];
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt?: string;
}

export interface DatabaseAttendant {
  id: string;
  serverId?: string;
  name: string;
  email: string;
  role: 'attendant' | 'admin';
  photo?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private initializing = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // If already initialized and db is valid, return
    if (this.initialized && this.db) {
      return;
    }

    // If already initializing, wait for that promise
    if (this.initializing && this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initializing = true;
    this.initPromise = this._doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.initializing = false;
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Close existing connection if any
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (e) {
          // Ignore close errors
        }
      }

      this.db = await SQLite.openDatabaseAsync('carwash.db');
      await this.createTables();
      await this.migrateTables();
      this.initialized = true;
      console.log('[Database] Initialized successfully');
    } catch (error) {
      this.initialized = false;
      this.db = null;
      console.error('[Database] Initialization error:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.db) {
      await this.initialize();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Bookings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        serverId TEXT,
        carRegistrationNumber TEXT,
        phoneNumber TEXT,
        color TEXT,
        attendantId TEXT NOT NULL,
        attendantName TEXT NOT NULL,
        attendantEmail TEXT NOT NULL,
        amount REAL NOT NULL,
        serviceType TEXT,
        vehicleType TEXT,
        category TEXT NOT NULL,
        paymentType TEXT NOT NULL,
        status TEXT NOT NULL,
        attendantPaid INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        syncStatus TEXT NOT NULL DEFAULT 'pending',
        lastSyncAttempt TEXT
      );
    `);

    // Wallets table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        serverId TEXT,
        attendantId TEXT NOT NULL,
        attendantName TEXT NOT NULL,
        attendantEmail TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        totalEarnings REAL NOT NULL DEFAULT 0,
        totalCommission REAL NOT NULL DEFAULT 0,
        totalCompanyShare REAL NOT NULL DEFAULT 0,
        companyDebt REAL NOT NULL DEFAULT 0,
        lastPaymentDate TEXT,
        isPaid INTEGER NOT NULL DEFAULT 0,
        adjustments TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        syncStatus TEXT NOT NULL DEFAULT 'pending',
        lastSyncAttempt TEXT
      );
    `);
  }

  private async migrateTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Add adjustments column to wallets table if it doesn't exist
    try {
      // Check if adjustments column exists
      const tableInfo = await this.db.getAllAsync<any>(
        "PRAGMA table_info(wallets)"
      );
      const hasAdjustmentsColumn = tableInfo.some((col: any) => col.name === 'adjustments');

      if (!hasAdjustmentsColumn) {
        await this.db.execAsync(`
          ALTER TABLE wallets ADD COLUMN adjustments TEXT;
        `);
        console.log('[Database] Added adjustments column to wallets table');
      }
    } catch (error) {
      // Column might already exist, ignore error
      console.warn('[Database] Migration check for adjustments column:', error);
    }
    // Attendants table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS attendants (
        id TEXT PRIMARY KEY,
        serverId TEXT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        photo TEXT,
        isAvailable INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        syncStatus TEXT NOT NULL DEFAULT 'pending',
        lastSyncAttempt TEXT
      );
    `);

    // Sync queue table for operations that need to be synced
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        data TEXT NOT NULL,
        retryCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        lastAttempt TEXT,
        error TEXT
      );
    `);

    // Create indexes for better query performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_bookings_serverId ON bookings(serverId);
      CREATE INDEX IF NOT EXISTS idx_bookings_attendantId ON bookings(attendantId);
      CREATE INDEX IF NOT EXISTS idx_bookings_synced ON bookings(synced);
      CREATE INDEX IF NOT EXISTS idx_wallets_serverId ON wallets(serverId);
      CREATE INDEX IF NOT EXISTS idx_wallets_attendantId ON wallets(attendantId);
      CREATE INDEX IF NOT EXISTS idx_attendants_serverId ON attendants(serverId);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entityType ON sync_queue(entityType);
    `);

    console.log('[Database] Tables created successfully');
  }

  // Bookings operations
  async saveBooking(booking: DatabaseBooking): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO bookings (
        id, serverId, carRegistrationNumber, phoneNumber, color,
        attendantId, attendantName, attendantEmail, amount, serviceType,
        vehicleType, category, paymentType, status, attendantPaid, note,
        createdAt, updatedAt, synced, syncStatus, lastSyncAttempt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.id,
        booking.serverId || null,
        booking.carRegistrationNumber || null,
        booking.phoneNumber || null,
        booking.color || null,
        booking.attendantId,
        booking.attendantName,
        booking.attendantEmail,
        booking.amount,
        booking.serviceType || null,
        booking.vehicleType || null,
        booking.category,
        booking.paymentType,
        booking.status,
        booking.attendantPaid ? 1 : 0,
        booking.note || null,
        booking.createdAt,
        booking.updatedAt,
        booking.synced ? 1 : 0,
        booking.syncStatus,
        booking.lastSyncAttempt || null,
      ]
    );
  }

  async getBookings(filters?: {
    attendantId?: string;
    status?: string;
    category?: string;
    synced?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DatabaseBooking[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];

    if (filters?.attendantId) {
      query += ' AND attendantId = ?';
      params.push(filters.attendantId);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.synced !== undefined) {
      query += ' AND synced = ?';
      params.push(filters.synced ? 1 : 0);
    }

    query += ' ORDER BY createdAt DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const result = await this.db!.getAllAsync<any>(query, params);
    return result.map((row: any) => ({
      ...row,
      attendantPaid: Boolean(row.attendantPaid),
      synced: Boolean(row.synced),
    }));
  }

  async getBookingById(id: string): Promise<DatabaseBooking | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      ...result,
      attendantPaid: Boolean(result.attendantPaid),
      synced: Boolean(result.synced),
    };
  }

  async getBookingByServerId(serverId: string): Promise<DatabaseBooking | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM bookings WHERE serverId = ?',
      [serverId]
    );

    if (!result) return null;

    return {
      ...result,
      attendantPaid: Boolean(result.attendantPaid),
      synced: Boolean(result.synced),
    };
  }

  async deleteBooking(id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM bookings WHERE id = ?', [id]);
  }

  // Wallets operations
  async saveWallet(wallet: DatabaseWallet): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Serialize adjustments array to JSON
    const adjustmentsJson = wallet.adjustments ? JSON.stringify(wallet.adjustments) : null;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO wallets (
        id, serverId, attendantId, attendantName, attendantEmail,
        balance, totalEarnings, totalCommission, totalCompanyShare,
        companyDebt, lastPaymentDate, isPaid, adjustments, createdAt, updatedAt,
        synced, syncStatus, lastSyncAttempt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wallet.id,
        wallet.serverId || null,
        wallet.attendantId,
        wallet.attendantName,
        wallet.attendantEmail,
        wallet.balance,
        wallet.totalEarnings,
        wallet.totalCommission,
        wallet.totalCompanyShare,
        wallet.companyDebt,
        wallet.lastPaymentDate || null,
        wallet.isPaid ? 1 : 0,
        adjustmentsJson,
        wallet.createdAt,
        wallet.updatedAt,
        wallet.synced ? 1 : 0,
        wallet.syncStatus,
        wallet.lastSyncAttempt || null,
      ]
    );
  }

  async getWallets(filters?: {
    attendantId?: string;
    synced?: boolean;
  }): Promise<DatabaseWallet[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM wallets WHERE 1=1';
    const params: any[] = [];

    if (filters?.attendantId) {
      query += ' AND attendantId = ?';
      params.push(filters.attendantId);
    }
    if (filters?.synced !== undefined) {
      query += ' AND synced = ?';
      params.push(filters.synced ? 1 : 0);
    }

    query += ' ORDER BY createdAt DESC';

    const result = await this.db.getAllAsync<any>(query, params);
    return result.map((row: any) => {
      // Parse adjustments JSON
      let adjustments: DatabaseWalletAdjustment[] | undefined;
      if (row.adjustments) {
        try {
          adjustments = JSON.parse(row.adjustments);
        } catch (e) {
          console.warn('[Database] Failed to parse adjustments JSON:', e);
          adjustments = undefined;
        }
      }

      return {
        ...row,
        isPaid: Boolean(row.isPaid),
        synced: Boolean(row.synced),
        adjustments,
      };
    });
  }

  async getWalletByAttendantId(attendantId: string): Promise<DatabaseWallet | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM wallets WHERE attendantId = ?',
      [attendantId]
    );

    if (!result) return null;

    // Parse adjustments JSON
    let adjustments: DatabaseWalletAdjustment[] | undefined;
    if (result.adjustments) {
      try {
        adjustments = JSON.parse(result.adjustments);
      } catch (e) {
        console.warn('[Database] Failed to parse adjustments JSON:', e);
        adjustments = undefined;
      }
    }

    return {
      ...result,
      isPaid: Boolean(result.isPaid),
      synced: Boolean(result.synced),
      adjustments,
    };
  }

  // Attendants operations
  async saveAttendant(attendant: DatabaseAttendant): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO attendants (
        id, serverId, name, email, role, photo, isAvailable,
        createdAt, updatedAt, synced, syncStatus, lastSyncAttempt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attendant.id,
        attendant.serverId || null,
        attendant.name,
        attendant.email,
        attendant.role,
        attendant.photo || null,
        attendant.isAvailable ? 1 : 0,
        attendant.createdAt,
        attendant.updatedAt,
        attendant.synced ? 1 : 0,
        attendant.syncStatus,
        attendant.lastSyncAttempt || null,
      ]
    );
  }

  async getAttendants(filters?: {
    role?: string;
    synced?: boolean;
  }): Promise<DatabaseAttendant[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM attendants WHERE 1=1';
    const params: any[] = [];

    if (filters?.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }
    if (filters?.synced !== undefined) {
      query += ' AND synced = ?';
      params.push(filters.synced ? 1 : 0);
    }

    query += ' ORDER BY name ASC';

    const result = await this.db.getAllAsync<any>(query, params);
    return result.map((row: any) => ({
      ...row,
      isAvailable: Boolean(row.isAvailable),
      synced: Boolean(row.synced),
    }));
  }

  async getAttendantById(id: string): Promise<DatabaseAttendant | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM attendants WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      ...result,
      isAvailable: Boolean(result.isAvailable),
      synced: Boolean(result.synced),
    };
  }

  // Sync queue operations
  async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    entityType: 'booking' | 'wallet' | 'attendant',
    entityId: string,
    data: any
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const id = `${entityType}_${entityId}_${Date.now()}`;
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, operation, entityType, entityId, data, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        operation,
        entityType,
        entityId,
        JSON.stringify(data),
        new Date().toISOString(),
      ]
    );
  }

  async getSyncQueue(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM sync_queue ORDER BY createdAt ASC'
    );

    return result.map((row: any) => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  /**
   * Remove sync queue entries for a specific entity
   * Useful when an entity syncs successfully online and we want to remove any pending queue entries
   */
  async removeSyncQueueEntriesForEntity(entityType: 'booking' | 'wallet' | 'attendant', entityId: string): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Get count before deletion for logging
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE entityType = ? AND entityId = ?',
      [entityType, entityId]
    );
    const count = countResult?.count || 0;

    if (count > 0) {
      await this.db.runAsync(
        'DELETE FROM sync_queue WHERE entityType = ? AND entityId = ?',
        [entityType, entityId]
      );
      console.log(`[Database] Removed ${count} sync queue entries for ${entityType}/${entityId}`);
    }

    return count;
  }

  async updateSyncQueueError(id: string, error: string, retryCount: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE sync_queue SET error = ?, retryCount = ?, lastAttempt = ? WHERE id = ?',
      [error, retryCount, new Date().toISOString(), id]
    );
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync(`
      DELETE FROM bookings;
      DELETE FROM wallets;
      DELETE FROM attendants;
      DELETE FROM sync_queue;
    `);
  }

  async getUnsyncedCount(): Promise<{ bookings: number; wallets: number; attendants: number; queue: number }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const [bookings, wallets, attendants, queue] = await Promise.all([
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookings WHERE synced = 0'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM wallets WHERE synced = 0'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM attendants WHERE synced = 0'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue'),
    ]);

    return {
      bookings: bookings?.count || 0,
      wallets: wallets?.count || 0,
      attendants: attendants?.count || 0,
      queue: queue?.count || 0,
    };
  }

  /**
   * Get database instance (for advanced operations like cleanup)
   * Use with caution - prefer using the service methods when possible
   */
  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }
}

export const databaseService = new DatabaseService();

