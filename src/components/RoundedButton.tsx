import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface RoundedButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'submit' | 'save' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const RoundedButton: React.FC<RoundedButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'submit',
  style,
  textStyle,
}) => {
  const { isDark, theme } = useTheme();

  // Purple gradient for submit/save
  const purpleGradient = isDark
    ? ['#6d28d9', '#7c3aed', '#a78bfa'] as const
    : ['#6d28d9', '#7c3aed', '#a78bfa'] as const;

  // Gray gradient for disabled state
  const grayGradient = isDark
    ? ['#374151', '#4b5563', '#6b7280'] as const
    : ['#9ca3af', '#d1d5db', '#e5e7eb'] as const;

  const isButtonDisabled = disabled || loading;
  const isOutlined = variant === 'outline';

  // For outlined variant, use transparent background with purple border
  if (isOutlined) {
    const purpleColor = isDark ? '#a78bfa' : '#7c3aed';
    const disabledPurpleColor = isDark ? '#6b7280' : '#9ca3af';

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isButtonDisabled}
        activeOpacity={0.8}
        style={[
          styles.buttonContainer,
          styles.outlinedButton,
          {
            borderColor: disabled ? disabledPurpleColor : purpleColor,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={purpleColor} />
        ) : (
          <Text style={[styles.outlinedButtonText, { color: disabled ? disabledPurpleColor : purpleColor }, textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // For filled variants (submit/save)
  const gradientColors = disabled ? grayGradient : purpleGradient;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
      style={[styles.buttonContainer, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    minHeight: 40,
  },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  outlinedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

