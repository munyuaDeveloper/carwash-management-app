/**
 * Network Connectivity Service
 * Monitors network status and provides connectivity state
 */

import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
}

// Simple EventEmitter implementation for React Native
class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  removeListener(event: string, listener: Function): void {
    this.off(event, listener);
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`[EventEmitter] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  setMaxListeners(n: number): void {
    // No-op for React Native compatibility
  }
}

class NetworkService extends EventEmitter {
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: NetInfoStateType.unknown,
  };

  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners
  }

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    // Get initial state
    const initialState = await NetInfo.fetch();
    this.updateState(initialState);

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const previousState = { ...this.currentState };
      const wasOnline = previousState.isConnected && previousState.isInternetReachable === true;

      this.updateState(state);

      const isNowOnline = this.currentState.isConnected && this.currentState.isInternetReachable === true;

      // Emit events for state changes
      if (previousState.isConnected !== this.currentState.isConnected) {
        this.emit('connectivityChange', this.currentState);
      }

      if (previousState.isInternetReachable !== this.currentState.isInternetReachable) {
        this.emit('internetReachabilityChange', this.currentState);
      }

      // Emit combined event when online status changes
      if (wasOnline !== isNowOnline) {
        this.emit('onlineStatusChange', this.currentState);
      }
    });

    console.log('[NetworkService] Initialized', this.currentState);
  }

  /**
   * Update internal state from NetInfo state
   */
  private updateState(state: NetInfoState): void {
    this.currentState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type,
    };
  }

  /**
   * Get current network state
   */
  getState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if device is currently connected
   */
  isConnected(): boolean {
    return this.currentState.isConnected ?? false;
  }

  /**
   * Check if internet is reachable
   */
  isInternetReachable(): boolean {
    return this.currentState.isInternetReachable ?? false;
  }

  /**
   * Check if device is online (connected AND internet reachable)
   */
  isOnline(): boolean {
    return this.isConnected() && this.isInternetReachable() === true;
  }

  /**
   * Fetch current network state (async)
   */
  async fetchState(): Promise<NetworkState> {
    const state = await NetInfo.fetch();
    this.updateState(state);
    return this.getState();
  }

  /**
   * Wait for network to become available
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves when online, or rejects on timeout
   */
  waitForOnline(timeout: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isOnline()) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        this.removeListener('connectivityChange', checkOnline);
        reject(new Error('Network timeout: Device did not come online'));
      }, timeout);

      const checkOnline = (state: NetworkState) => {
        if (state.isConnected && state.isInternetReachable === true) {
          clearTimeout(timeoutId);
          this.removeListener('connectivityChange', checkOnline);
          resolve();
        }
      };

      this.once('connectivityChange', checkOnline);
    });
  }

  /**
   * Cleanup - unsubscribe from network monitoring
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.removeAllListeners();
  }
}

export const networkService = new NetworkService();

