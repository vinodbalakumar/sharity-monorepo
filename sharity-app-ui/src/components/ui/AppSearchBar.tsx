import type { NativeSyntheticEvent, StyleProp, TextInputSubmitEditingEventData, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';

type AppSearchBarProps = {
  onChangeText: (value: string) => void;
  onSubmitEditing?: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  value: string;
};

export function AppSearchBar({ onChangeText, onSubmitEditing, placeholder, style, value }: AppSearchBarProps) {
  return <Searchbar onChangeText={onChangeText} onSubmitEditing={onSubmitEditing} placeholder={placeholder} style={style} value={value} />;
}
