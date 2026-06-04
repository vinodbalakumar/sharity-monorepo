import { RadioButton } from 'react-native-paper';

type AppRadioButtonProps = {
  onPress: () => void;
  selected: boolean;
  value: string;
};

export function AppRadioButton({ onPress, selected, value }: AppRadioButtonProps) {
  return <RadioButton onPress={onPress} status={selected ? 'checked' : 'unchecked'} value={value} />;
}
