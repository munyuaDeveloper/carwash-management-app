import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CarBookingModal } from '../components/CarBookingModal';
import { CarpetBookingModal } from '../components/CarpetBookingModal';
import { BookingFormData, CarpetBookingFormData, ApiBooking } from '../types/booking';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBookings, setFilters, clearError } from '../store/slices/bookingSlice';

export const BookingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bookings, isLoading, error } = useAppSelector((state) => state.bookings);
  const { token } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'car' | 'carpet'>('car');
  const [showCarModal, setShowCarModal] = useState(false);
  const [showCarpetModal, setShowCarpetModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today'>('today');

  // Fetch bookings on component mount and when filters change
  useEffect(() => {
    if (token) {
      const filters: any = {
        sort: '-createdAt',
        limit: 50,
      };

      // Add category filter based on active tab
      if (activeTab === 'car') {
        filters.category = 'vehicle';
      } else {
        filters.category = 'carpet';
      }

      // For today filter, we'll get all bookings and filter client-side
      // You could also implement server-side date filtering

      dispatch(fetchBookings(filters));
    }
  }, [dispatch, token, activeTab, activeFilter]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, dispatch]);

  // Filter bookings based on active tab and filter
  const getFilteredBookings = (): ApiBooking[] => {
    let filteredBookings = bookings;

    // Filter by category (vehicle vs carpet)
    if (activeTab === 'car') {
      filteredBookings = filteredBookings.filter(booking => booking.category === 'vehicle');
    } else {
      filteredBookings = filteredBookings.filter(booking => booking.category === 'carpet');
    }

    // Apply date filter
    if (activeFilter === 'today') {
      // Filter for today's bookings (client-side filtering)
      const today = new Date().toISOString().split('T')[0];
      filteredBookings = filteredBookings.filter(booking =>
        booking.createdAt.startsWith(today)
      );
    }

    return filteredBookings;
  };

  // Helper function to format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const dateTime = `${dateStr} at ${time}`;
    return { time, date: dateStr, dateTime };
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handleCarBookingSubmit = (bookingData: BookingFormData) => {
    console.log('Car booking submitted:', bookingData);
  };

  const handleCarpetBookingSubmit = (bookingData: CarpetBookingFormData) => {
    console.log('Carpet booking submitted:', bookingData);
  };

  const renderBookingsList = () => {
    const filteredBookings = getFilteredBookings();

    if (isLoading) {
      return (
        <View className="px-6 py-8">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-center text-gray-600 mt-4">Loading bookings...</Text>
        </View>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <View className="px-6 py-8">
          <Text className="text-center text-gray-500 text-lg">
            No {activeTab === 'car' ? 'car wash' : 'carpet cleaning'} bookings found
          </Text>
          <Text className="text-center text-gray-400 mt-2">
            Try adjusting your filters or add a new booking
          </Text>
        </View>
      );
    }

    return (
      <View className="px-6">
        {filteredBookings.map((booking) => {
          const { time, date, dateTime } = formatDateTime(booking.createdAt);
          const statusColor = getStatusColor(booking.status);

          return (
            <Pressable
              key={booking._id}
              onPress={() => console.log('Pressed booking', booking._id)}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1 },
              ]}
              className="bg-white rounded-xl p-4 mb-4 shadow-lg"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View>
                    {activeTab === 'car' ? (
                      <>
                        <Text className="text-sm text-gray-500">{booking.carRegistrationNumber}</Text>
                        <Text className="text-sm text-gray-600 my-2">Attendant: {booking.attendant.name}</Text>
                        <Text className="text-xs text-gray-400">{dateTime}</Text>
                      </>
                    ) : (
                      <>
                        <Text className="font-semibold text-gray-900">Attendant: {booking.attendant.name}</Text>
                        {booking.phoneNumber && (
                          <Text className="text-sm text-gray-600 my-2">Customer Phone: {booking.phoneNumber}</Text>
                        )}
                        <Text className="text-xs text-gray-400">{dateTime}</Text>
                      </>
                    )}
                  </View>
                </View>
                <View className={`px-3 py-1 rounded-full ${statusColor}`}>
                  <Text className="text-xs font-medium capitalize">{booking.status}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-2">
                <View>
                  {activeTab === 'car' ? (
                    <Text className="text-sm text-gray-600">{booking.serviceType || 'Car Wash'}</Text>
                  ) : (
                    <Text className="text-sm text-gray-600">Carpet Cleaning</Text>
                  )}
                </View>
                <Text className="text-lg font-bold text-gray-900">KSh {booking.amount}</Text>
              </View>


              {activeTab === 'carpet' && booking.color && (
                <View className="border-t border-gray-100 pt-2 mt-2">
                  <Text className="text-xs text-gray-500">Carpet Color: {booking.color}</Text>
                </View>
              )}

              {activeTab === 'car' && booking.vehicleType && (
                <View className="border-t border-gray-100 pt-2 mt-2">
                  <Text className="text-xs text-gray-500">Vehicle: {booking.vehicleType}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8 pt-16">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {activeTab === 'car' ? 'Car Wash' : 'Carpet Cleaning'} Bookings
        </Text>
        <Text className="text-gray-600">
          Manage your {activeTab === 'car' ? 'car wash' : 'carpet cleaning'} appointments
        </Text>
      </View>

      {/* Service Type Tabs */}
      <View className="px-6 py-4">
        <View className="flex-row bg-blue-500 rounded-lg p-1">
          <Pressable
            onPress={() => setActiveTab('car')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 rounded-md ${activeTab === 'car' ? 'bg-white' : ''}`}
          >
            <View className="flex-row items-center justify-center">
              <Icon name="car" size={16} color={activeTab === 'car' ? '#1F2937' : 'white'} style={{ marginRight: 6 }} />
              <Text className={`text-center font-medium ${activeTab === 'car' ? 'text-gray-900' : 'text-white'}`}>
                Car Services
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('carpet')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 rounded-md ${activeTab === 'carpet' ? 'bg-white' : ''}`}
          >
            <View className="flex-row items-center justify-center">
              <Icon name="magic" size={16} color={activeTab === 'carpet' ? '#1F2937' : 'white'} style={{ marginRight: 6 }} />
              <Text className={`text-center font-medium ${activeTab === 'carpet' ? 'text-gray-900' : 'text-white'}`}>
                Carpet Services
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-6 py-2">
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          {(['today', 'all'] as const).map((filterKey) => (
            <Pressable
              key={filterKey}
              onPress={() => setActiveFilter(filterKey)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className={`flex-1 py-2 rounded-md ${activeFilter === filterKey ? 'bg-white' : ''}`}
            >
              <Text
                className={`text-center text-sm font-medium ${activeFilter === filterKey ? 'text-gray-900' : 'text-gray-600'
                  }`}
              >
                {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <View className="mb-6">
        <View className="px-6 py-2">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'car' ? 'Car Wash' : 'Carpet Cleaning'} Bookings
          </Text>
        </View>
        {renderBookingsList()}
      </View>

      {/* Add New Booking Button */}
      <View className="px-6 py-4">
        <Pressable
          onPress={() => (activeTab === 'car' ? setShowCarModal(true) : setShowCarpetModal(true))}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="bg-blue-500 rounded-xl py-4"
        >
          <Text className="text-white font-semibold text-center">
            Add New {activeTab === 'car' ? 'Car' : 'Carpet'} Booking
          </Text>
        </Pressable>
      </View>

      <View className="h-8" />

      {/* Modals */}
      <CarBookingModal
        visible={showCarModal}
        onClose={() => setShowCarModal(false)}
        onBookingCreated={() => {
          setShowCarModal(false);
          // Refresh bookings list here if needed
        }}
      />

      <CarpetBookingModal
        visible={showCarpetModal}
        onClose={() => setShowCarpetModal(false)}
        onBookingCreated={() => {
          setShowCarpetModal(false);
          // Refresh bookings list here if needed
        }}
      />
    </ScrollView>
  );
};
