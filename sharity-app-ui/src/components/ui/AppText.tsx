import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type AppTextVariant = keyof typeof typography;
type AppTextColor = 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'warning' | 'info' | 'inherit';

type AppTextProps = {
  children: ReactNode;
  variant?: AppTextVariant;
  color?: AppTextColor;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  numberOfLines?: number;
  selectable?: boolean;
  style?: any;
};

const colorMap: Record<AppTextColor, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.mutedText,
  error: colors.error,
  success: colors.success,
  warning: colors.warning,
  info: colors.info,
  inherit: 'inherit'
};

const weightMap: Record<string, string> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
};

export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  align,
  numberOfLines,
  selectable,
  style
}: AppTextProps) {
  const typographyStyle = typography[variant];
  const selectedColor = color === 'inherit' ? 'inherit' : colorMap[color];

  return (
    <RNText
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        {
          fontSize: typographyStyle.fontSize,
          fontWeight: weight ? weightMap[weight] : typographyStyle.fontWeight,
          lineHeight: typographyStyle.lineHeight,
          letterSpacing: typographyStyle.letterSpacing ?? 0,
          color: selectedColor,
          textAlign: align
        },
        style
      ]}
    >
      {children}
    </RNText>
  );
}
