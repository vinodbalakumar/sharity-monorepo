import type { ReactNode } from 'react';
import { Chip } from 'react-native-paper';

type AppChipProps = {
  children: ReactNode;
  onPress?: () => void;
  selected?: boolean;
};

export function AppChip({ children, onPress, selected }: AppChipProps) {
  return (
    <Chip mode={selected ? 'flat' : 'outlined'} onPress={onPress} selected={selected}>
      {children}
    </Chip>
  );
}
