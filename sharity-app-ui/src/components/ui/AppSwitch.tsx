import { Switch } from 'react-native-paper';

type AppSwitchProps = {
  onValueChange: (value: boolean) => void;
  value: boolean;
};

export function AppSwitch({ onValueChange, value }: AppSwitchProps) {
  return <Switch onValueChange={onValueChange} value={value} />;
}
