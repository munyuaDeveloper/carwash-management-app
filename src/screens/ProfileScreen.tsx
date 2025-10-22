import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { logout } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export const ProfileScreen: React.FC = () => {
  const { user, isLoading } = useAppSelector((state: any) => state.auth);
  const { theme, isDark, toggleTheme, themeMode } = useTheme();
  const themeStyles = useThemeStyles();
  const dispatch = useAppDispatch();

  const menuItems = [
    { title: 'Edit Profile', icon: 'user', iconType: 'FontAwesome', color: 'bg-blue-500' },
    { title: 'Settings', icon: 'settings', iconType: 'MaterialIcons', color: 'bg-gray-500' },
    { title: 'About', icon: 'info', iconType: 'MaterialIcons', color: 'bg-purple-500' },
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              // Navigation will be handled by the auth state change
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[themeStyles.container, { flex: 1 }]}>
      {/* Header */}
      <View style={[themeStyles.surface, { paddingHorizontal: 24, paddingVertical: 32, paddingTop: 64 }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={[
            { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
            { backgroundColor: theme.primary }
          ]}>
            <Text style={[{ color: theme.textInverse, fontSize: 32 }]}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold', marginBottom: 4 }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[themeStyles.textSecondary, { marginBottom: 8 }]}>
            {user?.phone}
          </Text>
          <View style={[
            { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
            { backgroundColor: theme.primaryLight }
          ]}>
            <Text style={[
              { fontSize: 14, fontWeight: '500' },
              { color: theme.primaryDark }
            ]}>
              {user?.role || 'Manager'}
            </Text>
          </View>
        </View>
      </View>

      {/* Theme Toggle */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
          Appearance
        </Text>
        <View style={[themeStyles.card, { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[
              { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
              { backgroundColor: theme.secondary }
            ]}>
              <Icon name={isDark ? 'moon-o' : 'sun-o'} size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                Dark Mode
              </Text>
              <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
                {themeMode === 'system' ? 'Follow system' : isDark ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={isDark ? theme.primaryLight : theme.surface}
          />
        </View>
      </View>

      {/* Menu Items */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
          Account
        </Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={[themeStyles.card, { padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }]}
            activeOpacity={0.7}
          >
            <View style={[
              { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
              item.color === 'bg-blue-500' && { backgroundColor: theme.primary },
              item.color === 'bg-gray-500' && { backgroundColor: theme.textTertiary },
              item.color === 'bg-purple-500' && { backgroundColor: theme.secondary },
            ]}>
              {item.iconType === 'FontAwesome' ? (
                <Icon name={item.icon} size={20} color="white" />
              ) : (
                <MaterialIcon name={item.icon} size={20} color="white" />
              )}
            </View>
            <Text style={[themeStyles.text, { flex: 1, fontSize: 16, fontWeight: '500' }]}>
              {item.title}
            </Text>
            <Text style={[themeStyles.textTertiary, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <TouchableOpacity
          style={[
            { borderRadius: 12, paddingVertical: 16, opacity: isLoading ? 0.5 : 1 },
            { backgroundColor: theme.buttonDanger }
          ]}
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={[
            { fontSize: 16, fontWeight: '600', textAlign: 'center' },
            { color: theme.buttonDangerText }
          ]}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};
