import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { CarBookingModal } from '../components/CarBookingModal';
import { CarpetBookingModal } from '../components/CarpetBookingModal';
import { BookingFormData, CarpetBookingFormData } from '../types/booking';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export const HomeScreen: React.FC = () => {
  const { user } = useAppSelector((state: any) => state.auth);
  const { isDark } = useTheme();
  const themeStyles = useThemeStyles();
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
    { title: 'Car Services', icon: 'car', iconType: 'FontAwesome', color: 'bg-blue-500' },
    { title: 'Carpet Services', icon: 'magic', iconType: 'FontAwesome', color: 'bg-green-500' },
  ];

  const stats = [
    { label: 'Today\'s Bookings', value: '12', color: 'text-blue-600' },
    { label: 'Revenue Today', value: 'KSh 500', color: 'text-green-600' },
    { label: 'Active Customers', value: '10', color: 'text-purple-600' },
    { label: 'Pending Tasks', value: '3', color: 'text-orange-600' },
  ];

  return (
    <ScrollView style={[themeStyles.container, { flex: 1 }]}>
      {/* Header */}
      <View style={[themeStyles.surface, { paddingHorizontal: 24, paddingVertical: 32, paddingTop: 64 }]}>
        <Text style={[themeStyles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 8 }]}>
          Welcome back, {user?.name || 'Manager'}!
        </Text>
        <Text style={[themeStyles.textSecondary, { fontSize: 16 }]}>
          Here's what's happening at your car wash today
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
          Today's Overview
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
          {stats.map((stat) => (
            <View key={stat.label} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
              <View style={[themeStyles.card, { padding: 16 }]}>
                <Text style={[
                  { fontSize: 24, fontWeight: 'bold' },
                  stat.color === 'text-blue-600' && { color: isDark ? '#60a5fa' : '#2563eb' },
                  stat.color === 'text-green-600' && { color: isDark ? '#34d399' : '#059669' },
                  stat.color === 'text-purple-600' && { color: isDark ? '#a78bfa' : '#7c3aed' },
                  stat.color === 'text-orange-600' && { color: isDark ? '#fb923c' : '#ea580c' },
                ]}>
                  {stat.value}
                </Text>
                <Text style={[themeStyles.textSecondary, { fontSize: 14, marginTop: 4 }]}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}
              activeOpacity={0.7}
              onPress={action.title === 'Car Services' ? handleCarServicesPress : handleCarpetServicesPress}
            >
              <View style={[themeStyles.card, { padding: 24 }]}>
                <View style={[
                  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12, alignSelf: 'center' },
                  action.color === 'bg-blue-500' && { backgroundColor: isDark ? '#3b82f6' : '#2563eb' },
                  action.color === 'bg-green-500' && { backgroundColor: isDark ? '#10b981' : '#059669' },
                ]}>
                  {action.iconType === 'FontAwesome' ? (
                    <Icon name={action.icon} size={24} color="white" />
                  ) : (
                    <MaterialIcon name={action.icon} size={24} color="white" />
                  )}
                </View>
                <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', textAlign: 'center' }]}>
                  {action.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 32 }} />

      {/* Booking Bottom Sheets */}
      <CarBookingModal
        visible={isBookingSheetVisible}
        onClose={() => setIsBookingSheetVisible(false)}
        onBookingCreated={() => {
          handleBookingSubmit({} as BookingFormData); // Call your handler
        }}
      />

      <CarpetBookingModal
        visible={isCarpetBookingSheetVisible}
        onClose={() => setIsCarpetBookingSheetVisible(false)}
        onBookingCreated={() => {
          handleCarpetBookingSubmit({} as CarpetBookingFormData); // Call your handler
        }}
      />
    </ScrollView>
  );
};
