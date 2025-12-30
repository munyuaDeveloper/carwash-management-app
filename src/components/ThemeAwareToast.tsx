import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, DeviceEventEmitter } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'danger';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
  theme: any;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose, theme }) => {
  // Start at position 0 for immediate visibility - toast appears instantly
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current; // Start visible

  // No animation delay - toast is immediately visible
  // Optional: Add a subtle scale animation if desired, but keep it instant
  useEffect(() => {
    // Toast is already visible at position 0, no animation needed for immediate display
    // If you want a subtle effect, uncomment below:
    // opacityAnim.setValue(0.8);
    // Animated.timing(opacityAnim, {
    //   toValue: 1,
    //   duration: 100,
    //   useNativeDriver: true,
    // }).start();
  }, []);

  // Auto-hide after duration
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(toast.id);
    });
  };

  const getTypeColor = () => {
    switch (toast.type) {
      case 'success':
        return theme.success;
      case 'error':
      case 'danger':
        return theme.error;
      case 'warning':
        return theme.warning;
      case 'info':
      default:
        return theme.info;
    }
  };

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
      case 'danger':
        return 'times-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'info':
      default:
        return 'info-circle';
    }
  };

  const typeColor = getTypeColor();
  const iconName = getIconName();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderLeftColor: typeColor,
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          alignSelf: 'center', // Ensure toast is centered
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={24} color={typeColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{toast.title}</Text>
        {toast.message && (
          <Text style={[styles.message, { color: theme.textSecondary }]}>{toast.message}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={handleClose}
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <MaterialIcon name="close" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Theme-aware Toast component that adapts to light/dark mode
 * Listens to DeviceEventEmitter for toast events
 */
export const ThemeAwareToast: React.FC = () => {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (options: {
      type: ToastType;
      message: string;
      title?: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = {
        id,
        type: options.type,
        title: options.title || options.message,
        message: options.title ? options.message : undefined,
        duration: options.duration || 3000,
      };

      // Immediate state update - no batching delay
      setToasts((prev) => {
        // Remove any existing toasts of the same type to prevent duplicates
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered, newToast];
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.toastContainer}
      pointerEvents="box-none"
      collapsable={false} // Prevent Android from optimizing away this view
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={hideToast} theme={theme} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'android' ? 20 : 16,
    zIndex: 9999,
    elevation: Platform.OS === 'android' ? 1000 : 0, // High elevation for Android
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderLeftWidth: 5,
    height: 70,
    minHeight: 70,
    width: SCREEN_WIDTH - 32,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: Platform.OS === 'android' ? 10 : 8, // Higher elevation for Android
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
