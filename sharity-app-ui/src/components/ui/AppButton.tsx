import type { ReactNode } from "react";
import { Button } from "react-native-paper";
import { systemFontFamily } from "../../theme/typography";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type AppButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "success"
  | "ghost"
  | "outline";
type AppButtonSize = "small" | "medium" | "large" | "fullWidth";

type AppButtonProps = {
  children: ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  onPress?: () => void;
  style?: any;
};

const variantStyles: Record<AppButtonVariant, any> = {
  primary: {
    bg: colors.primary,
    bgHover: colors.primaryDark,
    bgPress: colors.primaryDark,
    bgDisabled: colors.disabledBg,
    text: colors.white,
    textDisabled: colors.disabled,
  },
  secondary: {
    bg: colors.secondary,
    bgHover: colors.secondaryDark,
    bgPress: colors.secondaryDark,
    bgDisabled: colors.disabledBg,
    text: colors.white,
    textDisabled: colors.disabled,
  },
  tertiary: {
    bg: colors.tertiary,
    bgHover: colors.tertiaryDark,
    bgPress: colors.tertiaryDark,
    bgDisabled: colors.disabledBg,
    text: colors.white,
    textDisabled: colors.disabled,
  },
  danger: {
    bg: colors.error,
    bgHover: colors.errorDark,
    bgPress: colors.errorDark,
    bgDisabled: colors.disabledBg,
    text: colors.white,
    textDisabled: colors.disabled,
  },
  success: {
    bg: colors.success,
    bgHover: colors.successDark,
    bgPress: colors.successDark,
    bgDisabled: colors.disabledBg,
    text: colors.white,
    textDisabled: colors.disabled,
  },
  ghost: {
    bg: "transparent",
    bgHover: colors.gray100,
    bgPress: colors.gray200,
    bgDisabled: "transparent",
    text: colors.textPrimary,
    textDisabled: colors.disabled,
  },
  outline: {
    bg: colors.white,
    bgHover: colors.gray50,
    bgPress: colors.gray100,
    bgDisabled: colors.disabledBg,
    text: colors.textPrimary,
    textDisabled: colors.disabled,
    border: colors.border,
  },
};

const sizeStyles = {
  small: {paddingHorizontal:8,minHeight:44},
  medium: {paddingHorizontal:12,minHeight:48},
  large: {paddingHorizontal:16,minHeight:52},
  fullWidth: {paddingHorizontal:12,minHeight:48,width:'100%'}
};

export function AppButton({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  onPress,
  style,
}: AppButtonProps) {
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Button
      mode={
        variant === "outline"
          ? "outlined"
          : variant === "ghost"
            ? "text"
            : "contained"
      }
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      buttonColor={styles.bg}
      textColor={styles.text}
      icon={icon ? () => <>{icon}</> : undefined}
      style={[
        { borderRadius: 8, borderColor: styles.border ?? colors.border },
        style,
      ]}
      contentStyle={[
        sizeStyle,
        { flexDirection: iconPosition === "right" ? "row-reverse" : "row" },
      ]}
      labelStyle={{
        fontFamily: systemFontFamily,
        fontSize: typography.button.fontSize,
        fontWeight: "600",
      }}
    >
      {children}
    </Button>
  );
}
