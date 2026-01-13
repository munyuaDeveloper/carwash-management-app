/**
 * Offline Configuration
 * Configure offline-first behavior
 */

export const OFFLINE_CONFIG = {
  // Enable/disable offline mode
  enabled: true,

  // Auto-sync settings
  autoSync: {
    enabled: true,
    delay: 2000, // Delay before auto-sync when network comes online (ms)
    interval: 300000, // Auto-sync interval when online (5 minutes)
  },

  // Sync limits
  sync: {
    maxBookings: 100, // Maximum number of bookings to sync
    maxRetries: 5, // Maximum retry attempts for failed operations
    retryDelay: 5000, // Delay between retries (ms)
  },

  // Database settings
  database: {
    name: 'carwash.db',
    version: 1,
  },
};

