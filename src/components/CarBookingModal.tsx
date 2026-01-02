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
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { RoundedButton } from './RoundedButton';
import { RootState, AppDispatch } from '../store';
import { bookingApi } from '../services/apiAxios';
import { fetchAttendants } from '../store/slices/attendantSlice';
import {
  CAR_CATEGORIES,
  SERVICE_TYPES,
  BookingFormData,
} from '../types/booking';
import { showToast } from '../utils/toast';
import { ThemeAwareToast } from './ThemeAwareToast';

interface CarBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onBookingCreated?: () => void;
}

// Payment type options based on API documentation
const PAYMENT_TYPES = [
  { id: 'attendant_cash', name: 'Attendant Cash', description: 'Attendant collects cash' },
  { id: 'admin_cash', name: 'Admin Cash', description: 'Admin collects cash' },
  { id: 'admin_till', name: 'Admin Till', description: 'Admin collects via mobile till' },
];

export const CarBookingModal: React.FC<CarBookingModalProps> = ({
  visible,
  onClose,
  onBookingCreated,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { attendants, isLoading: attendantsLoading } = useSelector((state: RootState) => state.attendants);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<BookingFormData>({
    carRegistration: '',
    phoneNumber: '',
    categoryId: '',
    serviceTypeId: '',
    attendantId: '',
    amount: 0,
    note: '',
  });
  const [paymentType, setPaymentType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch attendants when modal opens
  React.useEffect(() => {
    if (visible && token && attendants.length === 0) {
      dispatch(fetchAttendants(token));
    }
  }, [visible, token, dispatch, attendants.length]);


  const calculateSuggestedAmount = (categoryId: string, serviceTypeId: string) => {
    const category = CAR_CATEGORIES.find(cat => cat.id === categoryId);
    const serviceType = SERVICE_TYPES.find(type => type.id === serviceTypeId);

    if (category && serviceType) {
      return Math.round(category.basePrice * serviceType.multiplier);
    }
    return 0;
  };

  const handleCategoryChange = (categoryId: string) => {
    const suggestedAmount = calculateSuggestedAmount(categoryId, formData.serviceTypeId);
    setFormData(prev => ({
      ...prev,
      categoryId,
      amount: suggestedAmount,
    }));
  };

  const handleServiceTypeChange = (serviceTypeId: string) => {
    const suggestedAmount = calculateSuggestedAmount(formData.categoryId, serviceTypeId);
    setFormData(prev => ({
      ...prev,
      serviceTypeId,
      amount: suggestedAmount,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.carRegistration || !formData.categoryId || !formData.serviceTypeId || !formData.attendantId || !paymentType || formData.amount <= 0) {
      showToast.error('Please fill in all required fields including a valid amount.', 'Missing Information');
      return;
    }

    if (!token) {
      showToast.error('Please log in to create bookings.', 'Authentication Error');
      return;
    }

    setIsLoading(true);

    try {
      // Map form data to API format
      const category = CAR_CATEGORIES.find(cat => cat.id === formData.categoryId);
      const serviceType = SERVICE_TYPES.find(type => type.id === formData.serviceTypeId);

      if (!category || !serviceType) {
        throw new Error('Invalid category or service type selected');
      }

      const bookingData = {
        carRegistrationNumber: formData.carRegistration,
        attendant: formData.attendantId,
        amount: formData.amount,
        serviceType: serviceType.name.toLowerCase().replace(' ', ' ') as 'full wash' | 'half wash',
        vehicleType: category.name,
        category: 'vehicle' as const,
        paymentType: paymentType as 'attendant_cash' | 'admin_cash' | 'admin_till',
        status: 'in progress' as const, // Set status as in progress for new vehicle bookings
        ...(formData.note && { note: formData.note }), // Include note if provided
      };

      const response = await bookingApi.createVehicleBooking(bookingData, token);

      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to create booking');
      }

      // Reset form
      setFormData({
        carRegistration: '',
        phoneNumber: '',
        categoryId: '',
        serviceTypeId: '',
        attendantId: '',
        amount: 0,
        note: '',
      });
      setPaymentType('');

      showToast.success('Booking created successfully!');
      // Small delay to ensure toast is shown before modal closes
      setTimeout(() => {
        onBookingCreated?.();
        onClose();
      }, 100);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


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
          { 
            paddingHorizontal: 24, 
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: theme.border 
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                Create a new car wash booking
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
            {/* Car Registration */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Car Registration Number *
              </Text>
              <TextInput
                style={[
                  themeStyles.input,
                  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
                  { borderColor: theme.inputBorder }
                ]}
                placeholder="e.g., KCA 123A"
                placeholderTextColor={theme.inputPlaceholder}
                value={formData.carRegistration}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, carRegistration: text.toUpperCase() }))
                }
                autoCapitalize="characters"
              />
            </View>

            {/* Phone Number */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  themeStyles.input,
                  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
                  { borderColor: theme.inputBorder }
                ]}
                placeholder="e.g., 0712345678"
                placeholderTextColor={theme.inputPlaceholder}
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, phoneNumber: text }))
                }
                keyboardType="numeric"
              />
            </View>

            {/* Car Category */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Car Category *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {CAR_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      { paddingHorizontal: 12, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                      formData.categoryId === category.id
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surface, borderColor: theme.inputBorder }
                    ]}
                    onPress={() => handleCategoryChange(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      { fontSize: 14, fontWeight: '500' },
                      formData.categoryId === category.id
                        ? { color: theme.textInverse }
                        : { color: theme.text }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Type */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Service Type *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {SERVICE_TYPES.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      { paddingHorizontal: 16, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                      formData.serviceTypeId === service.id
                        ? { backgroundColor: theme.secondary, borderColor: theme.secondary }
                        : { backgroundColor: theme.surface, borderColor: theme.inputBorder }
                    ]}
                    onPress={() => handleServiceTypeChange(service.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      { fontSize: 14, fontWeight: '500' },
                      formData.serviceTypeId === service.id
                        ? { color: theme.textInverse }
                        : { color: theme.text }
                    ]}>
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                    const isAvailable = attendant.isAvailable !== false; // Default to true if not set

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

            {/* Payment Type Selection */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                Payment Type *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {PAYMENT_TYPES.map((payment) => {
                  const isSelected = paymentType === payment.id;

                  return (
                    <TouchableOpacity
                      key={payment.id}
                      style={[
                        { paddingHorizontal: 16, paddingVertical: 8, margin: 4, borderRadius: 20, borderWidth: 1, zIndex: 1 },
                        isSelected
                          ? { backgroundColor: theme.warning, borderColor: theme.warning }
                          : { backgroundColor: theme.surface, borderColor: theme.inputBorder }
                      ]}
                      onPress={() => setPaymentType(payment.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        { fontSize: 14, fontWeight: '500' },
                        isSelected
                          ? { color: theme.textInverse }
                          : { color: theme.text }
                      ]}>
                        {payment.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {paymentType && (
                <Text style={[themeStyles.textTertiary, { fontSize: 12, marginTop: 4 }]}>
                  {PAYMENT_TYPES.find(p => p.id === paymentType)?.description}
                </Text>
              )}
            </View>

            {/* Amount Input */}
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
                  const numericValue = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, amount: numericValue }));
                }}
                keyboardType="numeric"
              />
              {formData.categoryId && formData.serviceTypeId && (
                <Text style={[themeStyles.textTertiary, { fontSize: 12, marginTop: 4 }]}>
                  Suggested: KSh {calculateSuggestedAmount(formData.categoryId, formData.serviceTypeId)}
                </Text>
              )}
            </View>

            {/* Note Field */}
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
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
        <View style={[
          themeStyles.surface,
          { paddingHorizontal: 24, paddingVertical: 16, marginBottom: 20 }
        ]}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <RoundedButton
                title="Cancel"
                onPress={onClose}
                variant="outline"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <RoundedButton
                title="Create Booking"
                onPress={handleSubmit}
                disabled={!formData.carRegistration || !formData.categoryId || !formData.serviceTypeId || !formData.attendantId || !paymentType || formData.amount <= 0 || isLoading}
                loading={isLoading}
                variant="submit"
              />
            </View>
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
      </KeyboardAvoidingView>
    </Modal>
  );
};
