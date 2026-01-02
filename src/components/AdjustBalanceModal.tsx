import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { RoundedButton } from './RoundedButton';
import { showToast } from '../utils/toast';
import { ThemeAwareToast } from './ThemeAwareToast';

interface Wallet {
  _id: string;
  attendant: {
    name: string;
  };
}

interface AdjustBalanceModalProps {
  visible: boolean;
  wallet: Wallet | null;
  onClose: () => void;
  onSubmit: (data: { amount: number; type: string; reason?: string }) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  visible,
  wallet,
  onClose,
  onSubmit,
  formatCurrency,
}) => {
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();

  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState<{ amount: number; type: string; reason?: string } | null>(null);

  // Reset form when modal opens/closes or wallet changes
  useEffect(() => {
    if (visible && wallet) {
      setAdjustAmount('');
      setAdjustType('');
      setAdjustReason('');
      setShowConfirmation(false);
      setPendingAdjustment(null);
    }
  }, [visible, wallet]);

  const handleClose = () => {
    setAdjustAmount('');
    setAdjustType('');
    setAdjustReason('');
    setShowConfirmation(false);
    setPendingAdjustment(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!wallet) {
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast.error('Please enter a valid amount greater than 0.');
      return;
    }

    if (!adjustType) {
      showToast.error('Please select an adjustment type (tip or deduction).');
      return;
    }

    // Store the pending adjustment and show confirmation
    setPendingAdjustment({
      amount,
      type: adjustType,
      reason: adjustReason || undefined,
    });
    setShowConfirmation(true);
  };

  const handleConfirmAdjustment = async () => {
    if (!pendingAdjustment || !wallet) return;
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      await onSubmit(pendingAdjustment);
      setPendingAdjustment(null);
      handleClose();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to adjust balance. Please try again.');
      setPendingAdjustment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingAdjustment(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <View style={[
          {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            padding: 16,
            overflow: 'visible', // Allow toast to be visible outside modal bounds on Android
          }
        ]}>
          {/* Confirmation Overlay */}
          {showConfirmation && wallet && pendingAdjustment && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}>
              <View style={[
                themeStyles.surface,
                { borderRadius: 12, padding: 24, maxWidth: '90%', minWidth: 300 }
              ]}>
                <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }]}>
                  Confirm Adjustment
                </Text>
                <Text style={[themeStyles.textSecondary, { fontSize: 16, marginBottom: 20 }]}>
                  Are you sure you want to adjust {wallet.attendant.name}'s balance by {formatCurrency(pendingAdjustment.amount)}?
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                  <Pressable
                    onPress={handleCancelConfirmation}
                    disabled={isSubmitting}
                    style={[
                      { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
                      { backgroundColor: theme.surfaceSecondary, opacity: isSubmitting ? 0.5 : 1 }
                    ]}
                  >
                    <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmAdjustment}
                    disabled={isSubmitting}
                    style={[
                      { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
                      { backgroundColor: theme.primary, opacity: isSubmitting ? 0.5 : 1 }
                    ]}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                      {isSubmitting ? 'Adjusting...' : 'Confirm'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <View style={[
            themeStyles.surface,
            {
              borderRadius: 12,
              padding: 20,
              maxHeight: Platform.OS === 'android' ? '85%' : '90%',
              width: '100%',
              alignSelf: 'center', // Center the modal without using justifyContent
            }
          ]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold' }]}>
                Adjust Balance
              </Text>
              <Pressable
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <MaterialIcon name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {wallet && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[themeStyles.textSecondary, { fontSize: 14, marginBottom: 4 }]}>
                  Attendant
                </Text>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500' }]}>
                  {wallet.attendant.name}
                </Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            >
              <View style={{ marginBottom: 16 }}>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                  Amount *
                </Text>
                <TextInput
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      color: theme.text,
                    },
                    themeStyles.surface
                  ]}
                  placeholder="Enter amount"
                  placeholderTextColor={theme.textSecondary}
                  value={adjustAmount}
                  onChangeText={setAdjustAmount}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                  Type *
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  {['tip', 'deduction'].map((type) => {
                    const isSelected = adjustType === type;
                    const isTip = type === 'tip';

                    return (
                      <Pressable
                        key={type}
                        onPress={() => !isSubmitting && setAdjustType(type)}
                        disabled={isSubmitting}
                        style={[
                          {
                            flex: 1,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            borderWidth: 2,
                            alignItems: 'center',
                          },
                          isSelected
                            ? isTip
                              ? { borderColor: theme.success, backgroundColor: theme.successLight }
                              : { borderColor: theme.error, backgroundColor: theme.errorLight }
                            : { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }
                        ]}
                      >
                        <Text
                          style={[
                            { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
                            isSelected
                              ? isTip
                                ? { color: theme.success }
                                : { color: theme.error }
                              : { color: theme.text }
                          ]}
                        >
                          Add {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                  Reason (Optional)
                </Text>
                <TextInput
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      color: theme.text,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    },
                    themeStyles.surface
                  ]}
                  placeholder="Enter reason for adjustment"
                  placeholderTextColor={theme.textSecondary}
                  value={adjustReason}
                  onChangeText={setAdjustReason}
                  multiline
                  numberOfLines={3}
                  editable={!isSubmitting}
                />
              </View>
            </ScrollView>

            <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
              <RoundedButton
                title={isSubmitting ? 'Saving...' : 'Save'}
                onPress={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="save"
              />
            </View>
          </View>
          {/* Toast rendered inside modal to appear above modal content */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: Platform.OS === 'android' ? 10000 : 9999,
              elevation: Platform.OS === 'android' ? 1001 : 0,
              pointerEvents: 'box-none',
            }}
          >
            <ThemeAwareToast />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

