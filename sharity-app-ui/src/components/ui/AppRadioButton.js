import { RadioButton } from 'react-native-paper';
export function AppRadioButton({ onPress, selected, value }) {
    return <RadioButton onPress={onPress} status={selected ? 'checked' : 'unchecked'} value={value}/>;
}
