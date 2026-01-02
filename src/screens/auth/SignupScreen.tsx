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
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { RoundedButton } from '../../components/RoundedButton';

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
          <View className="flex-1 px-8 py-12 pt-16">
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
                <View className="relative">
                  <Icon
                    name="user"
                    size={20}
                    color="#6B7280"
                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                  />
                  <TextInput
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    placeholder="Enter your full name"
                    textContentType="name"
                    autoComplete="name"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base pl-12"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Phone Number *</Text>
                <View className="relative">
                  <Icon
                    name="phone"
                    size={20}
                    color="#6B7280"
                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                  />
                  <TextInput
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base pl-12"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Role Selection */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Role *</Text>
                <View className="flex-row space-x-4">
                  {[
                    { value: 'owner', label: 'Owner', icon: 'crown' },
                    { value: 'manager', label: 'Manager', icon: 'user-tie' },
                    { value: 'attendant', label: 'Attendant', icon: 'user' },
                  ].map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      onPress={() => handleInputChange('role', role.value)}
                      className={`flex-1 py-3 px-4 rounded-lg border ${formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                        }`}
                    >
                      <View className="items-center">
                        <Icon
                          name={role.icon}
                          size={16}
                          color={formData.role === role.value ? '#2563EB' : '#6B7280'}
                          style={{ marginBottom: 4 }}
                        />
                        <Text
                          className={`text-center font-medium ${formData.role === role.value ? 'text-blue-600' : 'text-gray-600'
                            }`}
                        >
                          {role.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Password *</Text>
                <View className="relative">
                  <Icon
                    name="lock"
                    size={20}
                    color="#6B7280"
                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                  />
                  <TextInput
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base pl-12 pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Icon
                      name={showPassword ? 'eye-slash' : 'eye'}
                      size={20}
                      color="#2563EB"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Confirm Password *</Text>
                <View className="relative">
                  <Icon
                    name="lock"
                    size={20}
                    color="#6B7280"
                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                  />
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base pl-12 pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-slash' : 'eye'}
                      size={20}
                      color="#2563EB"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Signup Button */}
              <RoundedButton
                title="Create Account"
                onPress={() => { }}
                disabled={false}
                loading={false}
                variant="submit"
              />

              {/* Login Link */}
              <View className="flex-row justify-center items-center">
                <Text className="text-gray-600">Already have an account? </Text>
                <TouchableOpacity onPress={handleLogin} className="flex-row items-center">
                  <Text className="text-blue-500 font-medium">Sign In</Text>
                  <Icon
                    name="arrow-right"
                    size={16}
                    color="#2563EB"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
