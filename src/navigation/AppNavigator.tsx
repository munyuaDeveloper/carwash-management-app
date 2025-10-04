import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// Screens
import { LoadingScreen } from '../components/LoadingScreen';
import { WelcomeSlides } from '../components/onboarding/WelcomeSlides';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MainApp } from './MainApp';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthState } from '../store/slices/authSlice';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, onboardingCompleted } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderInitialScreen = () => {
    if (!onboardingCompleted) {
      return <Stack.Screen name="Welcome" component={WelcomeSlides} />;
    }
    if (!isAuthenticated) {
      return (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      );
    }

    return <Stack.Screen name="MainApp" component={MainApp} />;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderInitialScreen()}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
