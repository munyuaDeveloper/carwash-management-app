import React, { useState, useEffect } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('munyuapeter07@gmail.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [dispatch, error]);

  // Navigate to main app when login is successful
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' as never }],
      });
    }
  }, [isAuthenticated, navigation]);

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
    if (error) dispatch(clearError());
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError('');
    if (error) dispatch(clearError());
  };

  const handleLogin = () => {
    // Clear any existing errors
    dispatch(clearError());
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    dispatch(login({ email: email.trim(), password }));
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
            <View className="mb-12">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </Text>
              <Text className="text-gray-600 text-base">
                Sign in to your account
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-6">
              {/* Email Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  className={`border rounded-lg px-4 py-3 text-base ${emailError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  autoCapitalize="none"
                />
                {emailError && (
                  <Text className="text-red-500 text-sm mt-1">{emailError}</Text>
                )}
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-700 font-medium my-2">Password</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="current-password"
                    className={`border rounded-lg px-4 py-3 text-base pr-12 ${passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
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
                {passwordError && (
                  <Text className="text-red-500 text-sm mt-1">{passwordError}</Text>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <Text className="text-red-600 text-sm font-medium">
                    {error.includes('Network')
                      ? 'Network error. Please check your connection and try again.'
                      : error.includes('401') || error.includes('Invalid')
                        ? 'Invalid email or password. Please try again.'
                        : error.includes('404')
                          ? 'User not found. Please check your email address.'
                          : error
                    }
                  </Text>
                </View>
              )}

              {/* Forgot Password */}
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)} className="self-end my-5" activeOpacity={0.7}>
                <Text className="text-blue-500 font-medium">Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                className={`bg-blue-500 rounded-lg py-4 ${isLoading ? 'opacity-50' : ''}`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  {isLoading && (
                    <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  )}
                  <Text className="text-white text-center font-semibold text-base">
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </View>
              </TouchableOpacity>


              {/* Divider */}
              {/* <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View> */}

              {/* Sign Up Link */}
              {/* <View className="flex-row justify-center">
                <Text className="text-gray-600">Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)} activeOpacity={0.7}>
                  <Text className="text-blue-500 font-medium">Sign Up</Text>
                </TouchableOpacity>
              </View> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
