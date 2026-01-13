/**
 * Offline Authentication Service
 * Handles offline login with cached credentials
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { networkService } from './networkService';
import { authApi } from './apiEnhanced';

const STORAGE_KEYS = {
  CACHED_EMAIL: 'cached_email',
  CACHED_PASSWORD_HASH: 'cached_password_hash',
  LAST_ONLINE_LOGIN: 'last_online_login',
};

/**
 * Hash password for local storage (not for security, just for comparison)
 */
async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

/**
 * Store credentials locally after successful online login
 */
export async function cacheCredentials(email: string, password: string): Promise<void> {
  try {
    const passwordHash = await hashPassword(password);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.CACHED_EMAIL, email),
      SecureStore.setItemAsync(STORAGE_KEYS.CACHED_PASSWORD_HASH, passwordHash).catch(() => {
        // Fallback to AsyncStorage if SecureStore fails
        return AsyncStorage.setItem(STORAGE_KEYS.CACHED_PASSWORD_HASH, passwordHash);
      }),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ONLINE_LOGIN, new Date().toISOString()),
    ]);

    console.log('[OfflineAuth] Credentials cached successfully');
  } catch (error) {
    console.error('[OfflineAuth] Error caching credentials:', error);
  }
}

/**
 * Clear cached credentials
 */
export async function clearCachedCredentials(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.CACHED_EMAIL),
      SecureStore.deleteItemAsync(STORAGE_KEYS.CACHED_PASSWORD_HASH).catch(() => {
        return AsyncStorage.removeItem(STORAGE_KEYS.CACHED_PASSWORD_HASH);
      }),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_ONLINE_LOGIN),
    ]);
  } catch (error) {
    console.error('[OfflineAuth] Error clearing cached credentials:', error);
  }
}

/**
 * Check if cached credentials exist
 */
export async function hasCachedCredentials(): Promise<boolean> {
  try {
    const email = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_EMAIL);
    return !!email;
  } catch (error) {
    return false;
  }
}

/**
 * Get cached email
 */
export async function getCachedEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.CACHED_EMAIL);
  } catch (error) {
    return null;
  }
}

/**
 * Verify credentials offline
 */
export async function verifyOfflineCredentials(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const cachedEmail = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_EMAIL);
    if (cachedEmail !== email) {
      return false;
    }

    const passwordHash = await hashPassword(password);
    let cachedHash: string | null = null;

    try {
      cachedHash = await SecureStore.getItemAsync(STORAGE_KEYS.CACHED_PASSWORD_HASH);
    } catch {
      cachedHash = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PASSWORD_HASH);
    }

    return passwordHash === cachedHash;
  } catch (error) {
    console.error('[OfflineAuth] Error verifying offline credentials:', error);
    return false;
  }
}

/**
 * Offline login - attempts online first, falls back to offline
 */
export async function offlineLogin(
  email: string,
  password: string
): Promise<{ status: 'success' | 'error'; data?: any; error?: string; isOffline?: boolean }> {
  const isOnline = networkService.isOnline();

  // Try online login first if available
  if (isOnline) {
    try {
      const response = await authApi.login({ email, password });

      if (response.status === 'success') {
        // Cache credentials for future offline login
        await cacheCredentials(email, password);
        return response;
      }

      return response;
    } catch (error: any) {
      // If online login fails, try offline if credentials are cached
      console.log('[OfflineAuth] Online login failed, trying offline...');
    }
  }

  // Offline login with cached credentials
  const isValid = await verifyOfflineCredentials(email, password);

  if (!isValid) {
    return {
      status: 'error',
      error: isOnline
        ? 'Invalid email or password'
        : 'Invalid credentials or no cached login found. Please connect to internet to login.',
      isOffline: !isOnline,
    };
  }

  // Get stored user and token from AsyncStorage
  try {
    const userJson = await AsyncStorage.getItem('user');
    const token = await SecureStore.getItemAsync('auth_token').catch(() => {
      return AsyncStorage.getItem('auth_token');
    });

    if (!userJson || !token) {
      return {
        status: 'error',
        error: 'No cached session found. Please connect to internet to login.',
        isOffline: true,
      };
    }

    const user = JSON.parse(userJson);

    return {
      status: 'success',
      data: {
        token,
        data: {
          user,
        },
      },
      isOffline: true,
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: 'Failed to restore cached session. Please connect to internet to login.',
      isOffline: true,
    };
  }
}

