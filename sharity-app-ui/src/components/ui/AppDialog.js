import { Dialog, Portal } from 'react-native-paper';
export function AppDialog({ children, onDismiss, title, visible }) {
    return (<Portal>
      <Dialog onDismiss={onDismiss} visible={visible}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>{children}</Dialog.Content>
      </Dialog>
    </Portal>);
}
