import { MD3LightTheme } from 'react-native-paper';

import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: colors.background,
    error: colors.error,
    onBackground: colors.textPrimary,
    onError: colors.white,
    onPrimary: colors.white,
    onSecondary: colors.white,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.surface,
    surfaceDisabled: colors.surfaceVariant,
    surfaceVariant: colors.surfaceVariant,
    tertiary: colors.accent
  }
};
