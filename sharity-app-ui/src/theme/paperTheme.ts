import { configureFonts, MD3LightTheme } from 'react-native-paper';
import { systemFontFamily } from './typography';

import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 2,
  fonts: configureFonts({ config: { fontFamily: systemFontFamily } }),
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
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.primaryDark,
    secondaryContainer: colors.primaryLight,
    onSecondaryContainer: colors.textPrimary,
    surfaceTint: colors.primary,
    secondary: colors.secondary,
    surface: colors.surface,
    surfaceDisabled: colors.surfaceVariant,
    surfaceVariant: colors.surfaceVariant,
    tertiary: colors.accent
  }
};
