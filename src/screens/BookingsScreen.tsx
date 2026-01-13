import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { CarBookingModal } from '../components/CarBookingModal';
import { CarpetBookingModal } from '../components/CarpetBookingModal';
import { EditBookingModal } from '../components/EditBookingModal';
import { RoundedButton } from '../components/RoundedButton';
import { BookingFormData, CarpetBookingFormData, ApiBooking } from '../types/booking';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBookings, setFilters, clearError } from '../store/slices/bookingSlice';
import { fetchAttendants } from '../store/slices/attendantSlice';
import { showToast } from '../utils/toast';
import { useOffline } from '../hooks/useOffline';

// Conditionally import react-icons only for web
let SiCcleaner: any = null;
if (Platform.OS === 'web') {
  try {
    const ReactIcons = require('react-icons/si');
    SiCcleaner = ReactIcons.SiCcleaner;
  } catch (e) {
    console.warn('react-icons not available');
  }
}

export const BookingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    bookings,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    currentPage,
    totalResults,
  } = useAppSelector((state) => state.bookings);
  const { token, user } = useAppSelector((state) => state.auth);
  const { attendants, isLoading: attendantsLoading } = useAppSelector((state) => state.attendants);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();
  const isAttendant = user?.role === 'attendant';
  const { sync, unsyncedCount } = useOffline();

  const [activeTab, setActiveTab] = useState<'car' | 'carpet'>('car');
  const [showCarModal, setShowCarModal] = useState(false);
  const [showCarpetModal, setShowCarpetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttendantId, setSelectedAttendantId] = useState<string>('all');
  const [showAttendantDropdown, setShowAttendantDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const BOOKINGS_PAGE_LIMIT = 10;

  const getBaseFilters = (): any => ({
    sort: '-createdAt',
    limit: BOOKINGS_PAGE_LIMIT,
  });

  const getTodayDateRange = () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      gte: startOfDay.toISOString(),
      lte: endOfDay.toISOString(),
    };
  };

  // Fetch attendants on component mount
  useEffect(() => {
    if (token && attendants.length === 0) {
      dispatch(fetchAttendants(token));
    }
  }, [dispatch, token, attendants.length]);

  // Fetch bookings when filters change (with debounced search)
  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      const filters: any = {
        ...getBaseFilters(),
        page: 1,
      };

      // Add category filter based on active tab
      if (activeTab === 'car') {
        filters.category = 'vehicle';
      } else {
        filters.category = 'carpet';
      }

      // Apply server-side date filter for today's bookings
      if (activeFilter === 'today') {
        filters.createdAt = getTodayDateRange();
      }

      // For attendants, always filter by their own ID
      if (isAttendant && user?._id) {
        filters.attendant = user._id;
      } else if (selectedAttendantId !== 'all') {
        // For admins, use selected attendant filter
        filters.attendant = selectedAttendantId;
      }

      // Add search query
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      dispatch(fetchBookings(filters));
    }, searchQuery.trim() ? 500 : 0); // 500ms debounce for search, immediate for other filters

    return () => clearTimeout(timeoutId);
  }, [dispatch, token, activeTab, activeFilter, selectedAttendantId, searchQuery, isAttendant, user?._id]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      showToast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // No client-side filtering needed - API handles all filtering
  const getFilteredBookings = (): ApiBooking[] => {
    return bookings;
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


  const handleEditBooking = (booking: ApiBooking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleBookingUpdated = () => {
    // Refresh bookings list with current filters
    if (token) {
      const filters: any = {
        ...getBaseFilters(),
        page: 1,
      };

      if (activeTab === 'car') {
        filters.category = 'vehicle';
      } else {
        filters.category = 'carpet';
      }

      if (activeFilter === 'today') {
        filters.createdAt = getTodayDateRange();
      }

      // For attendants, always filter by their own ID
      if (isAttendant && user?._id) {
        filters.attendant = user._id;
      } else if (selectedAttendantId !== 'all') {
        filters.attendant = selectedAttendantId;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      dispatch(fetchBookings(filters));
    }
  };

  const handleRefresh = async () => {
    if (!token) return;

    // Only sync if there's data to sync
    const totalUnsynced = unsyncedCount.bookings + unsyncedCount.wallets + unsyncedCount.attendants + unsyncedCount.queue;

    // Only show refreshing spinner if there's data to sync
    if (totalUnsynced > 0) {
      setRefreshing(true);

      try {
        // Sync data when pulling to refresh
        await sync().catch(() => {
          // Silently fail - sync errors are handled internally
        });
      } finally {
        setRefreshing(false);
      }
    }

    // Always refresh the bookings list
    setRefreshing(true);
    try {
      const filters: any = {
        ...getBaseFilters(),
        page: 1,
      };

      if (activeTab === 'car') {
        filters.category = 'vehicle';
      } else {
        filters.category = 'carpet';
      }

      if (activeFilter === 'today') {
        filters.createdAt = getTodayDateRange();
      }

      // For attendants, always filter by their own ID
      if (isAttendant && user?._id) {
        filters.attendant = user._id;
      } else if (selectedAttendantId !== 'all') {
        filters.attendant = selectedAttendantId;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      await dispatch(fetchBookings(filters));
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!token || !hasMore || isLoadingMore) {
      return;
    }

    const nextPage = currentPage + 1;
    const filters: any = {
      ...getBaseFilters(),
      page: nextPage,
    };

    if (activeTab === 'car') {
      filters.category = 'vehicle';
    } else {
      filters.category = 'carpet';
    }

    if (activeFilter === 'today') {
      filters.createdAt = getTodayDateRange();
    }

    if (selectedAttendantId !== 'all') {
      filters.attendant = selectedAttendantId;
    }

    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    dispatch(fetchBookings(filters));
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
        <View style={{ paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' }}>
          <Text style={[themeStyles.textTertiary, { textAlign: 'center', fontSize: 18 }]}>
            No {activeTab === 'car' ? 'car wash' : 'carpet cleaning'} bookings found
          </Text>
          <Text style={[themeStyles.textTertiary, { textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>
            {isAttendant ? 'No bookings found' : 'Try adjusting your filters or add a new booking'}
          </Text>
          {!isAttendant && (
            <RoundedButton
              title={`Add New ${activeTab === 'car' ? 'Car' : 'Carpet'} Booking`}
              onPress={() => (activeTab === 'car' ? setShowCarModal(true) : setShowCarpetModal(true))}
              variant="submit"
              style={{ alignSelf: 'center' }}
            />
          )}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ flex: 1 }}>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {!isAttendant && (
                        <TouchableOpacity
                          onPress={() => handleEditBooking(booking)}
                          style={{
                            padding: 8,
                            marginRight: 8,
                            backgroundColor: theme.surface,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: theme.border,
                          }}
                        >
                          <MaterialIcon name="edit" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      )}
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

        {hasMore && (
          <View style={{ marginTop: 16, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={isLoadingMore}
              activeOpacity={0.8}
              style={[
                {
                  borderRadius: 999,
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  backgroundColor: theme.buttonPrimary,
                  flexDirection: 'row',
                },
                isLoadingMore && { opacity: 0.7 },
              ]}
            >
              {isLoadingMore && (
                <ActivityIndicator
                  size="small"
                  color={theme.buttonPrimaryText}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={[
                  { fontSize: 14, fontWeight: '600' },
                  { color: theme.buttonPrimaryText },
                ]}
              >
                {isLoadingMore ? 'Loading more...' : 'Load more bookings'}
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                themeStyles.textTertiary,
                {
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 8,
                },
              ]}
            >
              Showing {filteredBookings.length} of {totalResults} bookings
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[themeStyles.container, { flex: 1 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
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
          { flexDirection: 'row', backgroundColor: theme.surfaceSecondary, borderRadius: 12, padding: 4 }
        ]}>
          <TouchableOpacity
            onPress={() => setActiveTab('car')}
            activeOpacity={0.7}
            style={[
              {
                flex: 1,
                height: 35,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 2,
                overflow: 'hidden'
              }
            ]}
          >
            {activeTab === 'car' ? (
              <LinearGradient
                colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon
                    name="car"
                    size={16}
                    color="#ffffff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    { textAlign: 'center', fontWeight: '500', color: '#ffffff' }
                  ]}>
                    Car Services
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Icon
                  name="car"
                  size={16}
                  color={theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  { textAlign: 'center', fontWeight: '500' },
                  { color: theme.textSecondary }
                ]}>
                  Car Services
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('carpet')}
            activeOpacity={0.7}
            style={[
              {
                flex: 1,
                height: 35,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 2,
                overflow: 'hidden'
              }
            ]}
          >
            {activeTab === 'carpet' ? (
              <LinearGradient
                colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  {Platform.OS === 'web' && SiCcleaner ? (
                    <SiCcleaner
                      size={16}
                      color="#ffffff"
                      style={{ marginRight: 6 }}
                    />
                  ) : (
                    <MaterialIcon
                      name="cleaning-services"
                      size={16}
                      color="#ffffff"
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text style={[
                    { textAlign: 'center', fontWeight: '500', color: '#ffffff' }
                  ]}>
                    Carpet Services
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {Platform.OS === 'web' && SiCcleaner ? (
                  <SiCcleaner
                    size={16}
                    color={theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <MaterialIcon
                    name="cleaning-services"
                    size={16}
                    color={theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={[
                  { textAlign: 'center', fontWeight: '500' },
                  { color: theme.textSecondary }
                ]}>
                  Carpet Services
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
        <View style={[
          { flexDirection: 'row', backgroundColor: theme.surfaceSecondary, borderRadius: 12, padding: 4 }
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
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginHorizontal: 2,
                  overflow: 'hidden'
                }
              ]}
            >
              {activeFilter === filterKey ? (
                <LinearGradient
                  colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={[
                    { textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#ffffff' }
                  ]}>
                    {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={[
                    { textAlign: 'center', fontSize: 14, fontWeight: '500' },
                    { color: theme.textSecondary }
                  ]}>
                    {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search and Attendant Filter - Only show for admins */}
      {!isAttendant && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          {/* Search Input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surfaceSecondary,
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <Icon name="search" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[
                { flex: 1, paddingVertical: 10, fontSize: 16 },
                themeStyles.text
              ]}
              placeholder="Search by attendant name..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={{ padding: 4 }}
              >
                <Icon name="times-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Attendant Filter Dropdown */}
          <View style={{ position: 'relative' }}>
            <Pressable
              onPress={() => {
                if (!attendantsLoading) {
                  setShowAttendantDropdown(!showAttendantDropdown);
                }
              }}
              style={[
                {
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: theme.border,
                },
                { backgroundColor: attendantsLoading ? theme.surfaceTertiary : theme.surfaceSecondary }
              ]}
              disabled={attendantsLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name="user" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[themeStyles.text, { fontSize: 16 }]}>
                  {attendantsLoading
                    ? 'Loading...'
                    : selectedAttendantId === 'all'
                      ? 'All Attendants'
                      : attendants.find(a => a._id === selectedAttendantId)?.name || 'All Attendants'
                  }
                </Text>
              </View>
              <Icon
                name={showAttendantDropdown ? "chevron-up" : "chevron-down"}
                size={14}
                color={theme.textSecondary}
              />
            </Pressable>

            {/* Dropdown Options */}
            {showAttendantDropdown && !attendantsLoading && (
              <View style={[
                {
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 200,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                }
              ]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  <Pressable
                    onPress={() => {
                      setSelectedAttendantId('all');
                      setShowAttendantDropdown(false);
                    }}
                    style={[
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderLight,
                        borderRadius: 8,
                        marginHorizontal: 4,
                        marginVertical: 2,
                        overflow: 'hidden',
                      }
                    ]}
                  >
                    {selectedAttendantId === 'all' ? (
                      <LinearGradient
                        colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                      />
                    ) : null}
                    <Text style={[
                      { fontSize: 16 },
                      selectedAttendantId === 'all' ? { color: '#ffffff', fontWeight: '500' } : { color: theme.text }
                    ]}>
                      All Attendants
                    </Text>
                  </Pressable>
                  {attendants.map((attendant) => (
                    <Pressable
                      key={attendant._id}
                      onPress={() => {
                        setSelectedAttendantId(attendant._id);
                        setShowAttendantDropdown(false);
                      }}
                      style={[
                        {
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderLight,
                          borderRadius: 8,
                          marginHorizontal: 4,
                          marginVertical: 2,
                          overflow: 'hidden',
                        }
                      ]}
                    >
                      {selectedAttendantId === attendant._id ? (
                        <LinearGradient
                          colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                      ) : null}
                      <Text style={[
                        { fontSize: 16 },
                        selectedAttendantId === attendant._id ? { color: '#ffffff', fontWeight: '500' } : { color: theme.text }
                      ]}>
                        {attendant.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Bookings List */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 8 }]}>
            {activeTab === 'car' ? 'Car Wash' : 'Carpet Cleaning'} Bookings
            {(searchQuery.trim() || selectedAttendantId !== 'all') && (
              <Text style={[themeStyles.textSecondary, { fontSize: 14, fontWeight: '400' }]}>
                {' '}({totalResults} {totalResults === 1 ? 'result' : 'results'})
              </Text>
            )}
          </Text>
        </View>
        {renderBookingsList()}
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

      <EditBookingModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onBookingUpdated={handleBookingUpdated}
      />

      {/* Overlay to close dropdown when clicking outside */}
      {showAttendantDropdown && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
          }}
          onPress={() => setShowAttendantDropdown(false)}
        />
      )}
    </ScrollView>
  );
};
