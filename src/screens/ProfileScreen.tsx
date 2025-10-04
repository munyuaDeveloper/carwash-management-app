import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../store/hooks';

export const ProfileScreen: React.FC = () => {
  const { user } = useAppSelector((state: any) => state.auth);

  const menuItems = [
    { title: 'Edit Profile', icon: '👤', color: 'bg-blue-500' },
    { title: 'Settings', icon: '⚙️', color: 'bg-gray-500' },
    { title: 'Notifications', icon: '🔔', color: 'bg-yellow-500' },
    { title: 'Help & Support', icon: '❓', color: 'bg-green-500' },
    { title: 'About', icon: 'ℹ️', color: 'bg-purple-500' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8 pt-12">
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

      {/* Stats */}
      <View className="px-6 py-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">156</Text>
              <Text className="text-sm text-gray-600">Total Customers</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">1,234</Text>
              <Text className="text-sm text-gray-600">Bookings</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">$12.5K</Text>
              <Text className="text-sm text-gray-600">Revenue</Text>
            </View>
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
              <Text className="text-lg">{item.icon}</Text>
            </View>
            <Text className="flex-1 text-gray-900 font-medium">{item.title}</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View className="px-6 py-4">
        <TouchableOpacity
          className="bg-red-500 rounded-xl py-4"
          activeOpacity={0.8}
          onPress={() => {}}
        >
          <Text className="text-white font-semibold text-center">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
};
