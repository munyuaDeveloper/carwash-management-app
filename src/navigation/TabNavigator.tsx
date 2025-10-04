import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-60'}`}>
    <Text className="text-lg">{icon}</Text>
  </View>
);

const HomeIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="🏠" focused={focused} />;
const BookingsIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="📅" focused={focused} />;
const CustomersIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="👥" focused={focused} />;
const ProfileIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="👤" focused={focused} />;

const renderHomeIcon = (focused: boolean) => <HomeIcon focused={focused} />;
const renderBookingsIcon = (focused: boolean) => <BookingsIcon focused={focused} />;
const renderCustomersIcon = (focused: boolean) => <CustomersIcon focused={focused} />;
const renderProfileIcon = (focused: boolean) => <ProfileIcon focused={focused} />;

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          padding: 2,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => renderHomeIcon(focused),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => renderBookingsIcon(focused),
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarIcon: ({ focused }) => renderCustomersIcon(focused),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => renderProfileIcon(focused),
        }}
      />
    </Tab.Navigator>
  );
};
