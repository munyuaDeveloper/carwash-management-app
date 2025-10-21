import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
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
  const { token } = useSelector((state: RootState) => state.auth);
  const { attendants, isLoading: attendantsLoading } = useSelector((state: RootState) => state.attendants);
  const [formData, setFormData] = useState<CarpetBookingFormData>({
    phoneNumber: '',
    color: '',
    attendantId: '',
    amount: 0,
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
        paymentType: 'attendant_cash' as const, // Default payment type for carpet bookings
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
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200 bg-white">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 text-center">
                Create a new carpet booking
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
            {/* Phone Number */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="e.g., +254712345678"
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, phoneNumber: text }))
                }
                keyboardType="phone-pad"
              />
            </View>

            {/* Carpet Color */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Carpet Color *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="e.g., Red, Blue, Green"
                value={formData.color}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, color: text }))
                }
                autoCapitalize="words"
              />
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
                    const isAvailable = attendant.isAvailable !== false;

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

            {/* Amount */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Amount (KSh) *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="Enter amount"
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
              <View className="mb-6 p-4 bg-gray-50 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </Text>
                <Text className="text-2xl font-bold text-green-600">
                  KSh {formData.amount.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
        <View className="px-6 py-4 bg-white mb-5">
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 py-4 px-3 border border-gray-300 rounded-lg bg-white mr-3"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text className="text-center font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 px-3 rounded-lg ${isFormValid && !isLoading
                ? 'bg-blue-500'
                : 'bg-gray-300'
                }`}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
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
