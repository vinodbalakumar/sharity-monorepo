import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';

type AppButtonVariant = 'danger' | 'disabled' | 'ghost' | 'outline' | 'primary' | 'secondary' | 'success' | 'warning';
type AppButtonSize = 'fullWidth' | 'large' | 'medium' | 'small';

type AppButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  icon?: string;
  onPress?: () => void;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  variant?: AppButtonVariant;
};

export function AppButton({ children, disabled, icon, onPress, size = 'medium', style, variant = 'primary' }: AppButtonProps) {
  const mode = variant === 'ghost' ? 'text' : variant === 'outline' ? 'outlined' : 'contained';

  return (
    <Button
      disabled={disabled || variant === 'disabled'}
      icon={icon}
      mode={mode}
      onPress={onPress}
      style={[size === 'fullWidth' && { width: '100%' }, style]}
    >
      {children}
    </Button>
  );
}
