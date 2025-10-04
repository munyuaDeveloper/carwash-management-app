import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';
import { AppProvider } from './src/components/AppProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
