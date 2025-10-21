import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  fetchMyWallet,
  fetchAllWallets,
  fetchUnpaidWallets,
  fetchDailySummary,
  fetchSystemWallet,
  fetchWalletSummary,
  fetchDebtSummary,
  settleAttendantBalances,
  markAttendantPaid,
  setSelectedDate,
  clearErrors,
} from '../store/slices/walletSlice';
import { Wallet, AttendantWalletSummary } from '../types/wallet';

interface AttendantWalletsScreenProps {
  navigation?: any;
}

export const AttendantWalletsScreen: React.FC<AttendantWalletsScreenProps> = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const walletState = useAppSelector((state) => state.wallet);

  const {
    myWallet,
    allWallets,
    unpaidWallets,
    dailySummary,
    systemWallet,
    walletSummary,
    debtSummary,
    myWalletLoading,
    allWalletsLoading,
    unpaidWalletsLoading,
    dailySummaryLoading,
    systemWalletLoading,
    walletSummaryLoading,
    debtSummaryLoading,
    selectedDate,
  } = walletState || {};

  // Calculate total debt from all wallets
  const totalDebt = allWallets?.reduce((sum, wallet) => sum + (wallet.companyDebt || 0), 0) || 0;

  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAttendants, setSelectedAttendants] = useState<string[]>([]);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-wallet' | 'all-wallets' | 'summary'>('all-wallets');

  const isAdmin = user?.role === 'admin';

  // Add loading state for user data
  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading user data...</Text>
      </View>
    );
  }

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    if (!token) return;

    try {
      if (isAdmin) {
        // Load admin-specific data
        await Promise.all([
          dispatch(fetchAllWallets({ token: token!, date: selectedDate || undefined })),
          dispatch(fetchUnpaidWallets(token!)),
          dispatch(fetchDailySummary({ token: token!, date: selectedDate || undefined })),
          dispatch(fetchSystemWallet(token!)),
          dispatch(fetchWalletSummary(token!)),
          dispatch(fetchDebtSummary(token!)),
        ]);
      } else {
        // Load attendant-specific data
        await dispatch(fetchMyWallet({ token: token!, date: selectedDate || undefined }));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reset date to today when reloading
    const today = new Date().toISOString().split('T')[0];
    dispatch(setSelectedDate(today));
    await loadInitialData();
    setRefreshing(false);
  };

  const handleDateChange = (date: string) => {
    dispatch(setSelectedDate(date));
    setShowDatePicker(false);
    if (token) {
      loadInitialData();
    }
  };

  const handleSettleBalances = async () => {
    if (selectedAttendants.length === 0) {
      Alert.alert('Error', 'Please select at least one attendant to settle.');
      return;
    }

    Alert.alert(
      'Settle Balances',
      `Are you sure you want to settle balances for ${selectedAttendants.length} attendant(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          onPress: async () => {
            try {
              await dispatch(settleAttendantBalances({
                attendantIds: selectedAttendants,
                token: token!
              }));
              setSelectedAttendants([]);
              setShowSettleModal(false);
              Alert.alert('Success', 'Attendant balances settled successfully.');
              await loadInitialData();
            } catch (error) {
              Alert.alert('Error', 'Failed to settle balances. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (attendantId: string, attendantName: string) => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${attendantName} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await dispatch(markAttendantPaid({
                attendantId,
                token: token!
              }));
              Alert.alert('Success', `${attendantName} marked as paid.`);
              await loadInitialData();
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as paid. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderMyWallet = () => {
    if (myWalletLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading your wallet...</Text>
        </View>
      );
    }

    if (!myWallet) {
      return (
        <View className="flex-1 justify-center items-center">
          <Icon name="credit-card" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-lg text-gray-600">No wallet data available</Text>
        </View>
      );
    }

    return (
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">My Wallet</Text>
            <View className={`px-3 py-1 rounded-full ${myWallet.isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-sm font-medium ${myWallet.isPaid ? 'text-green-800' : 'text-yellow-800'}`}>
                {myWallet.isPaid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Balance</Text>
              <Text className={`text-lg font-semibold ${myWallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(myWallet.balance)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Total Earnings</Text>
              <Text className="text-gray-900 font-medium">
                {formatCurrency(myWallet.totalEarnings)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Commission (40%)</Text>
              <Text className="text-green-600 font-medium">
                {formatCurrency(myWallet.totalCommission)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Company Share (60%)</Text>
              <Text className="text-blue-600 font-medium">
                {formatCurrency(myWallet.totalCompanyShare)}
              </Text>
            </View>

            {myWallet.companyDebt > 0 && (
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Company Debt</Text>
                <Text className="text-red-600 font-medium">
                  {formatCurrency(myWallet.companyDebt)}
                </Text>
              </View>
            )}

            {myWallet.lastPaymentDate && (
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Last Payment</Text>
                <Text className="text-gray-900 font-medium">
                  {formatDate(myWallet.lastPaymentDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderAllWallets = () => {
    if (allWalletsLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading wallets...</Text>
        </View>
      );
    }

    if (allWallets.length === 0) {
      return (
        <View className="flex-1 justify-center items-center">
          <Icon name="credit-card" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-lg text-gray-600">No wallets found</Text>
        </View>
      );
    }

    const renderHeader = () => (
      <View className="p-4">
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-gray-900">
              All Wallets ({allWallets.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowSettleModal(true)}
              className="bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Settle Balances</Text>
            </TouchableOpacity>
          </View>
          {totalDebt > 0 && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-red-800 font-medium">Total Company Debt</Text>
                <Text className="text-red-900 font-bold text-lg">
                  {formatCurrency(totalDebt)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );

    return (
      <FlatList
        data={allWallets}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-lg p-4 mb-3 mx-4 border border-gray-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {item.attendant.name}
                </Text>
                <Text className="text-sm text-gray-600">{item.attendant.email}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${item.isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Text className={`text-sm font-medium ${item.isPaid ? 'text-green-800' : 'text-yellow-800'}`}>
                  {item.isPaid ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Balance</Text>
                <Text className={`font-semibold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(item.balance)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Earnings</Text>
                <Text className="text-gray-900 font-medium">
                  {formatCurrency(item.totalEarnings)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Commission</Text>
                <Text className="text-green-600 font-medium">
                  {formatCurrency(item.totalCommission)}
                </Text>
              </View>

              {item.companyDebt > 0 && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Company Debt</Text>
                  <Text className="text-red-600 font-medium">
                    {formatCurrency(item.companyDebt)}
                  </Text>
                </View>
              )}

              {item.lastPaymentDate && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Last Payment</Text>
                  <Text className="text-gray-900 font-medium">
                    {formatDate(item.lastPaymentDate)}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-end mt-3 space-x-2">
              <TouchableOpacity
                onPress={() => handleMarkAsPaid(item.attendant._id, item.attendant.name)}
                className="bg-green-600 px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-sm font-medium">Mark Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => <View className="h-4" />}
      />
    );
  };

  const renderSummary = () => {
    if (dailySummaryLoading || systemWalletLoading || walletSummaryLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading summary...</Text>
        </View>
      );
    }

    return (
      <View className="p-4">
        {/* Daily Summary */}
        {dailySummary && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Date</Text>
                <Text className="text-gray-900 font-medium">
                  {formatDate(dailySummary.date)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Attendants</Text>
                <Text className="text-gray-900 font-medium">{dailySummary.totalAttendants}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Bookings</Text>
                <Text className="text-gray-900 font-medium">{dailySummary.totalBookings}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Amount</Text>
                <Text className="text-gray-900 font-medium">
                  {formatCurrency(dailySummary.totalAmount)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Commission</Text>
                <Text className="text-green-600 font-medium">
                  {formatCurrency(dailySummary.totalCommission)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Company Share</Text>
                <Text className="text-blue-600 font-medium">
                  {formatCurrency(dailySummary.totalCompanyShare)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* System Wallet */}
        {systemWallet && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">System Wallet</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Revenue</Text>
                <Text className="text-gray-900 font-medium">
                  {formatCurrency(systemWallet.totalRevenue)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Company Share</Text>
                <Text className="text-blue-600 font-medium">
                  {formatCurrency(systemWallet.totalCompanyShare)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Attendant Payments</Text>
                <Text className="text-green-600 font-medium">
                  {formatCurrency(systemWallet.totalAttendantPayments)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Current Balance</Text>
                <Text className={`font-semibold ${systemWallet.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(systemWallet.currentBalance)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Wallet Summary */}
        {walletSummary && (
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Wallet Summary</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Attendant Debts</Text>
                <Text className="text-red-600 font-medium">
                  {formatCurrency(walletSummary.totalAttendantDebts)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Net Company Balance</Text>
                <Text className={`font-semibold ${walletSummary.netCompanyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(walletSummary.netCompanyBalance)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 pt-16">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Attendant Wallets</Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-gray-100 px-3 py-2 rounded-lg flex-row items-center"
            >
              <Icon name="calendar" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-700">
                {selectedDate ? formatDate(selectedDate) : 'Today'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRefresh}
              className="bg-blue-600 px-3 py-2 rounded-lg"
            >
              <Icon name="refresh" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        {isAdmin ? (
          <View className="flex-row mt-4 bg-gray-100 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setActiveTab('all-wallets')}
              className={`flex-1 py-2 rounded-md ${activeTab === 'all-wallets' ? 'bg-white' : ''}`}
            >
              <Text className={`text-center font-medium ${activeTab === 'all-wallets' ? 'text-blue-600' : 'text-gray-600'}`}>
                All Wallets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('summary')}
              className={`flex-1 py-2 rounded-md ${activeTab === 'summary' ? 'bg-white' : ''}`}
            >
              <Text className={`text-center font-medium ${activeTab === 'summary' ? 'text-blue-600' : 'text-gray-600'}`}>
                Summary
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-4">
            <Text className="text-lg font-semibold text-gray-900 text-center">
              My Wallet
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {!isAdmin ? (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderMyWallet()}
        </ScrollView>
      ) : (
        <>
          {activeTab === 'all-wallets' && renderAllWallets()}
          {activeTab === 'summary' && (
            <ScrollView
              className="flex-1"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {renderSummary()}
            </ScrollView>
          )}
        </>
      )}

      {/* Date Picker Modal with react-native-calendars */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View className="bg-white rounded-lg p-6 mx-4 w-80">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} className="p-2">
                <Icon name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={(day) => {
                handleDateChange(day.dateString);
              }}
              current={selectedDate || new Date().toISOString().split('T')[0]}
              markedDates={{
                [selectedDate || '']: {
                  selected: true,
                  selectedColor: '#3B82F6',
                  selectedTextColor: '#FFFFFF',
                },
                [new Date().toISOString().split('T')[0]]: {
                  marked: true,
                  dotColor: '#10B981',
                },
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#6B7280',
                selectedDayBackgroundColor: '#3B82F6',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#3B82F6',
                dayTextColor: '#111827',
                textDisabledColor: '#9CA3AF',
                dotColor: '#10B981',
                selectedDotColor: '#ffffff',
                arrowColor: '#3B82F6',
                disabledArrowColor: '#9CA3AF',
                monthTextColor: '#111827',
                indicatorColor: '#3B82F6',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            />

            <View className="flex-row justify-end mt-4 space-x-2">
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleDateChange(new Date().toISOString().split('T')[0]);
                }}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settle Modal */}
      <Modal visible={showSettleModal} transparent animationType="slide">
        <View className="flex-1 bg-black/35 justify-center px-4">
          <View className="bg-white rounded-lg p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Settle Attendant Balances</Text>
            <Text className="text-gray-600 mb-4">
              Select attendants to settle their balances. This will mark all their bookings as paid.
            </Text>

            <FlatList
              data={allWallets.filter(wallet => !wallet.isPaid)}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (selectedAttendants.includes(item.attendant._id)) {
                      setSelectedAttendants(selectedAttendants.filter(id => id !== item.attendant._id));
                    } else {
                      setSelectedAttendants([...selectedAttendants, item.attendant._id]);
                    }
                  }}
                  className="flex-row items-center justify-between p-3 border border-gray-200 rounded-lg mb-2"
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{item.attendant.name}</Text>
                    <Text className="text-sm text-gray-600">
                      Balance: {formatCurrency(item.balance)}
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${selectedAttendants.includes(item.attendant._id)
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                    }`}>
                    {selectedAttendants.includes(item.attendant._id) && (
                      <Icon name="check" size={14} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />

            <View className="flex-row justify-end mt-4 space-x-2">
              <TouchableOpacity
                onPress={() => setShowSettleModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSettleBalances}
                className="bg-blue-600 px-4 py-2 rounded-lg ml-5"
              >
                <Text className="text-white font-medium">
                  Settle ({selectedAttendants.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};