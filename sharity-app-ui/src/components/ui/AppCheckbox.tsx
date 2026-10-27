import { Pressable, StyleSheet, View } from 'react-native';

type AppCheckboxProps = {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function AppCheckbox({ checked, onPress, accessibilityLabel }: AppCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={checked}
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel ?? (checked ? 'Uncheck option' : 'Check option')}
      onPress={onPress}
      style={({ pressed }) => [styles.target, pressed && styles.boxPressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>{checked ? <View style={styles.checkMark} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C9D3E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  boxChecked: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75'
  },
  boxPressed: {
    opacity: 0.82
  },
  checkMark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -1
  }
});
