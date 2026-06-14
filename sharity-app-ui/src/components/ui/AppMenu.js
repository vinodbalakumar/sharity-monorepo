import { Menu } from 'react-native-paper';
export function AppMenu({ anchor, children, onDismiss, visible }) {
    return (<Menu anchor={anchor} onDismiss={onDismiss} visible={visible}>
      {children}
    </Menu>);
}
