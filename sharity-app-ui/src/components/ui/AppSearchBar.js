import { Searchbar } from 'react-native-paper';
export function AppSearchBar({ onChangeText, onSubmitEditing, placeholder, style, value }) {
    return <Searchbar onChangeText={onChangeText} onSubmitEditing={onSubmitEditing} placeholder={placeholder} style={style} value={value}/>;
}
