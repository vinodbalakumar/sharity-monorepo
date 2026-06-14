import { Chip } from 'react-native-paper';
export function AppChip({ children, onPress, selected }) {
    return (<Chip mode={selected ? 'flat' : 'outlined'} onPress={onPress} selected={selected}>
      {children}
    </Chip>);
}
