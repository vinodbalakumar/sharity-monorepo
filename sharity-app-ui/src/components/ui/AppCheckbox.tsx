import { Checkbox } from 'react-native-paper';

type AppCheckboxProps = {
  checked: boolean;
  onPress: () => void;
};

export function AppCheckbox({ checked, onPress }: AppCheckboxProps) {
  return <Checkbox status={checked ? 'checked' : 'unchecked'} onPress={onPress} />;
}
