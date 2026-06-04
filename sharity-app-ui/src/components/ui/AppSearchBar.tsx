import type { StyleProp, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';

type AppSearchBarProps = {
  onChangeText: (value: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  value: string;
};

export function AppSearchBar({ onChangeText, placeholder, style, value }: AppSearchBarProps) {
  return <Searchbar onChangeText={onChangeText} placeholder={placeholder} style={style} value={value} />;
}
