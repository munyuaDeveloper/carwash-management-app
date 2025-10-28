import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';
import { AppProvider } from './src/components/AppProvider';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ThemeAwareStatusBar } from './src/components/ThemeAwareStatusBar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const enableImmersive = async () => {
      try {
        // Hide the Android navigation bar and enable transient, swipe-to-reveal behavior
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        await NavigationBar.setVisibilityAsync('hidden');
        // Optional: make nav bar fully transparent when it shows
        await NavigationBar.setBackgroundColorAsync('transparent');
      } catch {
        // noop: avoid crashing if device/OS disallows full hide (gesture nav)
      }
    };

    enableImmersive();
  }, []);

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
