import { Snackbar } from 'react-native-paper';

type AppSnackbarProps = {
  message: string;
  onDismiss: () => void;
  visible: boolean;
};

export function AppSnackbar({ message, onDismiss, visible }: AppSnackbarProps) {
  return (
    <Snackbar onDismiss={onDismiss} visible={visible}>
      {message}
    </Snackbar>
  );
}
