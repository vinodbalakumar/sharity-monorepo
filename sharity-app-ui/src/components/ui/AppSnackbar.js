import { Snackbar } from 'react-native-paper';
export function AppSnackbar({ message, onDismiss, visible }) {
    return (<Snackbar onDismiss={onDismiss} visible={visible}>
      {message}
    </Snackbar>);
}
