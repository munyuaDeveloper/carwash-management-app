import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
import { userApi, authApi } from '../services/apiEnhanced';
import { updateUser } from '../store/slices/authSlice';
import { showToast } from '../utils/toast';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { RoundedButton } from '../components/RoundedButton';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, token } = useAppSelector((state: any) => state.auth);
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const themeStyles = useThemeStyles();

  // Profile update state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password update state
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswordCurrent, setShowPasswordCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordCurrentError, setPasswordCurrentError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhoto(user.photo || '');
    }
  }, [user]);

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleUpdateProfile = async () => {
    // Clear errors
    setNameError('');

    let hasError = false;

    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (!token) {
      showToast.error('Authentication token not found');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const updateData: { name?: string; photo?: string } = {};
      if (name.trim() !== user?.name) updateData.name = name.trim();
      if (photo.trim() !== user?.photo) updateData.photo = photo.trim();

      if (Object.keys(updateData).length === 0) {
        showToast.info('No changes to save');
        setIsUpdatingProfile(false);
        return;
      }

      const response = await userApi.updateMe(updateData, token);

      if (response.status === 'error') {
        showToast.error(response.error || 'Failed to update profile');
      } else {
        showToast.success('Profile updated successfully');
        // Update user in store
        if (response.data) {
          // The response.data might be nested: response.data.data.user or response.data.user or just response.data
          let updatedUser: any = null;
          const data = response.data as any;

          if (data.data?.user) {
            updatedUser = data.data.user;
          } else if (data.user) {
            updatedUser = data.user;
          } else if (data._id || data.email) {
            // If it's already a user object
            updatedUser = data;
          }

          if (updatedUser) {
            dispatch(updateUser(updatedUser));
          }
          navigation.goBack();
        }
      }
    } catch (error: any) {
      showToast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Clear errors
    setPasswordCurrentError('');
    setPasswordError('');
    setPasswordConfirmError('');

    let hasError = false;

    // Validate current password
    if (!passwordCurrent.trim()) {
      setPasswordCurrentError('Current password is required');
      hasError = true;
    }

    // Validate new password
    if (!password.trim()) {
      setPasswordError('New password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      hasError = true;
    }

    // Validate password confirmation
    if (!passwordConfirm.trim()) {
      setPasswordConfirmError('Please confirm your new password');
      hasError = true;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError('Passwords do not match');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (!token) {
      showToast.error('Authentication token not found');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await authApi.updatePassword(
        {
          passwordCurrent: passwordCurrent.trim(),
          password: password.trim(),
          passwordConfirm: passwordConfirm.trim(),
        },
        token
      );

      if (response.status === 'error') {
        showToast.error(response.error || 'Failed to update password');
      } else {
        showToast.success('Password updated successfully');
        // Clear password fields
        setPasswordCurrent('');
        setPassword('');
        setPasswordConfirm('');
      }
    } catch (error: any) {
      showToast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaView style={[themeStyles.container, { flex: 1 }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[themeStyles.surface, { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16 }}
          >
            <MaterialIcon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[themeStyles.text, { fontSize: 20, fontWeight: 'bold', flex: 1 }]}>
            Edit Profile
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Update Section */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
              Profile Information
            </Text>

            {/* Name Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8 }]}>
                Name
              </Text>
              <View style={[
                themeStyles.card,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: nameError ? 1 : 0,
                  borderColor: theme.buttonDanger,
                }
              ]}>
                <TextInput
                  style={[themeStyles.text, { fontSize: 16, padding: 0 }]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setNameError('');
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
              {nameError ? (
                <Text style={[{ color: theme.buttonDanger, fontSize: 12, marginTop: 4 }]}>
                  {nameError}
                </Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8 }]}>
                Email
              </Text>
              <View style={[
                themeStyles.card,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  opacity: 0.6,
                }
              ]}>
                <TextInput
                  style={[themeStyles.text, { fontSize: 16, padding: 0 }]}
                  value={email}
                  editable={false}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Update Profile Button */}
            <RoundedButton
              title={isUpdatingProfile ? 'Updating...' : 'Update Profile'}
              onPress={handleUpdateProfile}
              disabled={isUpdatingProfile}
              loading={isUpdatingProfile}
              variant="save"
            />
          </View>

          {/* Divider */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
            <View style={[{ height: 1, backgroundColor: theme.border }]} />
          </View>

          {/* Password Update Section */}
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
              Change Password
            </Text>

            {/* Current Password Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8 }]}>
                Current Password
              </Text>
              <View style={[
                themeStyles.card,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: passwordCurrentError ? 1 : 0,
                  borderColor: theme.buttonDanger,
                }
              ]}>
                <TextInput
                  style={[themeStyles.text, { fontSize: 16, padding: 0, flex: 1 }]}
                  value={passwordCurrent}
                  onChangeText={(text) => {
                    setPasswordCurrent(text);
                    setPasswordCurrentError('');
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry={!showPasswordCurrent}
                />
                <TouchableOpacity
                  onPress={() => setShowPasswordCurrent(!showPasswordCurrent)}
                  style={{ padding: 4 }}
                >
                  <Icon
                    name={showPasswordCurrent ? 'eye-slash' : 'eye'}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {passwordCurrentError ? (
                <Text style={[{ color: theme.buttonDanger, fontSize: 12, marginTop: 4 }]}>
                  {passwordCurrentError}
                </Text>
              ) : null}
            </View>

            {/* New Password Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8 }]}>
                New Password
              </Text>
              <View style={[
                themeStyles.card,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: passwordError ? 1 : 0,
                  borderColor: theme.buttonDanger,
                }
              ]}>
                <TextInput
                  style={[themeStyles.text, { fontSize: 16, padding: 0, flex: 1 }]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  <Icon
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[{ color: theme.buttonDanger, fontSize: 12, marginTop: 4 }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8 }]}>
                Confirm New Password
              </Text>
              <View style={[
                themeStyles.card,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: passwordConfirmError ? 1 : 0,
                  borderColor: theme.buttonDanger,
                }
              ]}>
                <TextInput
                  style={[themeStyles.text, { fontSize: 16, padding: 0, flex: 1 }]}
                  value={passwordConfirm}
                  onChangeText={(text) => {
                    setPasswordConfirm(text);
                    setPasswordConfirmError('');
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry={!showPasswordConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  style={{ padding: 4 }}
                >
                  <Icon
                    name={showPasswordConfirm ? 'eye-slash' : 'eye'}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {passwordConfirmError ? (
                <Text style={[{ color: theme.buttonDanger, fontSize: 12, marginTop: 4 }]}>
                  {passwordConfirmError}
                </Text>
              ) : null}
            </View>

            {/* Update Password Button */}
            <RoundedButton
              title={isUpdatingPassword ? 'Updating...' : 'Update Password'}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
              loading={isUpdatingPassword}
              variant="save"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

