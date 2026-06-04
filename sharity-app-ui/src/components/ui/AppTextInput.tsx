import type { StyleProp, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';

type AppTextInputProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
  value: string;
};

export function AppTextInput({ label, onChangeText, placeholder, secureTextEntry, style, value }: AppTextInputProps) {
  return (
    <TextInput
      label={label}
      mode="outlined"
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      style={style}
      value={value}
    />
  );
}
