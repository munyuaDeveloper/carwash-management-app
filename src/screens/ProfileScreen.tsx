import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export const ProfileScreen: React.FC = () => {
  const { user, isLoading } = useAppSelector((state: any) => state.auth);
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
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8 pt-16">
        <View className="items-center">
          <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4">
            <Text className="text-3xl text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">
            {user?.name || 'User'}
          </Text>
          <Text className="text-gray-600 mb-2">
            {user?.phone}
          </Text>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-800 text-sm font-medium">
              {user?.role || 'Manager'}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Account</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
            activeOpacity={0.7}
          >
            <View className={`w-10 h-10 ${item.color} rounded-full items-center justify-center mr-4`}>
              {item.iconType === 'FontAwesome' ? (
                <Icon name={item.icon} size={20} color="white" />
              ) : (
                <MaterialIcon name={item.icon} size={20} color="white" />
              )}
            </View>
            <Text className="flex-1 text-gray-900 font-medium">{item.title}</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View className="px-6 py-4">
        <TouchableOpacity
          className={`bg-red-500 rounded-xl py-4 ${isLoading ? 'opacity-50' : ''}`}
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-center">
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
};
