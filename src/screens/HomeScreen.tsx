import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { CarBookingModal } from '../components/CarBookingModal';
import { CarpetBookingModal } from '../components/CarpetBookingModal';
import { BookingFormData, CarpetBookingFormData } from '../types/booking';

export const HomeScreen: React.FC = () => {
  const { user } = useAppSelector((state: any) => state.auth);
  const [isBookingSheetVisible, setIsBookingSheetVisible] = useState(false);
  const [isCarpetBookingSheetVisible, setIsCarpetBookingSheetVisible] = useState(false);

  const handleCarServicesPress = () => {
    setIsBookingSheetVisible(true);
  };

  const handleCarpetServicesPress = () => {
    setIsCarpetBookingSheetVisible(true);
  };

  const handleBookingSubmit = (bookingData: BookingFormData) => {
    // Create a complete booking object with generated ID and timestamps
    const newBooking = {
      ...bookingData,
      id: Date.now().toString(),
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('New car booking created:', newBooking);
    // TODO: Dispatch to Redux store when booking slice is implemented
    // dispatch(addBooking(newBooking));
  };

  const handleCarpetBookingSubmit = (bookingData: CarpetBookingFormData) => {
    // Create a complete carpet booking object with generated ID and timestamps
    const newCarpetBooking = {
      ...bookingData,
      id: Date.now().toString(),
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('New carpet booking created:', newCarpetBooking);
    // TODO: Dispatch to Redux store when carpet booking slice is implemented
    // dispatch(addCarpetBooking(newCarpetBooking));
  };

  const quickActions = [
    { title: 'Car Services', icon: '🚗', color: 'bg-blue-500' },
    { title: 'Carpet Services', icon: '🧹', color: 'bg-green-500' },
  ];

  const stats = [
    { label: 'Today\'s Bookings', value: '12', color: 'text-blue-600' },
    { label: 'Revenue Today', value: 'KSh 500', color: 'text-green-600' },
    { label: 'Active Customers', value: '10', color: 'text-purple-600' },
    { label: 'Pending Tasks', value: '3', color: 'text-orange-600' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'Manager'}!
        </Text>
        <Text className="text-gray-600">
          Here's what's happening at your car wash today
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</Text>
        <View className="flex-row flex-wrap -mx-2">
          {stats.map((stat) => (
            <View key={stat.label} className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <Text className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap -mx-2">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              className="w-1/2 px-2 mb-4"
              activeOpacity={0.7}
              onPress={action.title === 'Car Services' ? handleCarServicesPress : handleCarpetServicesPress}
            >
              <View className="bg-white rounded-xl p-6 shadow-sm">
                <View className={`w-12 h-12 ${action.color} rounded-full items-center justify-center mb-3 mx-auto`}>
                  <Text className="text-2xl">{action.icon}</Text>
                </View>
                <Text className="text-sm font-medium text-gray-900 text-center">
                  {action.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom spacing */}
      <View className="h-8" />

      {/* Booking Bottom Sheets */}
      <CarBookingModal
        visible={isBookingSheetVisible}
        onClose={() => setIsBookingSheetVisible(false)}
        onSubmit={handleBookingSubmit}
      />

      <CarpetBookingModal
        visible={isCarpetBookingSheetVisible}
        onClose={() => setIsCarpetBookingSheetVisible(false)}
        onSubmit={handleCarpetBookingSubmit}
      />
    </ScrollView>
  );
};
