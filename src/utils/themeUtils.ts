import { ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Utility functions for creating theme-aware styles
 */

// Theme-aware class name generator
export const getThemeClasses = (baseClasses: string, isDark: boolean): string => {
  const darkModeClasses = baseClasses
    .split(' ')
    .map(cls => {
      // Map common light theme classes to dark theme equivalents
      const classMap: Record<string, string> = {
        'bg-white': 'dark:bg-dark-surface',
        'bg-gray-50': 'dark:bg-dark-background',
        'bg-gray-100': 'dark:bg-dark-surfaceSecondary',
        'text-gray-900': 'dark:text-dark-text',
        'text-gray-600': 'dark:text-dark-textSecondary',
        'text-gray-500': 'dark:text-dark-textTertiary',
        'border-gray-200': 'dark:border-dark-border',
        'border-gray-300': 'dark:border-dark-borderDark',
        'shadow-sm': 'dark:shadow-theme-dark',
        'shadow': 'dark:shadow-theme-dark-lg',
      };

      return classMap[cls] ? `${cls} ${classMap[cls]}` : cls;
    })
    .join(' ');

  return darkModeClasses;
};

// Common theme-aware style combinations
export const useThemeStyles = () => {
  const { theme, isDark } = useTheme();

  return {
    // Container styles
    container: {
      backgroundColor: theme.background,
    } as ViewStyle,

    surface: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    } as ViewStyle,

    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,

    // Text styles
    text: {
      color: theme.text,
    } as TextStyle,

    textSecondary: {
      color: theme.textSecondary,
    } as TextStyle,

    textTertiary: {
      color: theme.textTertiary,
    } as TextStyle,

    // Button styles
    buttonPrimary: {
      backgroundColor: theme.buttonPrimary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as ViewStyle,

    buttonPrimaryText: {
      color: theme.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '600' as const,
    } as TextStyle,

    buttonSecondary: {
      backgroundColor: theme.buttonSecondary,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as ViewStyle,

    buttonSecondaryText: {
      color: theme.buttonSecondaryText,
      fontSize: 16,
      fontWeight: '600' as const,
    } as TextStyle,

    // Input styles
    input: {
      backgroundColor: theme.input,
      borderColor: theme.inputBorder,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.text,
    } as ViewStyle,

    inputFocused: {
      borderColor: theme.inputFocus,
      borderWidth: 2,
    } as ViewStyle,

    // Status styles
    statusSuccess: {
      backgroundColor: theme.successLight,
      borderColor: theme.success,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    } as ViewStyle,

    statusWarning: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warning,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    } as ViewStyle,

    statusError: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    } as ViewStyle,

    // Tab styles
    tabContainer: {
      backgroundColor: theme.tabBackground,
      borderTopColor: theme.border,
      borderTopWidth: 1,
    } as ViewStyle,

    tabActive: {
      color: theme.tabActive,
    } as TextStyle,

    tabInactive: {
      color: theme.tabInactive,
    } as TextStyle,

    // Header styles
    header: {
      backgroundColor: theme.surface,
      borderBottomColor: theme.border,
      borderBottomWidth: 1,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,

    // List styles
    listItem: {
      backgroundColor: theme.surface,
      borderBottomColor: theme.border,
      borderBottomWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
    } as ViewStyle,

    listItemLast: {
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
    } as ViewStyle,

    // Modal styles
    modalOverlay: {
      backgroundColor: theme.overlay,
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    } as ViewStyle,

    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      margin: 20,
      maxWidth: '90%',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.2,
      shadowRadius: 8,
      elevation: 8,
    } as ViewStyle,

    // Utility functions
    getColor: (colorName: keyof typeof theme) => theme[colorName],
    isDark,
  };
};

// Predefined theme-aware class combinations for common use cases
export const themeClasses = {
  // Background classes
  background: 'bg-light-background dark:bg-dark-background',
  surface: 'bg-light-surface dark:bg-dark-surface',
  surfaceSecondary: 'bg-light-surfaceSecondary dark:bg-dark-surfaceSecondary',

  // Text classes
  text: 'text-light-text dark:text-dark-text',
  textSecondary: 'text-light-textSecondary dark:text-dark-textSecondary',
  textTertiary: 'text-light-textTertiary dark:text-dark-textTertiary',

  // Border classes
  border: 'border-light-border dark:border-dark-border',
  borderLight: 'border-light-borderLight dark:border-dark-borderLight',
  borderDark: 'border-light-borderDark dark:border-dark-borderDark',

  // Card classes
  card: 'bg-light-card dark:bg-dark-card border-light-cardBorder dark:border-dark-cardBorder',

  // Button classes
  buttonPrimary: 'bg-light-buttonPrimary dark:bg-dark-buttonPrimary',
  buttonPrimaryText: 'text-light-buttonPrimaryText dark:text-dark-buttonPrimaryText',
  buttonSecondary: 'bg-light-buttonSecondary dark:bg-dark-buttonSecondary',
  buttonSecondaryText: 'text-light-buttonSecondaryText dark:text-dark-buttonSecondaryText',

  // Input classes
  input: 'bg-light-input dark:bg-dark-input border-light-inputBorder dark:border-dark-inputBorder',

  // Status classes
  success: 'bg-light-success dark:bg-dark-success',
  warning: 'bg-light-warning dark:bg-dark-warning',
  error: 'bg-light-error dark:bg-dark-error',

  // Tab classes
  tabActive: 'text-light-tabActive dark:text-dark-tabActive',
  tabInactive: 'text-light-tabInactive dark:text-dark-tabInactive',
  tabBackground: 'bg-light-tabBackground dark:bg-dark-tabBackground',
};

// Helper function to combine multiple theme classes
export const combineThemeClasses = (...classes: string[]): string => {
  return classes.join(' ');
};

// Helper function to create conditional theme classes
export const conditionalThemeClasses = (
  condition: boolean,
  trueClasses: string,
  falseClasses: string
): string => {
  return condition ? trueClasses : falseClasses;
};
