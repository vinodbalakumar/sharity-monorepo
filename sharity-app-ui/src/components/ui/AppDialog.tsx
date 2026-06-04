import type { ReactNode } from 'react';
import { Dialog, Portal } from 'react-native-paper';

type AppDialogProps = {
  children: ReactNode;
  onDismiss: () => void;
  title: string;
  visible: boolean;
};

export function AppDialog({ children, onDismiss, title, visible }: AppDialogProps) {
  return (
    <Portal>
      <Dialog onDismiss={onDismiss} visible={visible}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>{children}</Dialog.Content>
      </Dialog>
    </Portal>
  );
}
