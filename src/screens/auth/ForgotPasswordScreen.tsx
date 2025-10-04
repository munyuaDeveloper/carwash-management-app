import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                {step === 'request' ? 'Reset Password' : 'Verify OTP'}
              </Text>
              <Text className="text-gray-600 text-base">
                {step === 'request'
                  ? 'Enter your phone number to receive a verification code'
                  : 'Enter the verification code sent to your phone'
                }
              </Text>
            </View>

            {step === 'request' ? (
              /* Request Step */
              <View className="space-y-6">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  onPress={() => {}}
                  disabled={false}
                  className={`bg-blue-500 rounded-lg py-4 ${false ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white text-center font-semibold text-base">
                    {false ? 'Sending...' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)} className="self-center">
                  <Text className="text-blue-500 font-medium">Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Verify Step */
              <View className="space-y-6">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Verification Code</Text>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter 6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    className="border border-gray-300 rounded-lg px-4 py-3 text-lg text-center"
                  />
                  <Text className="text-gray-500 text-sm mt-2">
                    Code sent to {phone}
                  </Text>
                </View>

                <View>
                  <Text className="text-gray-700 font-medium mb-2">New Password</Text>
                  <View className="relative">
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
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

                <View>
                  <Text className="text-gray-700 font-medium mb-2">Confirm New Password</Text>
                  <View className="relative">
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
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

                <TouchableOpacity
                  onPress={() => {}}
                  disabled={false}
                  className={`bg-blue-500 rounded-lg py-4 ${false ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white text-center font-semibold text-base">
                    {false ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center space-x-4">
                  <TouchableOpacity onPress={() => {}}>
                    <Text className="text-blue-500 font-medium">Resend Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStep('request')}>
                    <Text className="text-gray-500 font-medium">Change Number</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
