import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'attendant' as 'owner' | 'manager' | 'attendant',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };



  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-8 py-12">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </Text>
              <Text className="text-gray-600 text-base">
                Join your car wash business
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-6">
              {/* Name Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter your full name"
                  textContentType="name"
                  autoComplete="name"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Phone Number *</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  autoCapitalize="none"
                />
              </View>

              {/* Role Selection */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Role *</Text>
                <View className="flex-row space-x-4">
                  {[
                    { value: 'owner', label: 'Owner' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'attendant', label: 'Attendant' },
                  ].map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      onPress={() => handleInputChange('role', role.value)}
                      className={`flex-1 py-3 px-4 rounded-lg border ${formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                        }`}
                    >
                      <Text
                        className={`text-center font-medium ${formData.role === role.value ? 'text-blue-600' : 'text-gray-600'
                          }`}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Password *</Text>
                <View className="relative">
                  <TextInput
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Text className="text-blue-500 font-medium">
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Confirm Password *</Text>
                <View className="relative">
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Text className="text-blue-500 font-medium">
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                onPress={() => {}}
                disabled={false}
                className={`bg-blue-500 rounded-lg py-4 ${false ? 'opacity-50' : ''}`}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {false ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center">
                <Text className="text-gray-600">Already have an account? </Text>
                <TouchableOpacity onPress={handleLogin}>
                  <Text className="text-blue-500 font-medium">Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
