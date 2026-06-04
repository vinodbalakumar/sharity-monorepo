import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { colors } from '../../theme';

export function AppLoadingIndicator({ style }: { style?: StyleProp<ViewStyle> }) {
  return <ActivityIndicator color={colors.primary} style={style} />;
}
