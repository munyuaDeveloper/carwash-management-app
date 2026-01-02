import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector } from '../store/hooks';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { AttendantWalletsScreen } from '../screens/AttendantWalletsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; iconType: 'FontAwesome' | 'MaterialIcons'; focused: boolean }> = ({ icon, iconType, focused }) => {
  const { theme, isDark } = useTheme();

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

// Custom Tab Bar Component for full control on Android
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.tabBackground,
          borderTopColor: theme.border,
          height: 60 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 0,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : route.name
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const backgroundColor = isFocused
          ? (isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.4)')
          : 'transparent';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={1}
            style={[
              styles.tabButton,
              {
                backgroundColor,
                borderRadius: 25,
                width: '100%',
                maxWidth: 80,
              },
            ]}
          >
            {options.tabBarIcon &&
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? theme.tabActive : theme.tabInactive,
                size: 20,
              })}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? theme.tabActive : theme.tabInactive,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themeStyles = useThemeStyles();
  const { user } = useAppSelector((state) => state.auth);
  const isAttendant = user?.role === 'attendant';

  return (
    <Tab.Navigator
      initialRouteName={isAttendant ? "Bookings" : "Home"}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
      }}
    >
      {!isAttendant && (
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => renderHomeIcon(focused),
          }}
        />
      )}
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 0,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    justifyContent: 'space-evenly',
  },
  tabButton: {
    width: 80,
    maxWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    marginVertical: 4,
    minHeight: 48,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
