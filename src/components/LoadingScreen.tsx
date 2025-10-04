import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-gray-600 text-base mt-4">Loading...</Text>
    </SafeAreaView>
  );
};
