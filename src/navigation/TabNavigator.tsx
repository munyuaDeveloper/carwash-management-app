import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { AttendantWalletsScreen } from '../screens/AttendantWalletsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; iconType: 'FontAwesome' | 'MaterialIcons'; focused: boolean }> = ({ icon, iconType, focused }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-60'}`}>
    {iconType === 'FontAwesome' ? (
      <Icon name={icon} size={20} color={focused ? '#3B82F6' : '#6B7280'} />
    ) : (
      <MaterialIcon name={icon} size={20} color={focused ? '#3B82F6' : '#6B7280'} />
    )}
  </View>
);

const HomeIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="home" iconType="FontAwesome" focused={focused} />;
const BookingsIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="event" iconType="MaterialIcons" focused={focused} />;
const WalletIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="credit-card" iconType="FontAwesome" focused={focused} />;
const ProfileIcon: React.FC<{ focused: boolean }> = ({ focused }) => <TabIcon icon="user" iconType="FontAwesome" focused={focused} />;

const renderHomeIcon = (focused: boolean) => <HomeIcon focused={focused} />;
const renderBookingsIcon = (focused: boolean) => <BookingsIcon focused={focused} />;
const renderWalletIcon = (focused: boolean) => <WalletIcon focused={focused} />;
const renderProfileIcon = (focused: boolean) => <ProfileIcon focused={focused} />;

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingHorizontal: 4,
          height: 60 + Math.max(insets.bottom, 8),
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
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
        name="Wallets"
        component={AttendantWalletsScreen}
        options={{
          tabBarIcon: ({ focused }) => renderWalletIcon(focused),
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
