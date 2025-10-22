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
import { useTheme } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../utils/themeUtils';
import { login, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { theme, isDark } = useTheme();
  const themeStyles = useThemeStyles();

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
    <SafeAreaView style={[themeStyles.surface, { flex: 1 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[themeStyles.surface, { flex: 1, paddingHorizontal: 32, paddingVertical: 48, paddingTop: 64 }]}>
            {/* Header */}
            <View style={{ marginBottom: 48 }}>
              <Text style={[themeStyles.text, { fontSize: 32, fontWeight: 'bold', marginBottom: 8 }]}>
                Welcome Back
              </Text>
              <Text style={[themeStyles.textSecondary, { fontSize: 16 }]}>
                Sign in to your account
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 24 }}>
              {/* Email Input */}
              <View>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginBottom: 8 }]}>
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email address"
                  placeholderTextColor={theme.inputPlaceholder}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  style={[
                    themeStyles.input,
                    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
                    emailError ? { borderColor: theme.error, backgroundColor: theme.errorLight } : { borderColor: theme.inputBorder }
                  ]}
                />
                {emailError && (
                  <Text style={[
                    { fontSize: 14, marginTop: 4 },
                    { color: theme.error }
                  ]}>
                    {emailError}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View>
                <Text style={[themeStyles.text, { fontSize: 16, fontWeight: '500', marginVertical: 8 }]}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.inputPlaceholder}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="current-password"
                    style={[
                      themeStyles.input,
                      {
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        paddingRight: 48
                      },
                      passwordError ? { borderColor: theme.error, backgroundColor: theme.errorLight } : { borderColor: theme.inputBorder }
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: 12 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      { fontSize: 14, fontWeight: '500' },
                      { color: theme.primary }
                    ]}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {passwordError && (
                  <Text style={[
                    { fontSize: 14, marginTop: 4 },
                    { color: theme.error }
                  ]}>
                    {passwordError}
                  </Text>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View style={[
                  { backgroundColor: theme.errorLight, borderWidth: 1, borderColor: theme.error, borderRadius: 8, padding: 12 }
                ]}>
                  <Text style={[
                    { fontSize: 14, fontWeight: '500' },
                    { color: theme.error }
                  ]}>
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
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword' as never)}
                style={{ alignSelf: 'flex-end', marginVertical: 20 }}
                activeOpacity={0.7}
              >
                <Text style={[
                  { fontSize: 16, fontWeight: '500' },
                  { color: theme.primary }
                ]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={[
                  { borderRadius: 8, paddingVertical: 16, opacity: isLoading ? 0.5 : 1 },
                  { backgroundColor: theme.buttonPrimary }
                ]}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  {isLoading && (
                    <View style={{
                      width: 16, height: 16, borderWidth: 2, borderColor: 'white', borderTopColor: 'transparent',
                      borderRadius: 8, marginRight: 8
                    }} />
                  )}
                  <Text style={[
                    { textAlign: 'center', fontWeight: '600', fontSize: 16 },
                    { color: theme.buttonPrimaryText }
                  ]}>
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
