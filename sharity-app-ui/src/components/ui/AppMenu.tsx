import type { ReactNode } from 'react';
import { Menu } from 'react-native-paper';

type AppMenuProps = {
  anchor: ReactNode;
  children: ReactNode;
  onDismiss: () => void;
  visible: boolean;
};

export function AppMenu({ anchor, children, onDismiss, visible }: AppMenuProps) {
  return (
    <Menu anchor={anchor} onDismiss={onDismiss} visible={visible}>
      {children}
    </Menu>
  );
}
