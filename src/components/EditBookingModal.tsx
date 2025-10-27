import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableHighlight,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateBooking } from '../store/slices/bookingSlice';
import { fetchAttendants } from '../store/slices/attendantSlice';
import { ApiBooking } from '../types/booking';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

interface EditBookingModalProps {
  visible: boolean;
  onClose: () => void;
  booking: ApiBooking | null;
  onBookingUpdated?: () => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  visible,
  onClose,
  booking,
  onBookingUpdated,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.bookings);
  const { attendants } = useAppSelector((state) => state.attendants);
  const { token } = useAppSelector((state) => state.auth);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();

  // Form state
  const [formData, setFormData] = useState({
    carRegistrationNumber: '',
    phoneNumber: '',
    color: '',
    attendant: '',
    amount: '',
    serviceType: 'full wash' as 'full wash' | 'half wash',
    paymentType: 'attendant_cash' as 'attendant_cash' | 'admin_cash' | 'admin_till',
    status: 'pending' as 'pending' | 'in progress' | 'completed' | 'cancelled',
  });

  // Load attendants when modal opens
  useEffect(() => {
    if (visible && token && attendants.length === 0) {
      dispatch(fetchAttendants(token));
    }
  }, [visible, token, dispatch, attendants.length]);

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking) {
      setFormData({
        carRegistrationNumber: booking.carRegistrationNumber || '',
        phoneNumber: booking.phoneNumber || '',
        color: booking.color || '',
        attendant: booking.attendant._id,
        amount: booking.amount.toString(),
        serviceType: booking.serviceType || 'full wash',
        paymentType: booking.paymentType,
        status: booking.status,
      });
    }
  }, [booking]);

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!booking) return;

    // Validation
    if (!formData.attendant) {
      Alert.alert('Error', 'Please select an attendant');
      return;
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (booking?.category === 'vehicle' && !formData.carRegistrationNumber.trim()) {
      Alert.alert('Error', 'Please enter car registration number');
      return;
    }

    if (booking?.category === 'carpet' && !formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter customer phone number');
      return;
    }

    if (booking?.category === 'carpet' && !formData.color.trim()) {
      Alert.alert('Error', 'Please enter carpet color');
      return;
    }

    try {
      const updateData: any = {
        attendant: formData.attendant,
        amount: Number(formData.amount),
        category: booking.category,
        paymentType: formData.paymentType,
        status: formData.status,
      };

      // Add category-specific fields
      if (booking.category === 'vehicle') {
        updateData.carRegistrationNumber = formData.carRegistrationNumber.trim();
        updateData.serviceType = formData.serviceType;
      } else {
        updateData.phoneNumber = formData.phoneNumber.trim();
        updateData.color = formData.color.trim();
      }

      await dispatch(updateBooking({ id: booking._id, bookingData: updateData })).unwrap();

      Alert.alert('Success', 'Booking updated successfully', [
        {
          text: 'OK', onPress: () => {
            onBookingUpdated?.();
            onClose();
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to update booking');
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[themeStyles.container, { flex: 1 }]}>
        {/* Header */}
        <View style={[
          themeStyles.surface,
          {
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              style={{ padding: 8, zIndex: 1 }}
            >
              <Icon name="times" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600' }]}>
              Edit Booking
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[
                {
                  backgroundColor: theme.buttonPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  zIndex: 1,
                },
                isLoading && { opacity: 0.5 }
              ]}
            >
              <Text style={[
                { color: theme.buttonPrimaryText, fontWeight: '600' },
                isLoading && { opacity: 0.5 }
              ]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24 }}>

            {/* Attendant Selection */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                Attendant *
              </Text>
              <View style={[
                {
                  backgroundColor: theme.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }
              ]}>
                <Text style={[themeStyles.text, { fontSize: 16 }]}>
                  {booking.attendant.name} ({booking.attendant.email})
                </Text>
                <Text style={[themeStyles.textTertiary, { fontSize: 12, marginTop: 4 }]}>
                  Current attendant (cannot be changed)
                </Text>
              </View>
            </View>

            {/* Amount */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                Amount (KSh) *
              </Text>
              <TextInput
                value={formData.amount}
                onChangeText={(value) => handleInputChange('amount', value)}
                placeholder="Enter amount"
                keyboardType="numeric"
                style={[
                  themeStyles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                  }
                ]}
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            {/* Payment Type */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Payment Type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {(['attendant_cash', 'admin_cash', 'admin_till'] as const).map((paymentType) => (
                  <TouchableOpacity
                    key={paymentType}
                    onPress={() => handleInputChange('paymentType', paymentType)}
                    style={[
                      { paddingHorizontal: 8, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                      formData.paymentType === paymentType
                        ? { backgroundColor: theme.warning, borderColor: theme.warning }
                        : { backgroundColor: theme.surface, borderColor: theme.inputBorder }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      { fontSize: 14, fontWeight: '500' },
                      formData.paymentType === paymentType
                        ? { color: theme.textInverse }
                        : { color: theme.text }
                    ]}>
                      {paymentType === 'attendant_cash' ? 'Attendant Cash' :
                        paymentType === 'admin_cash' ? 'Admin Cash' : 'Admin Till'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Status
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {(['pending', 'in progress', 'completed', 'cancelled'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleInputChange('status', status)}
                    style={[
                      { paddingHorizontal: 8, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                      formData.status === status
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surface, borderColor: theme.inputBorder }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      { fontSize: 14, fontWeight: '500' },
                      formData.status === status
                        ? { color: theme.textInverse }
                        : { color: theme.text }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category-specific fields */}
            {booking?.category === 'vehicle' ? (
              <>
                {/* Car Registration */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                    Car Registration Number *
                  </Text>
                  <TextInput
                    value={formData.carRegistrationNumber}
                    onChangeText={(value) => handleInputChange('carRegistrationNumber', value)}
                    placeholder="e.g., KCA 123A"
                    style={[
                      themeStyles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 16,
                      }
                    ]}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                {/* Service Type */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                    Service Type
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                    {(['full wash', 'half wash'] as const).map((serviceType) => (
                      <TouchableOpacity
                        key={serviceType}
                        onPress={() => handleInputChange('serviceType', serviceType)}
                        style={[
                          { paddingHorizontal: 16, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                          formData.serviceType === serviceType
                            ? { backgroundColor: theme.secondary, borderColor: theme.secondary }
                            : { backgroundColor: theme.surface, borderColor: theme.inputBorder }
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          { fontSize: 14, fontWeight: '500' },
                          formData.serviceType === serviceType
                            ? { color: theme.textInverse }
                            : { color: theme.text }
                        ]}>
                          {serviceType === 'full wash' ? 'Full Wash' : 'Half Wash'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              </>
            ) : (
              <>
                {/* Phone Number */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                    Customer Phone Number *
                  </Text>
                  <TextInput
                    value={formData.phoneNumber}
                    onChangeText={(value) => handleInputChange('phoneNumber', value)}
                    placeholder="e.g., +254712345678"
                    keyboardType="phone-pad"
                    style={[
                      themeStyles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 16,
                      }
                    ]}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                {/* Carpet Color */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                    Carpet Color *
                  </Text>
                  <TextInput
                    value={formData.color}
                    onChangeText={(value) => handleInputChange('color', value)}
                    placeholder="e.g., Red, Blue, Green"
                    style={[
                      themeStyles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 16,
                      }
                    ]}
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
              </>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <View style={{ alignItems: 'center', marginTop: 24 }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[themeStyles.textSecondary, { marginTop: 8 }]}>
                  Updating booking...
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
