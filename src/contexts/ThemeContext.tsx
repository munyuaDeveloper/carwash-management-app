import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;

  // Shadow colors
  shadow: string;
  shadowLight: string;

  // Overlay colors
  overlay: string;
  overlayLight: string;

  // Card colors
  card: string;
  cardBorder: string;

  // Input colors
  input: string;
  inputBorder: string;
  inputFocus: string;
  inputPlaceholder: string;

  // Button colors
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDanger: string;
  buttonDangerText: string;

  // Tab colors
  tabActive: string;
  tabInactive: string;
  tabBackground: string;

  // Status bar
  statusBar: 'light' | 'dark';
}

const lightTheme: ThemeColors = {
  // Background colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  surfaceTertiary: '#e2e8f0',

  // Text colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',

  // Primary colors
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',

  // Secondary colors
  secondary: '#10b981',
  secondaryLight: '#34d399',
  secondaryDark: '#059669',

  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',

  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Card colors
  card: '#ffffff',
  cardBorder: '#e2e8f0',

  // Input colors
  input: '#ffffff',
  inputBorder: '#d1d5db',
  inputFocus: '#3b82f6',
  inputPlaceholder: '#9ca3af',

  // Button colors
  buttonPrimary: '#3b82f6',
  buttonPrimaryText: '#ffffff',
  buttonSecondary: '#f1f5f9',
  buttonSecondaryText: '#374151',
  buttonDanger: '#ef4444',
  buttonDangerText: '#ffffff',

  // Tab colors
  tabActive: '#3b82f6',
  tabInactive: '#64748b',
  tabBackground: '#ffffff',

  // Status bar
  statusBar: 'dark',
};

const darkTheme: ThemeColors = {
  // Background colors
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  surfaceTertiary: '#475569',

  // Text colors
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textInverse: '#0f172a',

  // Primary colors
  primary: '#60a5fa',
  primaryLight: '#93c5fd',
  primaryDark: '#3b82f6',

  // Secondary colors
  secondary: '#34d399',
  secondaryLight: '#6ee7b7',
  secondaryDark: '#10b981',

  // Status colors
  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#451a03',
  error: '#f87171',
  errorLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#1e3a8a',

  // Border colors
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1e293b',

  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Card colors
  card: '#1e293b',
  cardBorder: '#334155',

  // Input colors
  input: '#334155',
  inputBorder: '#475569',
  inputFocus: '#60a5fa',
  inputPlaceholder: '#64748b',

  // Button colors
  buttonPrimary: '#60a5fa',
  buttonPrimaryText: '#0f172a',
  buttonSecondary: '#334155',
  buttonSecondaryText: '#f8fafc',
  buttonDanger: '#f87171',
  buttonDangerText: '#0f172a',

  // Tab colors
  tabActive: '#60a5fa',
  tabInactive: '#94a3b8',
  tabBackground: '#1e293b',

  // Status bar
  statusBar: 'light',
};

export interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@carwash_theme_mode';

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine if the current theme should be dark
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Get the current theme colors
  const theme = isDark ? darkTheme : lightTheme;

  // Load saved theme mode on app start
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadThemeMode();
  }, []);

  // Save theme mode when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Don't render until theme is initialized
  if (!isInitialized) {
    return null;
  }

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting theme-aware styles
export const useThemeStyles = () => {
  const { theme, isDark } = useTheme();

  return {
    // Background styles
    background: { backgroundColor: theme.background },
    surface: { backgroundColor: theme.surface },
    surfaceSecondary: { backgroundColor: theme.surfaceSecondary },

    // Text styles
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textTertiary: { color: theme.textTertiary },
    textInverse: { color: theme.textInverse },

    // Border styles
    border: { borderColor: theme.border },
    borderLight: { borderColor: theme.borderLight },
    borderDark: { borderColor: theme.borderDark },

    // Card styles
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },

    // Input styles
    input: {
      backgroundColor: theme.input,
      borderColor: theme.inputBorder,
      color: theme.text,
    },

    // Button styles
    buttonPrimary: {
      backgroundColor: theme.buttonPrimary,
    },
    buttonPrimaryText: {
      color: theme.buttonPrimaryText,
    },
    buttonSecondary: {
      backgroundColor: theme.buttonSecondary,
    },
    buttonSecondaryText: {
      color: theme.buttonSecondaryText,
    },

    // Shadow styles
    shadow: {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    shadowLight: {
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },

    // Utility function to get color by name
    getColor: (colorName: keyof ThemeColors) => theme[colorName],

    // Utility function to check if dark mode
    isDark,
  };
};
