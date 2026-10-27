import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

type AppCardVariant = 'elevated' | 'outlined' | 'filled';
type AppCardPadding = 'none' | 'small' | 'medium' | 'large';

type AppCardProps = {
  children: ReactNode;
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  onPress?: () => void;
  style?: any;
};

const paddingMap = {
  none: 0,
  small: spacing.sm,
  medium: spacing.md,
  large: spacing.lg
};

const variantStyles = {
  elevated: {
    backgroundColor: colors.surface,
    borderColor: 'transparent',
    ...shadows.md
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  filled: {
    backgroundColor: colors.surfaceVariant,
    borderColor: 'transparent'
  }
};

export function AppCard({
  children,
  variant = 'elevated',
  padding = 'medium',
  onPress,
  style
}: AppCardProps) {
  const variantStyle = variantStyles[variant];
  const paddingValue = paddingMap[padding];

  return (
    <View
      style={[
        {
          borderRadius: radius.large,
          overflow: 'hidden',
          ...variantStyle,
          padding: paddingValue
        },
        onPress && { opacity: 1 },
        style
      ]}
    >
      {children}
    </View>
  );
}
