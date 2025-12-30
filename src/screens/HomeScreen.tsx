import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { CarBookingModal } from '../components/CarBookingModal';
import { CarpetBookingModal } from '../components/CarpetBookingModal';
import { BookingFormData, CarpetBookingFormData } from '../types/booking';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { statsApi, Stats } from '../services/apiEnhanced';

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

export const HomeScreen: React.FC = () => {
  const { user, token } = useAppSelector((state: any) => state.auth);
  const { isDark } = useTheme();
  const themeStyles = useThemeStyles();
  const [isBookingSheetVisible, setIsBookingSheetVisible] = useState(false);
  const [isCarpetBookingSheetVisible, setIsCarpetBookingSheetVisible] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

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

  // Fetch stats function
  const fetchStats = async () => {
    if (!token) return;

    setIsLoadingStats(true);
    try {
      const response = await statsApi.getStats(token);
      if (response.status === 'success' && response.data?.stats) {
        setStats(response.data.stats);
      } else {
        console.error('Failed to fetch stats:', response.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, [token]);

  const quickActions = [
    { title: 'Car Services', icon: 'car', iconType: 'FontAwesome', color: 'bg-blue-500' },
    { title: 'Carpet Services', icon: 'vacuum', iconType: Platform.OS === 'web' ? 'ReactIcons' : 'MaterialIcons', color: 'bg-green-500' },
  ];

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Prepare stats for display
  const displayStats = stats
    ? [
      {
        label: 'Today\'s Bookings',
        value: stats.todayTotalBookings.toString(),
        color: 'text-blue-600',
      },
      {
        label: 'Revenue Today',
        value: formatCurrency(stats.todayRevenue),
        color: 'text-green-600',
      },
      {
        label: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue),
        color: 'text-purple-600',
      },
    ]
    : [];

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600' }]}>
            Today's Overview
          </Text>
          <TouchableOpacity
            onPress={fetchStats}
            disabled={isLoadingStats}
            activeOpacity={0.7}
            style={{ padding: 8 }}
          >
            <MaterialIcon
              name="refresh"
              size={24}
              color={isDark ? '#60a5fa' : '#2563eb'}
              style={isLoadingStats ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
        </View>
        {isLoadingStats ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#2563eb'} />
            <Text style={[themeStyles.textSecondary, { marginTop: 12, fontSize: 14 }]}>
              Loading stats...
            </Text>
          </View>
        ) : displayStats.length > 0 ? (
          <View>
            {displayStats.map((stat, index) => (
              <View key={stat.label} style={{ width: '100%', marginBottom: index < displayStats.length - 1 ? 16 : 0 }}>
                <View style={[themeStyles.card, { padding: 16 }]}>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14, marginBottom: 8, textAlign: 'left' }]}>
                    {stat.label}
                  </Text>
                  <Text style={[
                    { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
                    stat.color === 'text-blue-600' && { color: isDark ? '#60a5fa' : '#2563eb' },
                    stat.color === 'text-green-600' && { color: isDark ? '#34d399' : '#059669' },
                    stat.color === 'text-purple-600' && { color: isDark ? '#a78bfa' : '#7c3aed' },
                    stat.color === 'text-orange-600' && { color: isDark ? '#fb923c' : '#ea580c' },
                  ]}>
                    {stat.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[themeStyles.card, { padding: 16, alignItems: 'center' }]}>
            <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
              No stats available
            </Text>
          </View>
        )}
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
                  ) : action.iconType === 'ReactIcons' && SiCcleaner && action.icon === 'vacuum' ? (
                    <SiCcleaner size={24} color="white" />
                  ) : (
                    <MaterialIcon name={action.icon === 'vacuum' ? 'cleaning-services' : action.icon} size={24} color="white" />
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
