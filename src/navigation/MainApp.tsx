import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { WalletAdjustmentsScreen } from '../screens/WalletAdjustmentsScreen';

const Stack = createNativeStackNavigator();

export const MainApp: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen
        name="WalletAdjustments"
        component={WalletAdjustmentsScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
};
