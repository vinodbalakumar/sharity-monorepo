import { Platform } from 'react-native';

export const systemFontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  ios: 'System',
  default: 'sans-serif'
});

export const typography = {
  // Display: Hero/Billboard text (40px, bold)
  display: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -0.8
  },

  // Hero: Large page titles (36px)
  hero: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
    letterSpacing: -0.6
  },

  // Page title: Section headers (28-32px)
  pageTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.4
  },

  // Section title: Subsection headers (24px)
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.2
  },

  // Card title: Card headers (18px, semi-bold)
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: 0
  },

  // Title: Smaller titles (16px, semi-bold)
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0
  },

  // Body: Regular text (14-16px)
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0
  },

  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: 0
  },

  // Button: Button text (14-16px, semi-bold)
  button: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.2
  },

  buttonLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.2
  },

  // Caption: Small text (12px)
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0
  },

  // Badge: Extra small text (11-12px, bold)
  badge: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0.4
  },

  // Label: Form labels (13px)
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.1
  },

  // Overline: All-caps helper text (11px)
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const
  }
};
