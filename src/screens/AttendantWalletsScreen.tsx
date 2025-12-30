import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  fetchAllWallets,
  settleAttendantBalances,
  markAttendantPaid,
  adjustWalletBalance,
} from '../store/slices/walletSlice';
import { AdjustBalanceModal } from '../components/AdjustBalanceModal';
import { showToast } from '../utils/toast';

export const AttendantWalletsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const walletState = useAppSelector((state) => state.wallet);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();

  const {
    allWallets,
    allWalletsLoading,
  } = walletState || {};

  // Calculate total debt from all wallets
  const totalDebt = allWallets?.reduce((sum, wallet) => sum + (wallet.companyDebt || 0), 0) || 0;

  // Check if there are any unpaid wallets
  const hasUnpaidWallets = allWallets?.some(wallet => !wallet.isPaid) || false;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttendants, setSelectedAttendants] = useState<string[]>([]);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedAttendantFilter, setSelectedAttendantFilter] = useState<string>('all');
  const [showAttendantDropdown, setShowAttendantDropdown] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<{ _id: string; attendant: { _id: string; name: string } } | null>(null);


  // Add loading state for user data
  if (!user) {
    return (
      <View style={[themeStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[themeStyles.textSecondary, { marginTop: 16 }]}>
          Loading user data...
        </Text>
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
      // Load all wallets data
      await dispatch(fetchAllWallets({ token: token! }));
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };


  const handleSettleBalances = async () => {
    if (selectedAttendants.length === 0) {
      showToast.error('Please select at least one attendant to settle.');
      return;
    }

    // Check if selected attendants have unpaid wallets
    const selectedUnpaidWallets = allWallets.filter(wallet =>
      selectedAttendants.includes(wallet.attendant._id) && !wallet.isPaid
    );

    if (selectedUnpaidWallets.length === 0) {
      showToast.error('Selected attendants have no unpaid balances to settle.');
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
              showToast.success('Attendant balances settled successfully.');
              await loadInitialData();
            } catch (error) {
              showToast.error('Failed to settle balances. Please try again.');
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
              showToast.success(`${attendantName} marked as paid.`);
              await loadInitialData();
            } catch (error) {
              showToast.error('Failed to mark as paid. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAdjustBalance = (wallet: { _id: string; attendant: { _id: string; name: string } }) => {
    setSelectedWallet(wallet);
    setShowAdjustModal(true);
  };

  const handleSubmitAdjustment = async (adjustmentData: { amount: number; type: string; reason?: string }) => {
    if (!selectedWallet || !selectedWallet.attendant._id) return;

    try {
      await dispatch(adjustWalletBalance({
        attendantId: selectedWallet.attendant._id,
        adjustmentData,
        token: token!
      }));
      showToast.success('Wallet balance adjusted successfully.');
      setShowAdjustModal(false);
      setSelectedWallet(null);
      await loadInitialData();
    } catch (error: any) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
    setSelectedWallet(null);
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



  const renderAllWallets = () => {
    console.log('renderAllWallets - allWallets:', allWallets?.length, 'loading:', allWalletsLoading);

    if (allWalletsLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading wallets...</Text>
        </View>
      );
    }

    // Filter wallets by selected attendant
    const filteredWallets = selectedAttendantFilter === 'all'
      ? allWallets
      : allWallets.filter(wallet => wallet.attendant._id === selectedAttendantFilter);

    console.log('renderAllWallets - filteredWallets:', filteredWallets?.length);

    if (filteredWallets.length === 0) {
      return (
        <View className="flex-1 justify-center items-center">
          <Icon name="credit-card" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-lg text-gray-600">
            {selectedAttendantFilter === 'all' ? 'No wallets found' : 'No wallets found for selected attendant'}
          </Text>
        </View>
      );
    }

    const renderHeader = () => (
      <View className="p-4">
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-gray-900">
              {selectedAttendantFilter === 'all' ? 'All Wallets' : 'Filtered Wallets'} ({filteredWallets.length})
            </Text>
            <Pressable
              onPress={() => hasUnpaidWallets && setShowSettleModal(true)}
              className={`px-4 py-2 rounded-lg ${hasUnpaidWallets ? 'bg-blue-600' : 'bg-gray-400'}`}
              disabled={!hasUnpaidWallets}
            >
              <Text className="text-white font-medium">Settle Balances</Text>
            </Pressable>
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
        data={filteredWallets}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            marginHorizontal: 16,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600' }]}>
                  {item.attendant.name}
                </Text>
                <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
                  {item.attendant.email}
                </Text>
              </View>
              <View style={[
                { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
                item.isPaid ? { backgroundColor: theme.successLight } : { backgroundColor: theme.warningLight }
              ]}>
                <Text style={[
                  { fontSize: 14, fontWeight: '500' },
                  item.isPaid ? { color: theme.success } : { color: theme.warning }
                ]}>
                  {item.isPaid ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Balance</Text>
                <Text style={[
                  { fontWeight: '600', fontSize: 16 },
                  item.balance >= 0 ? { color: theme.success } : { color: theme.error }
                ]}>
                  {formatCurrency(item.balance)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Total Earnings</Text>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                  {formatCurrency(item.totalEarnings)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Commission</Text>
                <Text style={[
                  { fontSize: 16, fontWeight: '500' },
                  { color: theme.success }
                ]}>
                  {formatCurrency(item.totalCommission)}
                </Text>
              </View>

              {item.companyDebt > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Company Debt</Text>
                  <Text style={[
                    { fontSize: 16, fontWeight: '500' },
                    { color: theme.error }
                  ]}>
                    {formatCurrency(item.companyDebt)}
                  </Text>
                </View>
              )}

              {item.lastPaymentDate && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Last Payment</Text>
                  <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                    {formatDate(item.lastPaymentDate)}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-end mt-3 space-x-2">
              <Pressable
                onPress={() => handleAdjustBalance(item)}
                style={[
                  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
                  { backgroundColor: theme.primary }
                ]}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                  Adjust Balance
                </Text>
              </Pressable>
              <Pressable
                onPress={() => !item.isPaid && item.balance !== 0 && handleMarkAsPaid(item.attendant._id, item.attendant.name)}
                className={`px-3 py-2 rounded-lg ${item.isPaid || item.balance === 0 ? 'bg-gray-400' : 'bg-green-600'}`}
                disabled={item.isPaid || item.balance === 0}
              >
                <Text className="text-white text-sm font-medium">
                  {item.isPaid ? 'Already Paid' : item.balance === 0 ? 'No Balance' : 'Mark Paid'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={() => <View className="h-4" />}
      />
    );
  };


  return (
    <View style={[themeStyles.container, { flex: 1 }]}>
      {/* Header */}
      <View style={[
        themeStyles.surface,
        { borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 16, paddingVertical: 12, paddingTop: 64 }
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold' }]}>
            Attendant Wallets
          </Text>
          <Pressable
            onPress={onRefresh}
            style={[
              { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
              { backgroundColor: theme.primary }
            ]}
          >
            <Icon name="refresh" size={16} color="white" />
          </Pressable>
        </View>

        {/* Header */}
        <View style={{ marginTop: 16 }}>
          {/* Attendant Filter */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, position: 'relative' }}>
              <Pressable
                onPress={() => {
                  if (!allWalletsLoading) {
                    setShowAttendantDropdown(!showAttendantDropdown);
                  }
                }}
                style={[
                  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                  { backgroundColor: allWalletsLoading ? theme.surfaceTertiary : theme.surfaceSecondary }
                ]}
                disabled={allWalletsLoading}
              >
                <Text style={[themeStyles.text, { fontSize: 16 }]}>
                  {allWalletsLoading
                    ? 'Loading...'
                    : selectedAttendantFilter === 'all'
                      ? 'All Attendants'
                      : (allWallets || []).find(w => w.attendant._id === selectedAttendantFilter)?.attendant.name || 'All Attendants'
                  }
                </Text>
                <Icon
                  name={showAttendantDropdown ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={theme.textSecondary}
                />
              </Pressable>

              {/* Dropdown Options */}
              {showAttendantDropdown && !allWalletsLoading && (
                <View style={[
                  { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginTop: 4, maxHeight: 192 },
                  { shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, elevation: 3 }
                ]}>
                  <ScrollView style={{ maxHeight: 192 }}>
                    <Pressable
                      onPress={() => {
                        setSelectedAttendantFilter('all');
                        setShowAttendantDropdown(false);
                      }}
                      style={[
                        { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                        selectedAttendantFilter === 'all' && { backgroundColor: theme.primaryLight }
                      ]}
                    >
                      <Text style={[
                        { fontSize: 16 },
                        selectedAttendantFilter === 'all' ? { color: theme.primary, fontWeight: '500' } : { color: theme.text }
                      ]}>
                        All Attendants
                      </Text>
                    </Pressable>
                    {(allWallets || []).map((wallet) => (
                      <Pressable
                        key={wallet.attendant._id}
                        onPress={() => {
                          setSelectedAttendantFilter(wallet.attendant._id);
                          setShowAttendantDropdown(false);
                        }}
                        style={[
                          { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                          selectedAttendantFilter === wallet.attendant._id && { backgroundColor: theme.primaryLight }
                        ]}
                      >
                        <Text style={[
                          { fontSize: 16 },
                          selectedAttendantFilter === wallet.attendant._id ? { color: theme.primary, fontWeight: '500' } : { color: theme.text }
                        ]}>
                          {wallet.attendant.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      {showAttendantDropdown && (
        <Pressable
          onPress={() => setShowAttendantDropdown(false)}
          className="absolute inset-0 z-40"
          style={{ backgroundColor: 'transparent' }}
        />
      )}
      {renderAllWallets()}


      {/* Settle Modal */}
      <Modal visible={showSettleModal} transparent animationType="slide">
        <View className="flex-1 bg-black/35 justify-center px-4">
          <View className="bg-white rounded-lg p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Settle Attendant Balances</Text>
            <Text className="text-gray-600 mb-4">
              Select attendants to settle their balances. This will mark all their bookings as paid.
            </Text>

            {allWallets.filter(wallet => !wallet.isPaid).length === 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <Text className="text-yellow-800 text-center">
                  No unpaid wallets available to settle.
                </Text>
              </View>
            )}

            <FlatList
              data={allWallets.filter(wallet => !wallet.isPaid)}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
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
                </Pressable>
              )}
            />

            <View className="flex-row justify-end mt-4 space-x-2">
              <Pressable
                onPress={() => setShowSettleModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSettleBalances}
                className={`px-4 py-2 rounded-lg ml-5 ${selectedAttendants.length > 0 ? 'bg-blue-600' : 'bg-gray-400'}`}
                disabled={selectedAttendants.length === 0}
              >
                <Text className="text-white font-medium">
                  Settle ({selectedAttendants.length})
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Adjust Balance Modal */}
      <AdjustBalanceModal
        visible={showAdjustModal}
        wallet={selectedWallet}
        onClose={handleCloseAdjustModal}
        onSubmit={handleSubmitAdjustment}
        formatCurrency={formatCurrency}
      />
    </View>
  );
};