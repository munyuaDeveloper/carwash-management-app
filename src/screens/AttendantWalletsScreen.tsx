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
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  fetchAllWallets,
  fetchMyWallet,
  settleAttendantBalances,
  markAttendantPaid,
  adjustWalletBalance,
} from '../store/slices/walletSlice';
import { AdjustBalanceModal } from '../components/AdjustBalanceModal';
import { showToast } from '../utils/toast';
import { RoundedButton } from '../components/RoundedButton';
import { useOffline } from '../hooks/useOffline';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Wallet } from '../types/wallet';
import { useNavigation } from '@react-navigation/native';

export const AttendantWalletsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { user, token } = useAppSelector((state) => state.auth);
  const walletState = useAppSelector((state) => state.wallet);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();
  const isAttendant = user?.role === 'attendant';
  const { isOnline, sync, unsyncedCount } = useOffline();

  const {
    allWallets,
    allWalletsLoading,
    myWallet,
    myWalletLoading,
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

  // Trigger sync when coming online
  useEffect(() => {
    if (isOnline && token) {
      // Sync when network comes online to process pending queue items
      sync().catch(() => {
        // Silently fail - sync errors are handled internally
      });
    }
  }, [isOnline, token, sync]);


  const loadInitialData = async () => {
    if (!token) return;

    try {
      if (isAttendant) {
        // For attendants, fetch their own wallet
        await dispatch(fetchMyWallet({ token: token! }));
      } else {
        // For admins, load all wallets data
        await dispatch(fetchAllWallets({ token: token! }));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const onRefresh = async () => {
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
        await loadInitialData();
      } finally {
        setRefreshing(false);
      }
    } else {
      // If no data to sync, just refresh the data without showing spinner
      setRefreshing(true);
      try {
        await loadInitialData();
      } finally {
        setRefreshing(false);
      }
    }
  };


  const handleSettleBalances = async () => {
    if (selectedAttendants.length === 0) {
      showToast.error('Please select at least one attendant to settle.');
      return;
    }

    // Check if selected attendants have unpaid wallets
    const selectedUnpaidWallets = allWallets.filter(wallet =>
      wallet.attendant && selectedAttendants.includes(wallet.attendant._id) && !wallet.isPaid
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
    // For attendants, show only their wallet
    if (isAttendant) {
      if (myWalletLoading) {
        return (
          <View style={[themeStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[themeStyles.textSecondary, { marginTop: 16 }]}>Loading wallet...</Text>
          </View>
        );
      }

      if (!myWallet) {
        return (
          <View style={[themeStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
            <Icon name="credit-card" size={64} color={theme.textSecondary} />
            <Text style={[themeStyles.textSecondary, { marginTop: 16, fontSize: 18 }]}>
              No wallet found
            </Text>
          </View>
        );
      }

      // Render single wallet for attendant
      return (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={{ padding: 16 }}>
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
                <View style={{ flex: 1 }}>
                  <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600' }]}>
                    {myWallet.attendant?.name || 'Unknown Attendant'}
                  </Text>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
                    {myWallet.attendant?.email || 'No email'}
                  </Text>
                </View>
                <View style={[
                  { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
                  myWallet.isPaid ? { backgroundColor: theme.successLight } : { backgroundColor: theme.warningLight }
                ]}>
                  <Text style={[
                    { fontSize: 14, fontWeight: '500' },
                    myWallet.isPaid ? { color: theme.success } : { color: theme.warning }
                  ]}>
                    {myWallet.isPaid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Balance</Text>
                  <Text style={[
                    { fontWeight: '600', fontSize: 16 },
                    myWallet.balance >= 0 ? { color: theme.success } : { color: theme.error }
                  ]}>
                    {formatCurrency(myWallet.balance)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Total Earnings</Text>
                  <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                    {formatCurrency(myWallet.totalEarnings)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Commission</Text>
                  <Text style={[
                    { fontSize: 16, fontWeight: '500' },
                    { color: theme.success }
                  ]}>
                    {formatCurrency(myWallet.totalCommission)}
                  </Text>
                </View>

                {myWallet.companyDebt > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Company Debt</Text>
                    <Text style={[
                      { fontSize: 16, fontWeight: '500' },
                      { color: theme.error }
                    ]}>
                      {formatCurrency(myWallet.companyDebt)}
                    </Text>
                  </View>
                )}

                {myWallet.lastPaymentDate && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Last Payment</Text>
                    <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                      {formatDate(myWallet.lastPaymentDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }

    // For admins, show all wallets

    if (allWalletsLoading) {
      return (
        <View style={[themeStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[themeStyles.textSecondary, { marginTop: 16 }]}>Loading wallets...</Text>
        </View>
      );
    }

    // Filter wallets by selected attendant
    const filteredWallets = selectedAttendantFilter === 'all'
      ? allWallets
      : allWallets.filter(wallet => wallet.attendant && wallet.attendant._id === selectedAttendantFilter);

    console.log('renderAllWallets - filteredWallets:', filteredWallets?.length);

    const renderHeader = () => (
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
            <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', flexShrink: 1 }]}>
              {selectedAttendantFilter === 'all' ? 'All Wallets' : 'Filtered Wallets'} ({filteredWallets.length})
            </Text>
            {!isAttendant && (
              <RoundedButton
                title="Settle Balances"
                onPress={() => setShowSettleModal(true)}
                disabled={!hasUnpaidWallets || !isOnline}
                variant="submit"
                style={{ flexShrink: 0 }}
              />
            )}
          </View>
          {totalDebt > 0 && (
            <View style={{
              backgroundColor: theme.errorLight,
              borderWidth: 1,
              borderColor: theme.error,
              borderRadius: 8,
              padding: 12,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[themeStyles.text, { color: theme.error, fontWeight: '500' }]}>Total Company Debt</Text>
                <Text style={[themeStyles.text, { color: theme.error, fontWeight: 'bold', fontSize: 18 }]}>
                  {formatCurrency(totalDebt)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );

    const renderEmptyComponent = () => (
      <View style={[themeStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: 400 }]}>
        <Icon name="credit-card" size={64} color={theme.textSecondary} />
        <Text style={[themeStyles.textSecondary, { marginTop: 16, fontSize: 18 }]}>
          {selectedAttendantFilter === 'all' ? 'No wallets found' : 'No wallets found for selected attendant'}
        </Text>
      </View>
    );

    return (
      <FlatList
        data={filteredWallets}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={filteredWallets.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.attendant?._id) {
                try {
                  // Create a clean, serializable wallet object for navigation
                  const walletToPass: Wallet = JSON.parse(JSON.stringify({
                    _id: item._id,
                    attendant: {
                      _id: item.attendant._id,
                      name: item.attendant.name || 'Unknown',
                      email: item.attendant.email || '',
                      role: (item.attendant.role || 'attendant') as 'attendant' | 'admin',
                    },
                    balance: item.balance || 0,
                    totalEarnings: item.totalEarnings || 0,
                    totalCommission: item.totalCommission || 0,
                    totalCompanyShare: item.totalCompanyShare || 0,
                    companyDebt: item.companyDebt || 0,
                    lastPaymentDate: item.lastPaymentDate || null,
                    isPaid: item.isPaid || false,
                    adjustments: item.adjustments || [],
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: item.updatedAt || new Date().toISOString(),
                    __v: (item as any).__v || 0,
                  }));
                  (navigation as any).navigate('WalletAdjustments', {
                    wallet: walletToPass,
                  });
                } catch (error) {
                  console.error('Error navigating to wallet adjustments:', error);
                }
              }
            }}
            style={{
              backgroundColor: isDark ? '#334155' : '#f1f5f9',
              borderRadius: 12,
              padding: 16,
              paddingBottom: 32,
              marginBottom: 12,
              marginHorizontal: 16,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
              overflow: 'visible',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600' }]}>
                    {item.attendant?.name || 'Unknown Attendant'}
                  </Text>
                  <MaterialIcon name="chevron-right" size={20} color={theme.textSecondary} />
                </View>
                <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>
                  {item.attendant?.email || 'No email'}
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

            {!isAttendant && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, marginBottom: 0, gap: 8 }}>
                <RoundedButton
                  title="Adjust Balance"
                  onPress={() => handleAdjustBalance(item)}
                  variant="outline"
                />
                <RoundedButton
                  title={item.isPaid ? 'Already Paid' : item.balance === 0 ? 'No Balance' : 'Mark Paid'}
                  onPress={() => handleMarkAsPaid(item.attendant?._id || '', item.attendant?.name || 'Unknown')}
                  disabled={item.isPaid || item.balance === 0 || !item.attendant || !isOnline}
                  variant="outline"
                />
              </View>
            )}
          </Pressable>
        )}
        ListFooterComponent={() => <View style={{ height: 16 }} />}
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
            {isAttendant ? 'My Wallet' : 'Attendant Wallets'}
          </Text>
        </View>

        {/* Offline Notification */}
        {!isOnline && !isAttendant && (
          <View style={{
            backgroundColor: theme.warningLight,
            borderWidth: 1,
            borderColor: theme.warning,
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <MaterialIcon name="cloud-off" size={20} color={theme.warning} style={{ marginRight: 8 }} />
            <Text style={[{ color: theme.warning, fontSize: 14, flex: 1 }]}>
              You're offline. Settle and Mark Paid features require an internet connection.
            </Text>
          </View>
        )}

        {/* Header - Only show filter for admins */}
        {!isAttendant && (
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
                        {selectedAttendantFilter === 'all' ? (
                          <LinearGradient
                            colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                          />
                        ) : null}
                        <Text style={[
                          { fontSize: 16 },
                          selectedAttendantFilter === 'all' ? { color: '#ffffff', fontWeight: '500' } : { color: theme.text }
                        ]}>
                          All Attendants
                        </Text>
                      </Pressable>
                      {(allWallets || []).filter(wallet => wallet.attendant).map((wallet) => (
                        <Pressable
                          key={wallet.attendant!._id}
                          onPress={() => {
                            setSelectedAttendantFilter(wallet.attendant!._id);
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
                          {selectedAttendantFilter === wallet.attendant!._id ? (
                            <LinearGradient
                              colors={['#6d28d9', '#7c3aed', '#a78bfa']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            />
                          ) : null}
                          <Text style={[
                            { fontSize: 16 },
                            selectedAttendantFilter === wallet.attendant!._id ? { color: '#ffffff', fontWeight: '500' } : { color: theme.text }
                          ]}>
                            {wallet.attendant!.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      {showAttendantDropdown && (
        <Pressable
          onPress={() => setShowAttendantDropdown(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, backgroundColor: 'transparent' }}
        />
      )}
      {renderAllWallets()}


      {/* Settle Modal - Only for admins */}
      {!isAttendant && (
        <Modal visible={showSettleModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)', justifyContent: 'center', paddingHorizontal: 16 }}>
            <View style={[themeStyles.card, { borderRadius: 12, padding: 16, maxHeight: '80%' }]}>
              <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>Settle Attendant Balances</Text>

              {/* Offline Notification in Modal */}
              {!isOnline && (
                <View style={{
                  backgroundColor: theme.warningLight,
                  borderWidth: 1,
                  borderColor: theme.warning,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <MaterialIcon name="cloud-off" size={20} color={theme.warning} style={{ marginRight: 8 }} />
                  <Text style={[{ color: theme.warning, fontSize: 14, flex: 1 }]}>
                    You're offline. Settlement requires an internet connection.
                  </Text>
                </View>
              )}

              <Text style={[themeStyles.textSecondary, { marginBottom: 16 }]}>
                Select attendants to settle their balances. This will mark all their bookings as paid.
              </Text>

              {allWallets.filter(wallet => wallet.attendant && !wallet.isPaid).length === 0 && (
                <View style={{
                  backgroundColor: theme.warningLight,
                  borderWidth: 1,
                  borderColor: theme.warning,
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                }}>
                  <Text style={[{ color: theme.warning, textAlign: 'center' }]}>
                    No unpaid wallets available to settle.
                  </Text>
                </View>
              )}

              <FlatList
                data={allWallets.filter(wallet => !wallet.isPaid && wallet.attendant)}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => {
                  if (!item.attendant) return null;
                  const isSelected = selectedAttendants.includes(item.attendant._id);
                  return (
                    <Pressable
                      onPress={() => {
                        if (isSelected) {
                          setSelectedAttendants(selectedAttendants.filter(id => id !== item.attendant!._id));
                        } else {
                          setSelectedAttendants([...selectedAttendants, item.attendant!._id]);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[themeStyles.text, { fontWeight: '500' }]}>{item.attendant.name}</Text>
                        <Text style={[themeStyles.textSecondary, { fontSize: 14, marginTop: 4 }]}>
                          Balance: {formatCurrency(item.balance)}
                        </Text>
                      </View>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <Icon name="check" size={14} color="white" />
                        )}
                      </View>
                    </Pressable>
                  );
                }}
              />

              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
                <RoundedButton
                  title="Cancel"
                  onPress={() => setShowSettleModal(false)}
                  variant="outline"
                />
                <RoundedButton
                  title={`Settle (${selectedAttendants.length})`}
                  onPress={handleSettleBalances}
                  disabled={selectedAttendants.length === 0 || !isOnline}
                  variant="submit"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Adjust Balance Modal - Only for admins */}
      {!isAttendant && (
        <AdjustBalanceModal
          visible={showAdjustModal}
          wallet={selectedWallet}
          onClose={handleCloseAdjustModal}
          onSubmit={handleSubmitAdjustment}
          formatCurrency={formatCurrency}
        />
      )}
    </View>
  );
};