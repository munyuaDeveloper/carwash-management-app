import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { forgotPassword, resetPassword, clearError } from '../../store/slices/authSlice';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../../types/auth';
import { showToast } from '../../utils/toast';
import { RoundedButton } from '../../components/RoundedButton';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle forgot password request
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast.error('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    try {
      const request: ForgotPasswordRequest = { email: email.trim() };
      const result = await dispatch(forgotPassword(request));

      if (forgotPassword.fulfilled.match(result)) {
        setSuccessMessage('Password reset email sent successfully! Please check your email for further instructions.');
        // Note: In a real app, you might want to extract the reset token from the email
        // For now, we'll simulate moving to the next step
        setStep('verify');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    if (!isValidPassword(newPassword)) {
      showToast.error('Password must be at least 8 characters long and contain at least one letter and one number');
      return;
    }

    try {
      const request: ResetPasswordRequest = {
        password: newPassword,
        passwordConfirm: confirmPassword,
      };
      const result = await dispatch(resetPassword({ token: resetToken, request }));

      if (resetPassword.fulfilled.match(result)) {
        showToast.success('Password reset successfully! You can now log in with your new password.');
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 1500);
      }
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
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
                {step === 'request' ? 'Reset Password' : 'Set New Password'}
              </Text>
              <Text className="text-gray-600 text-base">
                {step === 'request'
                  ? 'Enter your email address to receive a password reset link'
                  : 'Enter your new password'
                }
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            )}

            {/* Success Message */}
            {successMessage && (
              <View className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <Text className="text-green-700 text-sm">{successMessage}</Text>
              </View>
            )}

            {step === 'request' ? (
              /* Request Step */
              <View className="space-y-6">
                <View>
                  <Text className="text-gray-700 font-medium my-2">Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    autoCapitalize="none"
                  />
                </View>

                <RoundedButton
                  title={isLoading ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="submit"
                  style={{ marginVertical: 20 }}
                />

                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)} className="self-center">
                  <Text className="text-blue-500 font-medium">Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Reset Password Step */
              <View className="space-y-6">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Reset Token</Text>
                  <TextInput
                    value={resetToken}
                    onChangeText={setResetToken}
                    placeholder="Enter reset token from email"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    autoCapitalize="none"
                  />
                  <Text className="text-gray-500 text-sm mt-2">
                    Token sent to {email}
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

                <RoundedButton
                  title={isLoading ? 'Resetting...' : 'Reset Password'}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="submit"
                />

                <View className="flex-row justify-center space-x-4">
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text className="text-blue-500 font-medium">Resend Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStep('request')}>
                    <Text className="text-gray-500 font-medium">Change Email</Text>
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
