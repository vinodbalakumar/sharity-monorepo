export const colors = {
  // One marketplace palette shared by navigation, forms and commerce.
  primary: '#2459d3',
  primaryLight: '#eaf0ff',
  primaryDark: '#1945ad',
  primaryContrast: '#ffffff',

  // Secondary accent (blue-tinted)
  secondary: '#2459d3',
  secondaryLight: '#eaf0ff',
  secondaryDark: '#1945ad',
  secondaryContrast: '#ffffff',

  // Tertiary (teal, for highlights)
  tertiary: '#14b8a6',
  tertiaryLight: '#5eead4',
  tertiaryDark: '#0f766e',
  tertiaryContrast: '#ffffff',

  // Success states (green)
  success: '#16a34a',
  successLight: '#86efac',
  successDark: '#15803d',
  successContrast: '#ffffff',

  // Warning states (amber)
  warning: '#f59e0b',
  warningLight: '#fcd34d',
  warningDark: '#d97706',
  warningContrast: '#000000',

  // Error/Danger states (red)
  error: '#dc2626',
  ruby: '#dc2626',
  errorLight: '#fca5a5',
  errorDark: '#991b1b',
  errorContrast: '#ffffff',

  // Info states (blue)
  info: '#2563eb',
  infoLight: '#93c5fd',
  infoDark: '#1e40af',
  infoContrast: '#ffffff',

  // Neutral grayscale
  gray50: '#f9fafb',
  gray100: '#eef2f7',
  gray200: '#dde4ee',
  gray300: '#c9d3e0',
  gray400: '#9aa8ba',
  gray500: '#6c7a8c',
  gray600: '#536174',
  gray700: '#364152',
  gray800: '#1f2937',
  gray900: '#152033',
  gray950: '#030712',

  // Semantic colors
  background: '#f3f5f8',
  surface: '#ffffff',
  surfaceVariant: '#edf2fc',
  surfaceHover: '#f8fafc',
  surfaceActive: '#e8f0ff',
  panel: '#ffffff',
  panelVariant: '#fbfcff',
  border: '#dfe5ef',
  borderLight: '#edf2f7',
  borderDark: '#bcc8d6',
  divider: '#d9e1ec',

  // Text colors
  textPrimary: '#172337',
  textSecondary: '#5f6f84',
  textMuted: '#637286',
  softText: '#5f6f84',
  mutedText: '#637286',

  // State colors
  disabled: '#94a3b8',
  disabledBg: '#f1f5f9',
  active: '#16a34a',
  comingSoon: '#f59e0b',

  // Special
  overlay: 'rgba(15,23,42,0.62)',
  overlayLight: 'rgba(15,23,42,0.30)',
  overlayDark: 'rgba(15,23,42,0.85)',

  // Semantic aliases
  accent: '#ffcf40',
  electric: '#38bdf8',
  ink: '#ffffff',
  midnight: '#111827',
  black: '#000000',
  white: '#ffffff'
};

export const marketingColors = {
  accent: colors.primary,
  accentSoft: colors.primaryLight,
  blue: colors.primary,
  border: '#dbe4ef',
  card: colors.surface,
  cardAlt: '#ffffff',
  danger: '#ef4444',
  header: colors.surface,
  heroEnd: colors.primaryLight,
  heroStart: colors.primaryLight,
  input: '#ffffff',
  page: colors.background,
  purple: colors.primary,
  purpleSoft: colors.primaryLight,
  success: '#246b45',
  text: colors.textPrimary,
  textMuted: '#64778c',
  white: colors.white
} as const;

export type AppColorName = keyof typeof colors;
