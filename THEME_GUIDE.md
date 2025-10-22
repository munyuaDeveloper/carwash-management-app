# Theme System Guide

This guide explains how to use the dark/light theme system in the CarWash Management App.

## Overview

The app now supports three theme modes:
- **Light**: Always use light theme
- **Dark**: Always use dark theme  
- **System**: Follow the device's system theme setting

## Theme Architecture

### 1. Theme Context (`src/contexts/ThemeContext.tsx`)
- Provides theme state and controls
- Manages theme persistence using AsyncStorage
- Automatically detects system theme changes

### 2. Theme Utilities (`src/utils/themeUtils.ts`)
- Pre-built style combinations for common UI elements
- Helper functions for creating theme-aware styles
- Utility functions for conditional styling

### 3. Tailwind Configuration (`tailwind.config.js`)
- Extended with custom theme colors
- Supports both light and dark color variants
- Custom shadow configurations for different themes

## Usage Examples

### Basic Theme Usage

```tsx
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';

const MyComponent = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const themeStyles = useThemeStyles();

  return (
    <View style={themeStyles.container}>
      <Text style={themeStyles.text}>Hello World</Text>
    </View>
  );
};
```

### Theme-Aware Styling

```tsx
// Using theme colors directly
<View style={{ backgroundColor: theme.surface }}>
  <Text style={{ color: theme.text }}>Content</Text>
</View>

// Using pre-built style combinations
<View style={themeStyles.card}>
  <Text style={themeStyles.text}>Card content</Text>
</View>

// Conditional styling based on theme
<View style={[
  { padding: 16 },
  isDark && { backgroundColor: theme.surfaceSecondary }
]}>
  <Text style={themeStyles.text}>Conditional styling</Text>
</View>
```

### Theme Toggle Implementation

```tsx
import { Switch } from 'react-native';

const ThemeToggle = () => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <Switch
      value={isDark}
      onValueChange={toggleTheme}
      trackColor={{ false: theme.border, true: theme.primary }}
      thumbColor={isDark ? theme.primaryLight : theme.surface}
    />
  );
};
```

## Available Theme Colors

### Background Colors
- `theme.background` - Main background color
- `theme.surface` - Card/surface background
- `theme.surfaceSecondary` - Secondary surface
- `theme.surfaceTertiary` - Tertiary surface

### Text Colors
- `theme.text` - Primary text color
- `theme.textSecondary` - Secondary text color
- `theme.textTertiary` - Tertiary text color
- `theme.textInverse` - Inverse text color

### Primary Colors
- `theme.primary` - Primary brand color
- `theme.primaryLight` - Light variant
- `theme.primaryDark` - Dark variant

### Status Colors
- `theme.success` - Success color
- `theme.warning` - Warning color
- `theme.error` - Error color
- `theme.info` - Info color

### UI Colors
- `theme.border` - Border color
- `theme.card` - Card background
- `theme.input` - Input background
- `theme.buttonPrimary` - Primary button
- `theme.tabActive` - Active tab color
- `theme.tabInactive` - Inactive tab color

## Pre-built Style Combinations

### Container Styles
```tsx
themeStyles.container    // Main container
themeStyles.surface     // Surface container
themeStyles.card        // Card with shadow
```

### Text Styles
```tsx
themeStyles.text         // Primary text
themeStyles.textSecondary // Secondary text
themeStyles.textTertiary  // Tertiary text
```

### Button Styles
```tsx
themeStyles.buttonPrimary     // Primary button
themeStyles.buttonPrimaryText // Primary button text
themeStyles.buttonSecondary   // Secondary button
themeStyles.buttonSecondaryText // Secondary button text
```

### Input Styles
```tsx
themeStyles.input        // Input field
themeStyles.inputFocused // Focused input
```

## Theme Mode Management

### Getting Current Theme Mode
```tsx
const { themeMode, isDark } = useTheme();

// themeMode can be: 'light' | 'dark' | 'system'
// isDark is a boolean indicating if dark theme is active
```

### Changing Theme Mode
```tsx
const { setThemeMode, toggleTheme } = useTheme();

// Set specific mode
setThemeMode('dark');
setThemeMode('light');
setThemeMode('system');

// Toggle between light and dark (ignores system)
toggleTheme();
```

## Best Practices

### 1. Use Pre-built Styles
Prefer `themeStyles` over manual styling when possible:
```tsx
// ✅ Good
<View style={themeStyles.card}>
  <Text style={themeStyles.text}>Content</Text>
</View>

// ❌ Avoid
<View style={{ backgroundColor: theme.surface, padding: 16 }}>
  <Text style={{ color: theme.text }}>Content</Text>
</View>
```

### 2. Conditional Styling
Use theme-aware conditional styling:
```tsx
// ✅ Good
<View style={[
  { padding: 16 },
  isDark && { backgroundColor: theme.surfaceSecondary }
]}>

// ❌ Avoid
<View style={{ 
  padding: 16,
  backgroundColor: isDark ? '#1e293b' : '#ffffff'
]}>
```

### 3. Icon Colors
Always use theme colors for icons:
```tsx
// ✅ Good
<Icon name="home" color={theme.text} size={24} />

// ❌ Avoid
<Icon name="home" color="#000000" size={24} />
```

### 4. Status Bar
Use the ThemeAwareStatusBar component:
```tsx
import { ThemeAwareStatusBar } from './src/components/ThemeAwareStatusBar';

// This automatically adjusts based on theme
<ThemeAwareStatusBar />
```

## Migration Guide

### Converting Existing Components

1. **Add theme imports**:
```tsx
import { useTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../utils/themeUtils';
```

2. **Replace hardcoded colors**:
```tsx
// Before
<View style={{ backgroundColor: '#ffffff' }}>
  <Text style={{ color: '#000000' }}>Text</Text>
</View>

// After
<View style={themeStyles.surface}>
  <Text style={themeStyles.text}>Text</Text>
</View>
```

3. **Update className to style props**:
```tsx
// Before
<View className="bg-white text-gray-900">

// After
<View style={[themeStyles.surface, themeStyles.text]}>
```

## Testing Theme Changes

1. **Toggle theme in Profile screen** - Use the dark mode toggle
2. **Test system theme** - Change device theme in settings
3. **Verify persistence** - Restart app to ensure theme is saved
4. **Check all screens** - Navigate through all screens to ensure consistency

## Troubleshooting

### Common Issues

1. **Theme not updating**: Ensure ThemeProvider wraps your app
2. **Colors not changing**: Check if you're using hardcoded colors instead of theme colors
3. **Status bar not updating**: Use ThemeAwareStatusBar component
4. **Tab colors not updating**: Update tab navigator to use theme colors

### Debug Theme
```tsx
const { theme, isDark, themeMode } = useTheme();
console.log('Current theme:', { theme, isDark, themeMode });
```

## Future Enhancements

- Custom theme colors per user
- Theme preview mode
- Accessibility improvements
- Animation support for theme transitions
