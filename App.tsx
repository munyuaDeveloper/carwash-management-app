import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';
import { AppProvider } from './src/components/AppProvider';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ThemeAwareStatusBar } from './src/components/ThemeAwareStatusBar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <AppNavigator />
            <ThemeAwareStatusBar />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
