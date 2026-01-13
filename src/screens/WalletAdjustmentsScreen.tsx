/**
 * Wallet Adjustments Screen
 * Shows detailed adjustment history for an attendant's wallet
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { Wallet, WalletAdjustment } from '../types/wallet';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

interface RouteParams {
  wallet?: Wallet;
}

export const WalletAdjustmentsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();
  const [refreshing, setRefreshing] = useState(false);

  const params = route.params as RouteParams | undefined;
  const wallet = params?.wallet;

  useEffect(() => {
    if (wallet?.attendant?.name) {
      navigation.setOptions({
        title: `${wallet.attendant.name}'s Adjustments`,
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
      });
    }
  }, [navigation, wallet, theme]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh is handled by parent screen, just stop refreshing
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!wallet) {
    return (
      <View style={[themeStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[themeStyles.text, { fontSize: 16 }]}>Wallet not found</Text>
      </View>
    );
  }

  const adjustments = wallet.adjustments || [];

  return (
    <ScrollView
      style={[themeStyles.container, { flex: 1 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={{ padding: 16 }}>
        {/* Wallet Summary */}
        <View style={[
          themeStyles.surface,
          {
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
          }
        ]}>
          <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 12 }]}>
            Wallet Summary
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Current Balance</Text>
              <Text style={[
                { fontSize: 16, fontWeight: '600' },
                wallet.balance >= 0 ? { color: theme.success } : { color: theme.error }
              ]}>
                {formatCurrency(wallet.balance)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[themeStyles.textSecondary, { fontSize: 14 }]}>Total Adjustments</Text>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                {adjustments.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Adjustments List */}
        <View style={[
          themeStyles.surface,
          {
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }
        ]}>
          <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
            Adjustment History
          </Text>

          {adjustments.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <MaterialIcon name="history" size={48} color={theme.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={[themeStyles.textSecondary, { fontSize: 16, textAlign: 'center' }]}>
                No adjustments found
              </Text>
              <Text style={[themeStyles.textSecondary, { fontSize: 14, textAlign: 'center', marginTop: 4 }]}>
                Adjustments will appear here when made
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {adjustments
                .sort((a, b) => new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime())
                .map((adjustment, index) => (
                  <View
                    key={index}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderLeftWidth: 4,
                      borderLeftColor: adjustment.type === 'tip' ? theme.success : theme.error,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <MaterialIcon
                            name={adjustment.type === 'tip' ? 'add-circle' : 'remove-circle'}
                            size={20}
                            color={adjustment.type === 'tip' ? theme.success : theme.error}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[
                            { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
                            { color: adjustment.type === 'tip' ? theme.success : theme.error }
                          ]}>
                            {adjustment.type === 'tip' ? 'Tip' : 'Deduction'}
                          </Text>
                        </View>
                        <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold', marginTop: 4 }]}>
                          {adjustment.type === 'tip' ? '+' : '-'}{formatCurrency(adjustment.amount)}
                        </Text>
                      </View>
                    </View>

                    {adjustment.reason && (
                      <View style={{ marginTop: 8, marginBottom: 8 }}>
                        <Text style={[themeStyles.textSecondary, { fontSize: 12, marginBottom: 4 }]}>Reason</Text>
                        <Text style={[themeStyles.text, { fontSize: 14 }]}>
                          {adjustment.reason}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                      <View>
                        <Text style={[themeStyles.textSecondary, { fontSize: 12, marginBottom: 2 }]}>Adjusted By</Text>
                        <Text style={[themeStyles.text, { fontSize: 14 }]}>
                          {adjustment.adjustedBy}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[themeStyles.textSecondary, { fontSize: 12, marginBottom: 2 }]}>Date</Text>
                        <Text style={[themeStyles.text, { fontSize: 14 }]}>
                          {formatDate(adjustment.adjustedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
