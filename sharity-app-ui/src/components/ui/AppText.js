import { Text as RNText } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
const colorMap = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.mutedText,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    inherit: 'inherit'
};
const weightMap = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
};
export function AppText({ children, variant = 'body', color = 'primary', weight, align, numberOfLines, selectable, style }) {
    const typographyStyle = typography[variant];
    const selectedColor = color === 'inherit' ? 'inherit' : colorMap[color];
    return (<RNText numberOfLines={numberOfLines} selectable={selectable} style={[
            {
                fontSize: typographyStyle.fontSize,
                fontWeight: weight ? weightMap[weight] : typographyStyle.fontWeight,
                lineHeight: typographyStyle.lineHeight,
                letterSpacing: typographyStyle.letterSpacing ?? 0,
                color: selectedColor,
                textAlign: align
            },
            style
        ]}>
      {children}
    </RNText>);
}
