import { ActivityIndicator, Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { typography } from '../../theme/typography';
import { AppText } from './AppText';
const variantStyles = {
    primary: {
        bg: colors.primary,
        bgHover: colors.primaryDark,
        bgPress: colors.primaryDark,
        bgDisabled: colors.disabledBg,
        text: colors.white,
        textDisabled: colors.disabled
    },
    secondary: {
        bg: colors.secondary,
        bgHover: colors.secondaryDark,
        bgPress: colors.secondaryDark,
        bgDisabled: colors.disabledBg,
        text: colors.white,
        textDisabled: colors.disabled
    },
    tertiary: {
        bg: colors.tertiary,
        bgHover: colors.tertiaryDark,
        bgPress: colors.tertiaryDark,
        bgDisabled: colors.disabledBg,
        text: colors.white,
        textDisabled: colors.disabled
    },
    danger: {
        bg: colors.error,
        bgHover: colors.errorDark,
        bgPress: colors.errorDark,
        bgDisabled: colors.disabledBg,
        text: colors.white,
        textDisabled: colors.disabled
    },
    success: {
        bg: colors.success,
        bgHover: colors.successDark,
        bgPress: colors.successDark,
        bgDisabled: colors.disabledBg,
        text: colors.white,
        textDisabled: colors.disabled
    },
    ghost: {
        bg: 'transparent',
        bgHover: colors.gray100,
        bgPress: colors.gray200,
        bgDisabled: 'transparent',
        text: colors.textPrimary,
        textDisabled: colors.disabled
    },
    outline: {
        bg: colors.white,
        bgHover: colors.gray50,
        bgPress: colors.gray100,
        bgDisabled: colors.disabledBg,
        text: colors.textPrimary,
        textDisabled: colors.disabled,
        border: colors.border
    }
};
const sizeStyles = {
    small: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        minHeight: 32
    },
    medium: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 40
    },
    large: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        minHeight: 48
    },
    fullWidth: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
        width: '100%'
    }
};
export function AppButton({ children, variant = 'primary', size = 'medium', disabled = false, loading = false, icon, iconPosition = 'left', onPress, style }) {
    const styles = variantStyles[variant];
    const sizeStyle = sizeStyles[size === 'fullWidth' ? size : size];
    return (<Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [
            {
                backgroundColor: disabled ? styles.bgDisabled : pressed ? styles.bgPress : styles.bgHover ?? styles.bg,
                borderRadius: radius.lg,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.sm,
                ...sizeStyle,
                ...(variant === 'outline' && { borderWidth: 1, borderColor: styles.border ?? colors.border })
            },
            style
        ]}>
      {loading && <ActivityIndicator color={disabled ? styles.textDisabled : styles.text} size="small"/>}
      {!loading && icon && iconPosition === 'left' && icon}
      <AppText color="inherit" style={{
            color: disabled ? styles.textDisabled : styles.text,
            fontWeight: '600',
            fontSize: typography.button.fontSize
        }}>
        {children}
      </AppText>
      {!loading && icon && iconPosition === 'right' && icon}
    </Pressable>);
}
