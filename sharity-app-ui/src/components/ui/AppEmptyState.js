import { View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { Column } from './Layout';
const iconMap = {
    notFound: 'magnify-close',
    noResults: 'text-search',
    noConnection: 'wifi-off',
    noPermission: 'lock-outline',
    error: 'alert-circle-outline'
};
export function AppEmptyState({ type = 'notFound', icon, title, description, action, style }) {
    return (<Column align="center" justify="center" gap="md" style={[
            {
                paddingVertical: spacing['6xl'],
                paddingHorizontal: spacing.lg,
                minHeight: 300
            },
            style
        ]}>
      {icon ? (icon) : (<MaterialCommunityIcons name={iconMap[type]} size={64} color={colors.mutedText}/>)}

      <AppText variant="title" color="primary" align="center" style={{ marginTop: spacing.md }}>
        {title}
      </AppText>

      {description && (<AppText variant="bodySmall" color="secondary" align="center" style={{ marginBottom: spacing.md }}>
          {description}
        </AppText>)}

      {action && (<View style={{ marginTop: spacing.md }}/>)}
    </Column>);
}
export function AppLoadingState({ message = 'Loading...', size = 'large', color = colors.primary, style }) {
    const sizeMap = {
        small: 24,
        medium: 40,
        large: 60
    };
    return (<Column align="center" justify="center" gap="md" style={[
            {
                paddingVertical: spacing['6xl'],
                minHeight: 300
            },
            style
        ]}>
      <ActivityIndicator size={sizeMap[size]} color={color}/>
      {message && (<AppText variant="body" color="secondary">
          {message}
        </AppText>)}
    </Column>);
}
export function AppErrorState({ title = 'Something went wrong', message, action, style }) {
    return (<AppEmptyState type="error" title={title} description={message} action={action} style={style}/>);
}
