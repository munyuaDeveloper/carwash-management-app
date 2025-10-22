import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeAwareStatusBar: React.FC = () => {
  const { theme } = useTheme();

  return (
    <StatusBar
      style={theme.statusBar}
      backgroundColor={theme.background}
    />
  );
};
