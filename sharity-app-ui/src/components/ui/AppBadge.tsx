import { StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';

type AppBadgeVariant =
  | 'active'
  | 'comingSoon'
  | 'condition'
  | 'deliveryType'
  | 'discount'
  | 'error'
  | 'info'
  | 'marketplace'
  | 'success'
  | 'verified'
  | 'warning';

type AppBadgeProps = {
  label: string;
  variant?: AppBadgeVariant;
};

export function AppBadge({ label, variant = 'info' }: AppBadgeProps) {
  const filled = ['active', 'discount', 'success', 'verified'].includes(variant);
  return <Text style={[styles.badge, filled ? styles.filled : styles.outlined]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.sm,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  filled: {
    backgroundColor: colors.black,
    color: colors.white
  },
  outlined: {
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.black
  }
});
