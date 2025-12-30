import { DeviceEventEmitter } from 'react-native';

/**
 * Helper function to safely convert any value to a string
 */
const toString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return value.message || 'An error occurred';
  }
  if (typeof value === 'object' && value !== null) {
    // Try to extract message property
    if ('message' in value && typeof value.message === 'string') {
      return value.message;
    }
    if ('error' in value && typeof value.error === 'string') {
      return value.error;
    }
    // Try JSON.stringify
    try {
      return JSON.stringify(value);
    } catch {
      return 'An error occurred';
    }
  }
  return String(value);
};

/**
 * Toast utility functions for showing success, error, info, and warning messages
 * Uses DeviceEventEmitter for cross-component communication
 */
export const showToast = {
  success: (message: string | unknown, title?: string) => {
    const messageStr = toString(message);
    const titleStr = title ? toString(title) : null;

    DeviceEventEmitter.emit('SHOW_TOAST', {
      type: 'success',
      message: messageStr || 'Success',
      title: titleStr || undefined,
      duration: 3000,
    });
  },

  error: (message: string | unknown, title?: string) => {
    const messageStr = toString(message);
    const titleStr = title ? toString(title) : null;

    DeviceEventEmitter.emit('SHOW_TOAST', {
      type: 'danger', // Map error to danger for the event
      message: messageStr || 'Error',
      title: titleStr || undefined,
      duration: 5000,
    });
  },

  info: (message: string | unknown, title?: string) => {
    const messageStr = toString(message);
    const titleStr = title ? toString(title) : null;

    DeviceEventEmitter.emit('SHOW_TOAST', {
      type: 'info',
      message: messageStr || 'Info',
      title: titleStr || undefined,
      duration: 3000,
    });
  },

  warning: (message: string | unknown, title?: string) => {
    const messageStr = toString(message);
    const titleStr = title ? toString(title) : null;

    DeviceEventEmitter.emit('SHOW_TOAST', {
      type: 'warning',
      message: messageStr || 'Warning',
      title: titleStr || undefined,
      duration: 3000,
    });
  },
};
