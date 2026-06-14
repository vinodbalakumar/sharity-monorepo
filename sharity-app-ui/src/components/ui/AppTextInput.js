import { TextInput as RNTextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { AppText } from './AppText';
const sizeStyles = {
    small: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: 12,
        minHeight: 32
    },
    medium: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        fontSize: 14,
        minHeight: 40
    },
    large: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        minHeight: 48
    }
};
const statusStyles = {
    default: {
        borderColor: colors.border,
        backgroundColor: colors.surface
    },
    error: {
        borderColor: colors.error,
        backgroundColor: colors.errorLight + '15'
    },
    success: {
        borderColor: colors.success,
        backgroundColor: colors.successLight + '15'
    },
    warning: {
        borderColor: colors.warning,
        backgroundColor: colors.warningLight + '15'
    }
};
export function AppTextInput({ label, placeholder, value, onChangeText, disabled = false, size = 'medium', status = 'default', errorMessage, helperText, icon, iconPosition = 'left', multiline = false, numberOfLines, style }) {
    const sizeStyle = sizeStyles[size];
    const statusStyle = statusStyles[status];
    return (<View style={style}>
      {label && (<AppText variant="label" color="primary" style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>)}

      <View style={{
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            borderRadius: radius.md,
            borderWidth: 1,
            ...statusStyle,
            backgroundColor: disabled ? colors.disabledBg : statusStyle.backgroundColor
        }}>
        {icon && iconPosition === 'left' && (<View style={{ paddingLeft: spacing.md, paddingRight: spacing.sm }}>
            {icon}
          </View>)}

        <RNTextInput style={[
            {
                flex: 1,
                color: disabled ? colors.disabled : colors.textPrimary,
                ...sizeStyle
            }
        ]} placeholder={placeholder} placeholderTextColor={colors.mutedText} value={value} onChangeText={onChangeText} multiline={multiline} numberOfLines={numberOfLines} editable={!disabled}/>

        {icon && iconPosition === 'right' && (<View style={{ paddingRight: spacing.md, paddingLeft: spacing.sm }}>
            {icon}
          </View>)}
      </View>

      {helperText && !errorMessage && (<AppText variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
          {helperText}
        </AppText>)}

      {errorMessage && status === 'error' && (<AppText variant="caption" color="error" style={{ marginTop: spacing.xs }}>
          {errorMessage}
        </AppText>)}
    </View>);
}
