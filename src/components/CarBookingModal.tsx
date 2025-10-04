import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  CAR_CATEGORIES,
  SERVICE_TYPES,
  ATTENDANTS,
  BookingFormData,
} from '../types/booking';

interface CarBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (bookingData: BookingFormData) => void;
}

export const CarBookingModal: React.FC<CarBookingModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    carRegistration: '',
    phoneNumber: '',
    categoryId: '',
    serviceTypeId: '',
    attendantId: '',
    amount: 0,
  });


  const calculateAmount = (categoryId: string, serviceTypeId: string) => {
    const category = CAR_CATEGORIES.find(cat => cat.id === categoryId);
    const serviceType = SERVICE_TYPES.find(type => type.id === serviceTypeId);

    if (category && serviceType) {
      return Math.round(category.basePrice * serviceType.multiplier);
    }
    return 0;
  };

  const handleCategoryChange = (categoryId: string) => {
    const newAmount = calculateAmount(categoryId, formData.serviceTypeId);
    setFormData(prev => ({
      ...prev,
      categoryId,
      amount: newAmount,
    }));
  };

  const handleServiceTypeChange = (serviceTypeId: string) => {
    const newAmount = calculateAmount(formData.categoryId, serviceTypeId);
    setFormData(prev => ({
      ...prev,
      serviceTypeId,
      amount: newAmount,
    }));
  };

  const handleSubmit = () => {
    if (formData.carRegistration && formData.categoryId && formData.serviceTypeId && formData.attendantId) {
      onSubmit(formData);
      setFormData({
        carRegistration: '',
        phoneNumber: '',
        categoryId: '',
        serviceTypeId: '',
        attendantId: '',
        amount: 0,
      });
      onClose();
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
            <TouchableOpacity
              onPress={onClose}
              className="mr-4 p-2 -ml-2"
            >
              <Text className="text-2xl text-blue-600">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                Add a new car wash booking
              </Text>
            </View>
          </View>
        </View>

        <View
          className="flex-1"
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
              <View className="flex-row flex-wrap -mx-1">
                {ATTENDANTS.map((attendant) => {
                  const isSelected = formData.attendantId === attendant.id;
                  const isAvailable = attendant.isAvailable;

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
                      key={attendant.id}
                      className={`px-4 py-2 m-1 rounded-full border ${getButtonClass()}`}
                      onPress={() => isAvailable && setFormData(prev => ({ ...prev, attendantId: attendant.id }))}
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
            </View>

            {/* Amount Display */}
            {formData.amount > 0 && (
              <View className="mb-6 p-4 bg-gray-50 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </Text>
                <Text className="text-2xl font-bold text-green-600">
                  KSh {formData.amount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons - Fixed at bottom */}
        <View className="px-6 py-4 bg-white mb-5">
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 py-4 px-4 border border-gray-300 rounded-lg bg-white"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text className="text-center font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 px-4 rounded-lg ${formData.carRegistration && formData.categoryId && formData.serviceTypeId && formData.attendantId
                ? 'bg-blue-500'
                : 'bg-gray-300'
                }`}
              onPress={handleSubmit}
              disabled={!formData.carRegistration || !formData.categoryId || !formData.serviceTypeId || !formData.attendantId}
              activeOpacity={0.7}
            >
              <Text className="text-center font-medium text-white">
                Create Booking
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
