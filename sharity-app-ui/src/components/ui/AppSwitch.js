import { Switch } from 'react-native-paper';
export function AppSwitch({ onValueChange, value }) {
    return <Switch onValueChange={onValueChange} value={value}/>;
}
