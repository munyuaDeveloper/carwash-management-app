import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { bookingApi } from '../services/apiAxios';
import { fetchAttendants } from '../store/slices/attendantSlice';
import {
  CAR_CATEGORIES,
  SERVICE_TYPES,
  BookingFormData,
} from '../types/booking';

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
  const { token } = useSelector((state: RootState) => state.auth);
  const { attendants, isLoading: attendantsLoading } = useSelector((state: RootState) => state.attendants);
  const [formData, setFormData] = useState<BookingFormData>({
    carRegistration: '',
    phoneNumber: '',
    categoryId: '',
    serviceTypeId: '',
    attendantId: '',
    amount: 0,
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
      Alert.alert('Missing Information', 'Please fill in all required fields including a valid amount.');
      return;
    }

    if (!token) {
      Alert.alert('Authentication Error', 'Please log in to create bookings.');
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
      });
      setPaymentType('');

      Alert.alert('Success', 'Booking created successfully!');
      onBookingCreated?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create booking. Please try again.');
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
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200 bg-white">
          <View className="flex-row items-center">
           
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 text-center">
                Create a new car wash booking
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-4">
            {/* Car Registration */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Car Registration Number *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="e.g., KCA 123A"
                value={formData.carRegistration}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, carRegistration: text.toUpperCase() }))
                }
                autoCapitalize="characters"
              />
            </View>

            {/* Phone Number */}

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="e.g., 0712345678"
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, phoneNumber: text }))
                }
                keyboardType="numeric"
              />
            </View>

            {/* Car Category */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Car Category *
              </Text>
              <View className="flex-row flex-wrap -mx-1">
                {CAR_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className={`px-3 py-2 m-1 rounded-full border ${formData.categoryId === category.id
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                      }`}
                    onPress={() => handleCategoryChange(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-medium ${formData.categoryId === category.id
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Type */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </Text>
              <View className="flex-row flex-wrap -mx-1">
                {SERVICE_TYPES.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    className={`px-4 py-2 m-1 rounded-full border ${formData.serviceTypeId === service.id
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300'
                      }`}
                    onPress={() => handleServiceTypeChange(service.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-medium ${formData.serviceTypeId === service.id
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}
                    >
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Attendant Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Select Attendant *
              </Text>
              {attendantsLoading ? (
                <View className="flex-row items-center justify-center py-4">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="text-gray-500 ml-2">Loading attendants...</Text>
                </View>
              ) : attendants.length > 0 ? (
                <View className="flex-row flex-wrap -mx-1">
                  {attendants.map((attendant) => {
                    const isSelected = formData.attendantId === attendant._id;
                    const isAvailable = attendant.isAvailable !== false; // Default to true if not set

                    const getButtonClass = () => {
                      if (isSelected) return 'bg-purple-500 border-purple-500';
                      if (isAvailable) return 'bg-white border-gray-300';
                      return 'bg-gray-100 border-gray-200';
                    };

                    const getTextClass = () => {
                      if (isSelected) return 'text-white';
                      if (isAvailable) return 'text-gray-700';
                      return 'text-gray-400';
                    };

                    return (
                      <TouchableOpacity
                        key={attendant._id}
                        className={`px-4 py-2 m-1 rounded-full border ${getButtonClass()}`}
                        onPress={() => isAvailable && setFormData(prev => ({ ...prev, attendantId: attendant._id }))}
                        disabled={!isAvailable}
                        activeOpacity={isAvailable ? 0.7 : 1}
                      >
                        <Text className={`text-sm font-medium ${getTextClass()}`}>
                          {attendant.name}
                          {!isAvailable && ' (Unavailable)'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View className="py-4">
                  <Text className="text-gray-500 text-center">No attendants available</Text>
                </View>
              )}
            </View>

            {/* Payment Type Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </Text>
              <View className="flex-row flex-wrap -mx-1">
                {PAYMENT_TYPES.map((payment) => {
                  const isSelected = paymentType === payment.id;

                  return (
                    <TouchableOpacity
                      key={payment.id}
                      className={`px-4 py-2 m-1 rounded-full border ${isSelected
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white border-gray-300'
                        }`}
                      onPress={() => setPaymentType(payment.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-medium ${isSelected
                          ? 'text-white'
                          : 'text-gray-700'
                          }`}
                      >
                        {payment.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {paymentType && (
                <Text className="text-xs text-gray-500 mt-1">
                  {PAYMENT_TYPES.find(p => p.id === paymentType)?.description}
                </Text>
              )}
            </View>

            {/* Amount Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Amount (KSh) *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="Enter amount"
                value={formData.amount > 0 ? formData.amount.toString() : ''}
                onChangeText={(text) => {
                  const numericValue = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, amount: numericValue }));
                }}
                keyboardType="numeric"
              />
              {formData.categoryId && formData.serviceTypeId && (
                <Text className="text-xs text-gray-500 mt-1">
                  Suggested: KSh {calculateSuggestedAmount(formData.categoryId, formData.serviceTypeId)}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
        <View className="px-6 py-4 bg-white mb-5">
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 py-4 px-4 border border-gray-300 rounded-lg bg-white mr-2"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text className="text-center font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 px-4 rounded-lg ${formData.carRegistration && formData.categoryId && formData.serviceTypeId && formData.attendantId && paymentType && formData.amount > 0 && !isLoading
                ? 'bg-blue-500'
                : 'bg-gray-300'
                }`}
              onPress={handleSubmit}
              disabled={!formData.carRegistration || !formData.categoryId || !formData.serviceTypeId || !formData.attendantId || !paymentType || formData.amount <= 0 || isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-center font-medium text-white ml-2">
                    Creating...
                  </Text>
                </View>
              ) : (
                <Text className="text-center font-medium text-white">
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
