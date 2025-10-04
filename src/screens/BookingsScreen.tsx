import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { CarBookingModal } from '../components/CarBookingModal';
import { CarpetBookingModal } from '../components/CarpetBookingModal';
import { BookingFormData, CarpetBookingFormData } from '../types/booking';

export const BookingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'car' | 'carpet'>('car');
  const [showCarModal, setShowCarModal] = useState(false);
  const [showCarpetModal, setShowCarpetModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'in_progress' | 'completed'>('today');

  const carBookings = [
    {
      id: '1',
      customer: 'John Doe',
      service: 'Full Wash',
      time: '10:30 AM',
      date: 'Today',
      status: 'In Progress',
      price: 'KSh 250',
      color: 'bg-blue-500',
      carRegistration: 'KCA 123A',
    },
    {
      id: '2',
      customer: 'Jane Smith',
      service: 'Half Wash',
      time: '11:15 AM',
      date: 'Today',
      status: 'Completed',
      price: 'KSh 125',
      color: 'bg-green-500',
      carRegistration: 'KCB 456B',
    },
    {
      id: '3',
      customer: 'Mike Johnson',
      service: 'Premium Wash',
      time: '2:00 PM',
      date: 'Today',
      status: 'In Progress',
      price: 'KSh 500',
      color: 'bg-blue-500',
      carRegistration: 'KCC 789C',
    },
    {
      id: '4',
      customer: 'Alice Brown',
      service: 'Engine Wash',
      time: '3:30 PM',
      date: 'Today',
      status: 'Completed',
      price: 'KSh 200',
      color: 'bg-green-500',
      carRegistration: 'KCD 012D',
    },
  ];

  const carpetBookings = [
    {
      id: '1',
      customer: 'Sarah Wilson',
      time: '9:00 AM',
      date: 'Today',
      status: 'In Progress',
      price: 'KSh 500',
      color: 'bg-purple-500',
      carpetNumber: 'CP001',
      carpetColor: 'Red',
    },
    {
      id: '2',
      customer: 'David Brown',
      time: '1:30 PM',
      date: 'Today',
      status: 'Completed',
      price: 'KSh 300',
      color: 'bg-green-500',
      carpetNumber: 'CP002',
      carpetColor: 'Green',
    },
    {
      id: '3',
      customer: 'Emma Davis',
      time: '10:00 AM',
      date: 'Today',
      status: 'In Progress',
      price: 'KSh 800',
      color: 'bg-blue-500',
      carpetNumber: 'CP003',
      carpetColor: 'Red',
    },
    {
      id: '4',
      customer: 'Robert Lee',
      time: '4:00 PM',
      date: 'Today',
      status: 'Completed',
      price: 'KSh 400',
      color: 'bg-green-500',
      carpetNumber: 'CP004',
      carpetColor: 'Blue',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
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

  const filterBookings = (bookings: any[]) => {
    return bookings.filter((booking) => {
      switch (activeFilter) {
        case 'today':
          return booking.date === 'Today';
        case 'in_progress':
          return booking.status === 'In Progress';
        case 'completed':
          return booking.status === 'Completed';
        case 'all':
        default:
          return true;
      }
    });
  };

  const renderBookingsList = () => {
    const allBookings = activeTab === 'car' ? carBookings : carpetBookings;
    const filteredBookings = filterBookings(allBookings);

    return (
      <View className="px-6">
        {filteredBookings.map((booking) => (
          <Pressable
            key={booking.id}
            onPress={() => console.log('Pressed booking', booking.id)}
            style={({ pressed }) => [
              { opacity: pressed ? 0.8 : 1 },
            ]}
            className="bg-white rounded-xl p-4 mb-4 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className={`w-3 h-3 ${booking.color} rounded-full mr-3`} />
                <View>
                  {activeTab === 'car' ? (
                    <Text className="text-sm text-gray-500">{(booking as any).carRegistration}</Text>
                  ) : (
                    <>
                      <Text className="font-semibold text-gray-900">{booking.customer}</Text>
                      <Text className="text-sm text-gray-500">{booking.date}</Text>
                    </>
                  )}
                </View>
              </View>
              <View className={`px-3 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                <Text className="text-xs font-medium">{booking.status}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <View>
                {activeTab === 'car' ? (
                  <>
                    <Text className="text-sm text-gray-600">{(booking as any).service}</Text>
                    <Text className="text-sm text-gray-500">{booking.time}</Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-500">{booking.time}</Text>
                )}
              </View>
              <Text className="text-lg font-bold text-gray-900">{booking.price}</Text>
            </View>

            {activeTab === 'carpet' && (
              <View className="border-t border-gray-100 pt-2 mt-2">
                <Text className="text-xs text-gray-500">Carpet: {(booking as any).carpetColor}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8">
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
            <Text className={`text-center font-medium ${activeTab === 'car' ? 'text-gray-900' : 'text-white'}`}>
              🚗 Car Services
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('carpet')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className={`flex-1 py-3 rounded-md ${activeTab === 'carpet' ? 'bg-white' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'carpet' ? 'text-gray-900' : 'text-white'}`}>
              🧹 Carpet Services
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-6 py-2">
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          {(['today', 'in_progress', 'completed', 'all'] as const).map((filterKey) => (
            <Pressable
              key={filterKey}
              onPress={() => setActiveFilter(filterKey)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className={`flex-1 py-2 rounded-md ${activeFilter === filterKey ? 'bg-white' : ''}`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  activeFilter === filterKey ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {filterKey === 'in_progress'
                  ? 'In Progress'
                  : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
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
        onSubmit={handleCarBookingSubmit}
      />

      <CarpetBookingModal
        visible={showCarpetModal}
        onClose={() => setShowCarpetModal(false)}
        onSubmit={handleCarpetBookingSubmit}
      />
    </ScrollView>
  );
};
