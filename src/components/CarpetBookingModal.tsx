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
import { CarpetBookingFormData, ATTENDANTS } from '../types/booking';

interface CarpetBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (bookingData: CarpetBookingFormData) => void;
}

export const CarpetBookingModal: React.FC<CarpetBookingModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CarpetBookingFormData>({
    customerName: '',
    phoneNumber: '',
    carpetNumber: '',
    color: '',
    attendantId: '',
    amount: 0,
  });

  const handleSubmit = () => {
    if (formData.customerName && formData.phoneNumber && formData.carpetNumber && formData.color && formData.attendantId && formData.amount > 0) {
      onSubmit(formData);
      setFormData({
        customerName: '',
        phoneNumber: '',
        carpetNumber: '',
        color: '',
        attendantId: '',
        amount: 0,
      });
      onClose();
    }
  };

  const isFormValid = formData.customerName && formData.phoneNumber && formData.carpetNumber && formData.color && formData.attendantId && formData.amount > 0;

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
                Add a new carpet booking
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1">
          <View className="px-6 py-4">
            {/* Customer Name */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, customerName: text }))
                }
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number *
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

            {/* Carpet Number */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Carpet Number *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                placeholder="e.g., CP001, CP002"
                value={formData.carpetNumber}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, carpetNumber: text.toUpperCase() }))
                }
                autoCapitalize="characters"
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
        </View>

        {/* Action Buttons - Fixed at bottom */}
        <View className="px-6 py-4 bg-white mb-5">
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 py-4 px-6 border border-gray-300 rounded-lg bg-white"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text className="text-center font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 px-6 rounded-lg ${isFormValid
                ? 'bg-blue-500'
                : 'bg-gray-300'
                }`}
              onPress={handleSubmit}
              disabled={!isFormValid}
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
