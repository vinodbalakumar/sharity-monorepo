export const colors = {
  // Primary brand colors (blue)
  primary: '#3f88c5',
  primaryLight: '#5fa3d5',
  primaryDark: '#2f78b5',
  primaryContrast: '#ffffff',

  // Secondary accent (blue-tinted)
  secondary: '#3f88c5',
  secondaryLight: '#5fa3d5',
  secondaryDark: '#2f78b5',
  secondaryContrast: '#ffffff',

  // Tertiary (cyan, for highlights)
  tertiary: '#06b6d4',
  tertiaryLight: '#22d3ee',
  tertiaryDark: '#0891b2',
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
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#334155',
  gray800: '#1f2937',
  gray900: '#111827',
  gray950: '#030712',

  // Semantic colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  surfaceHover: '#f0f9ff',
  surfaceActive: '#e0f2fe',
  panel: '#ffffff',
  panelVariant: '#f9fafb',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  divider: '#e2e8f0',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  softText: '#64748b',
  mutedText: '#94a3b8',

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
  accent: '#38bdf8',
  electric: '#38bdf8',
  ink: '#ffffff',
  midnight: '#111827',
  black: '#000000',
  white: '#ffffff'
};

export type AppColorName = keyof typeof colors;
