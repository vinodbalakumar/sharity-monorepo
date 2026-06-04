import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

type AppCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, onPress, style }: AppCardProps) {
  return (
    <Card mode="outlined" onPress={onPress} style={style}>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
