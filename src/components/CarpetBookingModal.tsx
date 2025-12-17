import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { RootState, AppDispatch } from '../store';
import { fetchAttendants } from '../store/slices/attendantSlice';
import { bookingApi } from '../services/apiAxios';
import { CarpetBookingFormData } from '../types/booking';

interface CarpetBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onBookingCreated?: () => void;
}

export const CarpetBookingModal: React.FC<CarpetBookingModalProps> = ({
  visible,
  onClose,
  onBookingCreated,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { attendants, isLoading: attendantsLoading } = useSelector((state: RootState) => state.attendants);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();
  const isAdmin = user?.role === 'admin';
  const [formData, setFormData] = useState<CarpetBookingFormData>({
    phoneNumber: '',
    color: '',
    attendantId: '',
    amount: 0,
    note: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch attendants when modal opens
  React.useEffect(() => {
    if (visible && token && attendants.length === 0) {
      dispatch(fetchAttendants(token));
    }
  }, [visible, token, dispatch, attendants.length]);

  const handleSubmit = async () => {
    if (!formData.phoneNumber || !formData.color || !formData.attendantId || formData.amount <= 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!token) {
      Alert.alert('Authentication Error', 'Please log in to create bookings.');
      return;
    }

    setIsLoading(true);

    try {
      const bookingData = {
        phoneNumber: formData.phoneNumber,
        color: formData.color,
        attendant: formData.attendantId,
        amount: formData.amount,
        category: 'carpet' as const,
        paymentType: 'admin_till' as const, // Default payment type for carpet bookings
        status: 'pending' as const, // Set status as pending for new carpet bookings
        ...(formData.note && { note: formData.note }), // Include note if provided
      };

      const response = await bookingApi.createCarpetBooking(bookingData, token);

      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to create booking');
      }

      // Reset form
      setFormData({
        phoneNumber: '',
        color: '',
        attendantId: '',
        amount: 0,
        note: '',
      });

      Alert.alert('Success', 'Carpet booking created successfully!');
      onBookingCreated?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.phoneNumber && formData.color && formData.attendantId && formData.amount > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[themeStyles.surface, { flex: 1 }]}
      >
        {/* Header */}
        <View style={[
          themeStyles.surface,
          { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                Create a new carpet booking
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            {/* Phone Number */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Phone Number *
              </Text>
              <TextInput
                style={[
                  themeStyles.input,
                  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
                  { borderColor: theme.inputBorder }
                ]}
                placeholder="e.g., +254712345678"
                placeholderTextColor={theme.inputPlaceholder}
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, phoneNumber: text }))
                }
                keyboardType="phone-pad"
              />
            </View>

            {/* Carpet Color */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Carpet Color *
              </Text>
              <TextInput
                style={[
                  themeStyles.input,
                  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
                  { borderColor: theme.inputBorder }
                ]}
                placeholder="e.g., Red, Blue, Green"
                placeholderTextColor={theme.inputPlaceholder}
                value={formData.color}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, color: text }))
                }
                autoCapitalize="words"
              />
            </View>

            {/* Attendant Selection */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Select Attendant *
              </Text>
              {attendantsLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[themeStyles.textTertiary, { marginLeft: 8 }]}>
                    Loading attendants...
                  </Text>
                </View>
              ) : attendants.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                  {attendants.map((attendant) => {
                    const isSelected = formData.attendantId === attendant._id;
                    const isAvailable = attendant.isAvailable !== false;

                    const getButtonStyle = () => {
                      if (isSelected) return { backgroundColor: theme.primary, borderColor: theme.primary };
                      if (isAvailable) return { backgroundColor: theme.surface, borderColor: theme.inputBorder };
                      return { backgroundColor: theme.surfaceTertiary, borderColor: theme.borderLight };
                    };

                    const getTextStyle = () => {
                      if (isSelected) return { color: theme.textInverse };
                      if (isAvailable) return { color: theme.text };
                      return { color: theme.textTertiary };
                    };

                    return (
                      <TouchableOpacity
                        key={attendant._id}
                        style={[
                          { paddingHorizontal: 16, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                          getButtonStyle()
                        ]}
                        onPress={() => isAvailable && setFormData(prev => ({ ...prev, attendantId: attendant._id }))}
                        disabled={!isAvailable}
                        activeOpacity={isAvailable ? 0.7 : 1}
                      >
                        <Text style={[
                          { fontSize: 14, fontWeight: '500' },
                          getTextStyle()
                        ]}>
                          {attendant.name}
                          {!isAvailable && ' (Unavailable)'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingVertical: 16 }}>
                  <Text style={[themeStyles.textTertiary, { textAlign: 'center' }]}>
                    No attendants available
                  </Text>
                </View>
              )}
            </View>

            {/* Amount */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Amount (KSh) *
              </Text>
              <TextInput
                style={[
                  themeStyles.input,
                  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
                  { borderColor: theme.inputBorder }
                ]}
                placeholder="Enter amount"
                placeholderTextColor={theme.inputPlaceholder}
                value={formData.amount > 0 ? formData.amount.toString() : ''}
                onChangeText={(text) => {
                  const numericValue = parseFloat(text) || 0;
                  setFormData(prev => ({ ...prev, amount: numericValue }));
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Amount Display */}
            {formData.amount > 0 && (
              <View style={[
                { marginBottom: 24, padding: 16, borderRadius: 8 },
                { backgroundColor: theme.surfaceSecondary }
              ]}>
                <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 4 }]}>
                  Total Amount
                </Text>
                <Text style={[
                  { fontSize: 24, fontWeight: 'bold' },
                  { color: theme.success }
                ]}>
                  KSh {formData.amount.toLocaleString()}
                </Text>
              </View>
            )}

            {/* Note Field (Admin Only) */}
            {isAdmin && (
              <View style={{ marginBottom: 24 }}>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                  Note (Optional)
                </Text>
                <TextInput
                  style={[
                    themeStyles.input,
                    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, minHeight: 80, textAlignVertical: 'top' },
                    { borderColor: theme.inputBorder }
                  ]}
                  placeholder="Add any additional notes about this booking..."
                  placeholderTextColor={theme.inputPlaceholder}
                  value={formData.note || ''}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, note: text }))
                  }
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
        <View style={[
          themeStyles.surface,
          { paddingHorizontal: 24, paddingVertical: 16, marginBottom: 20 }
        ]}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[
                { flex: 1, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8, marginRight: 12, zIndex: 1 },
                { backgroundColor: theme.surface, borderColor: theme.inputBorder }
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[
                { textAlign: 'center', fontWeight: '500', fontSize: 16 },
                { color: theme.text }
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                { flex: 1, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 8, zIndex: 1 },
                isFormValid && !isLoading
                  ? { backgroundColor: theme.buttonPrimary }
                  : { backgroundColor: theme.surfaceTertiary }
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={[
                    { textAlign: 'center', fontWeight: '500', fontSize: 16, marginLeft: 8 },
                    { color: theme.buttonPrimaryText }
                  ]}>
                    Creating...
                  </Text>
                </View>
              ) : (
                <Text style={[
                  { textAlign: 'center', fontWeight: '500', fontSize: 16 },
                  isFormValid && !isLoading
                    ? { color: theme.buttonPrimaryText }
                    : { color: theme.textTertiary }
                ]}>
                  Create Booking
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
