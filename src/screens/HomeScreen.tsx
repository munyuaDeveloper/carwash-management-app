import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { isDark, theme } = useTheme();
  const themeStyles = useThemeStyles();
  const [isBookingSheetVisible, setIsBookingSheetVisible] = useState(false);
  const [isCarpetBookingSheetVisible, setIsCarpetBookingSheetVisible] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      }
      // Silently fail - don't show errors for stats
    } catch (error) {
      // Silently fail - don't show errors for stats
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStats();
    } finally {
      setRefreshing(false);
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

  // Get formatted date
  const getFormattedDate = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[today.getDay()];
    const month = months[today.getMonth()];
    const day = today.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${dayName}, ${month} ${day}${suffix}`;
  };

  // Get greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning!';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon!';
    } else if (hour >= 17 && hour < 21) {
      return 'Good evening!';
    } else {
      return 'Good night!';
    }
  };

  // Calculate comparison data (mock for now - can be replaced with actual API data)
  const getComparisonData = () => {
    if (!stats) return { bookingsChange: 0, revenueChange: 0 };
    // Mock comparison - in real app, this would come from API
    const bookingsChange = 1; // +1 from yesterday
    const revenueChange = 15; // +15% from yesterday
    return { bookingsChange, revenueChange };
  };

  // Calculate progress percentage for total revenue (mock target)
  const getRevenueProgress = () => {
    if (!stats) return 0;
    // Mock target - in real app, this would come from API
    const target = 650000; // Target revenue
    const progress = Math.min((stats.totalRevenue / target) * 100, 100);
    return Math.round(progress);
  };

  const comparisonData = getComparisonData();
  const revenueProgress = getRevenueProgress();

  // Circular Progress Component (simplified visual indicator)
  const CircularProgress = ({ progress, size = 70, color = '#10b981' }: { progress: number; size?: number; color?: string }) => {
    const progressAngle = (progress / 100) * 360;
    const radius = size / 2 - 6;

    // Create a simple progress ring using border
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        {/* Background circle */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 6,
            borderColor: isDark ? '#374151' : '#e5e7eb',
          }}
        />
        {/* Progress fill - using a semi-circle approach */}
        {progress > 0 && (
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 6,
              borderColor: 'transparent',
              borderTopColor: progress >= 12.5 ? color : 'transparent',
              borderRightColor: progress >= 37.5 ? color : 'transparent',
              borderBottomColor: progress >= 62.5 ? color : 'transparent',
              borderLeftColor: progress >= 87.5 ? color : 'transparent',
              transform: [{ rotate: '-90deg' }],
            }}
          />
        )}
        {/* Additional progress segments for smoother appearance */}
        {progress >= 25 && (
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 6,
              borderColor: 'transparent',
              borderRightColor: color,
              borderBottomColor: progress >= 50 ? color : 'transparent',
              transform: [{ rotate: '0deg' }],
            }}
          />
        )}
        {progress >= 50 && (
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 6,
              borderColor: 'transparent',
              borderBottomColor: color,
              borderLeftColor: progress >= 75 ? color : 'transparent',
              transform: [{ rotate: '90deg' }],
            }}
          />
        )}
        {progress >= 75 && (
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 6,
              borderColor: 'transparent',
              borderLeftColor: color,
              borderTopColor: progress >= 100 ? color : 'transparent',
              transform: [{ rotate: '180deg' }],
            }}
          />
        )}
        {/* Percentage text */}
        <View style={{ position: 'absolute', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{progress}%</Text>
        </View>
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
      {/* Header with Profile */}
      <View style={[themeStyles.surface, { paddingHorizontal: 24, paddingVertical: 4, paddingTop: 64 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          {/* Profile Picture */}
          <View style={[
            { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
            { backgroundColor: theme.primary }
          ]}>
            {user?.photo ? (
              <Text style={{ color: theme.textInverse, fontSize: 24 }}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            ) : (
              <Text style={{ color: theme.textInverse, fontSize: 24, fontWeight: 'bold' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[themeStyles.text, { fontSize: 16, fontWeight: 'bold', marginBottom: 4 }]}>
              {getTimeBasedGreeting()}, {user?.name || 'Manager'}.
            </Text>
            <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
              {getFormattedDate()}
            </Text>
          </View>
        </View>
      </View>

      {/* Today's Overview */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600' }]}>
            Today's Overview
          </Text>
        </View>

        <View>
          {/* First Row: Today's Bookings and Revenue Today */}
          <View style={{ flexDirection: 'row', marginHorizontal: -6, marginBottom: 12 }}>
            {/* Today's Bookings Card */}
            <LinearGradient
              colors={isDark ? ['#1e3a8a', '#3b82f6', '#6366f1'] : ['#1e40af', '#3b82f6', '#60a5fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                themeStyles.card,
                {
                  flex: 1,
                  padding: 16,
                  marginHorizontal: 6,
                  borderWidth: 0,
                }
              ]}
            >
              <Text style={{ color: 'white', fontSize: 14, marginBottom: 8, opacity: 0.9 }}>
                Today's Bookings
              </Text>
              <View style={{ alignItems: 'flex-start' }}>
                {isLoadingStats ? (
                  <ActivityIndicator size="small" color="white" style={{ marginBottom: 4 }} />
                ) : (
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                    {stats?.todayTotalBookings ?? '---'}
                  </Text>
                )}
                {!isLoadingStats && stats && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Icon name="arrow-up" size={14} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '600' }}>
                      +{comparisonData.bookingsChange} from yesterday
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Revenue Today Card */}
            <LinearGradient
              colors={isDark ? ['#064e3b', '#10b981', '#34d399'] : ['#047857', '#10b981', '#6ee7b7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                themeStyles.card,
                {
                  flex: 1,
                  padding: 16,
                  marginHorizontal: 6,
                  borderWidth: 0,
                }
              ]}
            >
              <Text style={{ color: 'white', fontSize: 14, marginBottom: 8, opacity: 0.9 }}>
                Revenue Today
              </Text>
              <View style={{ alignItems: 'flex-start' }}>
                {isLoadingStats ? (
                  <ActivityIndicator size="small" color="white" style={{ marginBottom: 4 }} />
                ) : (
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                    {stats ? formatCurrency(stats.todayRevenue) : '---'}
                  </Text>
                )}
                {!isLoadingStats && stats && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Icon name="arrow-up" size={14} color="#d1fae5" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#d1fae5', fontSize: 11, fontWeight: '600' }}>
                      +{comparisonData.revenueChange}% from yesterday
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Total Revenue Card */}
          <LinearGradient
            colors={isDark ? ['#4c1d95', '#7c3aed', '#a78bfa'] : ['#6d28d9', '#7c3aed', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              themeStyles.card,
              {
                padding: 16,
                borderWidth: 0,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 14, marginBottom: 8, opacity: 0.9 }}>
                Total Revenue
              </Text>
              {isLoadingStats ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                  {stats ? formatCurrency(stats.totalRevenue) : '---'}
                </Text>
              )}
            </View>
            {!isLoadingStats && stats && (
              <View style={{ alignItems: 'center', marginLeft: 16 }}>
                <CircularProgress progress={revenueProgress} size={70} color="#10b981" />
                <Text style={{ color: 'white', fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                  Target Reached
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', marginHorizontal: -8 }}>
          {/* Car Services Card */}
          <TouchableOpacity
            style={{ flex: 1, paddingHorizontal: 8, marginRight: 8 }}
            activeOpacity={0.7}
            onPress={handleCarServicesPress}
          >
            <LinearGradient
              colors={isDark ? ['#1e40af', '#3b82f6', '#60a5fa'] : ['#2563eb', '#3b82f6', '#60a5fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                themeStyles.card,
                {
                  padding: 24,
                  minHeight: 140,
                  borderWidth: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }
              ]}
            >
              <View style={[
                { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              ]}>
                <Icon name="car" size={32} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                Car Services
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Carpet Services Card */}
          <TouchableOpacity
            style={{ flex: 1, paddingHorizontal: 8, marginLeft: 8 }}
            activeOpacity={0.7}
            onPress={handleCarpetServicesPress}
          >
            <LinearGradient
              colors={isDark ? ['#065f46', '#10b981', '#34d399'] : ['#047857', '#10b981', '#6ee7b7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                themeStyles.card,
                {
                  padding: 24,
                  minHeight: 140,
                  borderWidth: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }
              ]}
            >
              <View style={[
                { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              ]}>
                {Platform.OS === 'web' && SiCcleaner ? (
                  <SiCcleaner size={32} color="white" />
                ) : (
                  <MaterialIcon name="cleaning-services" size={32} color="white" />
                )}
              </View>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                Carpet Services
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
