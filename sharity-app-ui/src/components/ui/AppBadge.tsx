import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { AppText } from './AppText';

type AppBadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
type AppBadgeSize = 'small' | 'medium';

type AppBadgeProps = {
  children: ReactNode;
  variant?: AppBadgeVariant;
  size?: AppBadgeSize;
  icon?: ReactNode;
  style?: any;
};

const variantStyles = {
  primary: {
    backgroundColor: colors.primary + '20',
    color: colors.primary
  },
  secondary: {
    backgroundColor: colors.secondary + '20',
    color: colors.secondary
  },
  success: {
    backgroundColor: colors.success + '20',
    color: colors.success
  },
  warning: {
    backgroundColor: colors.warning + '20',
    color: colors.warning
  },
  error: {
    backgroundColor: colors.error + '20',
    color: colors.error
  },
  info: {
    backgroundColor: colors.info + '20',
    color: colors.info
  },
  default: {
    backgroundColor: colors.gray200,
    color: colors.gray700
  }
};

const sizeStyles = {
  small: {
    paddingVertical: spacing['0.5'],
    paddingHorizontal: spacing.sm,
    fontSize: 11
  },
  medium: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    fontSize: 12
  }
};

export function AppBadge({
  children,
  variant = 'default',
  size = 'small',
  icon,
  style
}: AppBadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: radius.full,
          backgroundColor: variantStyle.backgroundColor,
          alignSelf: 'flex-start'
        },
        style
      ]}
    >
      {icon && icon}
      <AppText
        variant="badge"
        color="inherit"
        style={{ color: variantStyle.color, fontSize: sizeStyle.fontSize }}
      >
        {children}
      </AppText>
    </View>
  );
}
