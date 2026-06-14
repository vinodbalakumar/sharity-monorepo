import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../theme';
export function AppLoadingIndicator({ style }) {
    return <ActivityIndicator color={colors.primary} style={style}/>;
}
