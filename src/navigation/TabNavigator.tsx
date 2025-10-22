import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { AttendantWalletsScreen } from '../screens/AttendantWalletsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; iconType: 'FontAwesome' | 'MaterialIcons'; focused: boolean }> = ({ icon, iconType, focused }) => {
  const { theme } = useTheme();

  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', opacity: focused ? 1 : 0.6 }}>
      {iconType === 'FontAwesome' ? (
        <Icon
          name={icon}
          size={20}
          color={focused ? theme.tabActive : theme.tabInactive}
        />
      ) : (
        <MaterialIcon
          name={icon}
          size={20}
          color={focused ? theme.tabActive : theme.tabInactive}
        />
      )}
    </View>
  );
};

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
  const { theme } = useTheme();
  const themeStyles = useThemeStyles();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBackground,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingHorizontal: 4,
          height: 60 + Math.max(insets.bottom, 8),
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: theme.shadow === 'rgba(0, 0, 0, 0.3)' ? 0.3 : 0.1,
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
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
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
