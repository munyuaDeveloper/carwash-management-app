import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
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
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();

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
        <View style={{ paddingHorizontal: 24, paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[themeStyles.textSecondary, { textAlign: 'center', marginTop: 16 }]}>
            Loading bookings...
          </Text>
        </View>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <View style={{ paddingHorizontal: 24, paddingVertical: 32 }}>
          <Text style={[themeStyles.textTertiary, { textAlign: 'center', fontSize: 18 }]}>
            No {activeTab === 'car' ? 'car wash' : 'carpet cleaning'} bookings found
          </Text>
          <Text style={[themeStyles.textTertiary, { textAlign: 'center', marginTop: 8 }]}>
            Try adjusting your filters or add a new booking
          </Text>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 24 }}>
        {filteredBookings.map((booking, index) => {
          const { time, date, dateTime } = formatDateTime(booking.createdAt);
          const statusColor = getStatusColor(booking.status);

          return (
            <View key={booking._id}>
              <Pressable
                onPress={() => console.log('Pressed booking', booking._id)}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <View style={{
                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View>
                        {activeTab === 'car' ? (
                          <>
                            <Text style={[themeStyles.textTertiary, { fontSize: 14 }]}>
                              {booking.carRegistrationNumber}
                            </Text>
                            <Text style={[themeStyles.textSecondary, { fontSize: 14, marginVertical: 8 }]}>
                              Attendant: {booking.attendant.name}
                            </Text>
                            <Text style={[themeStyles.textTertiary, { fontSize: 12 }]}>
                              {dateTime}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '600' }]}>
                              Attendant: {booking.attendant.name}
                            </Text>
                            {booking.phoneNumber && (
                              <Text style={[themeStyles.textSecondary, { fontSize: 14, marginVertical: 8 }]}>
                                Customer Phone: {booking.phoneNumber}
                              </Text>
                            )}
                            <Text style={[themeStyles.textTertiary, { fontSize: 12 }]}>
                              {dateTime}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={[
                      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
                      statusColor === 'bg-blue-100 text-blue-800' && { backgroundColor: theme.infoLight },
                      statusColor === 'bg-green-100 text-green-800' && { backgroundColor: theme.successLight },
                      statusColor === 'bg-yellow-100 text-yellow-800' && { backgroundColor: theme.warningLight },
                      statusColor === 'bg-red-100 text-red-800' && { backgroundColor: theme.errorLight },
                    ]}>
                      <Text style={[
                        { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
                        statusColor === 'bg-blue-100 text-blue-800' && { color: theme.info },
                        statusColor === 'bg-green-100 text-green-800' && { color: theme.success },
                        statusColor === 'bg-yellow-100 text-yellow-800' && { color: theme.warning },
                        statusColor === 'bg-red-100 text-red-800' && { color: theme.error },
                      ]}>
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View>
                      {activeTab === 'car' ? (
                        <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
                          {booking.serviceType || 'Car Wash'}
                        </Text>
                      ) : (
                        <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
                          Carpet Cleaning
                        </Text>
                      )}
                    </View>
                    <Text style={[themeStyles.text, { fontSize: 18, fontWeight: 'bold' }]}>
                      KSh {booking.amount}
                    </Text>
                  </View>

                  {activeTab === 'carpet' && booking.color && (
                    <View style={[
                      { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, marginTop: 8 }
                    ]}>
                      <Text style={[themeStyles.textTertiary, { fontSize: 12 }]}>
                        Carpet Color: {booking.color}
                      </Text>
                    </View>
                  )}

                  {activeTab === 'car' && booking.vehicleType && (
                    <View style={[
                      { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, marginTop: 8 }
                    ]}>
                      <Text style={[themeStyles.textTertiary, { fontSize: 12 }]}>
                        Vehicle: {booking.vehicleType}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
              {index < filteredBookings.length - 1 && (
                <View style={{ height: 20 }} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={[themeStyles.container, { flex: 1 }]}>
      {/* Header */}
      <View style={[themeStyles.surface, { paddingHorizontal: 24, paddingVertical: 32, paddingTop: 64 }]}>
        <Text style={[themeStyles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 8 }]}>
          {activeTab === 'car' ? 'Car Wash' : 'Carpet Cleaning'} Bookings
        </Text>
        <Text style={[themeStyles.textSecondary, { fontSize: 16 }]}>
          Manage your {activeTab === 'car' ? 'car wash' : 'carpet cleaning'} appointments
        </Text>
      </View>

      {/* Service Type Tabs */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={[
          { flexDirection: 'row', backgroundColor: theme.primary, borderRadius: 8, padding: 4 }
        ]}>
          <TouchableOpacity
            onPress={() => setActiveTab('car')}
            activeOpacity={0.7}
            style={[
              {
                flex: 1,
                height: 35,
                borderRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 2
              },
              activeTab === 'car' && { backgroundColor: theme.surface }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Icon
                name="car"
                size={16}
                color={activeTab === 'car' ? theme.text : theme.textInverse}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                { textAlign: 'center', fontWeight: '500' },
                { color: activeTab === 'car' ? theme.text : theme.textInverse }
              ]}>
                Car Services
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('carpet')}
            activeOpacity={0.7}
            style={[
              {
                flex: 1,
                height: 35,
                borderRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 2
              },
              activeTab === 'carpet' && { backgroundColor: theme.surface }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Icon
                name="magic"
                size={16}
                color={activeTab === 'carpet' ? theme.text : theme.textInverse}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                { textAlign: 'center', fontWeight: '500' },
                { color: activeTab === 'carpet' ? theme.text : theme.textInverse }
              ]}>
                Carpet Services
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
        <View style={[
          { flexDirection: 'row', backgroundColor: theme.surfaceSecondary, borderRadius: 8, padding: 4 }
        ]}>
          {(['today', 'all'] as const).map((filterKey) => (
            <TouchableOpacity
              key={filterKey}
              onPress={() => setActiveFilter(filterKey)}
              activeOpacity={0.7}
              style={[
                {
                  flex: 1,
                  height: 35,
                  borderRadius: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginHorizontal: 2
                },
                activeFilter === filterKey && { backgroundColor: theme.surface }
              ]}
            >
              <Text style={[
                { textAlign: 'center', fontSize: 14, fontWeight: '500' },
                { color: activeFilter === filterKey ? theme.text : theme.textSecondary }
              ]}>
                {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 8 }]}>
            {activeTab === 'car' ? 'Car Wash' : 'Carpet Cleaning'} Bookings
          </Text>
        </View>
        {renderBookingsList()}
      </View>

      {/* Add New Booking Button */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <TouchableOpacity
          onPress={() => (activeTab === 'car' ? setShowCarModal(true) : setShowCarpetModal(true))}
          activeOpacity={0.8}
          style={[
            {
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 24,
              backgroundColor: theme.buttonPrimary,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            }
          ]}
        >
          <Text style={[
            { fontSize: 16, fontWeight: '600', textAlign: 'center' },
            { color: theme.buttonPrimaryText }
          ]}>
            Add New {activeTab === 'car' ? 'Car' : 'Carpet'} Booking
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />

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
