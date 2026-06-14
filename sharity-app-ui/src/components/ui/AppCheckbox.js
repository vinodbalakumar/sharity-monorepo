import { Pressable, StyleSheet, View } from 'react-native';
export function AppCheckbox({ checked, onPress }) {
    return (<Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={checked ? 'Uncheck option' : 'Check option'} onPress={onPress} style={({ pressed }) => [styles.box, checked && styles.boxChecked, pressed && styles.boxPressed]}>
      {checked ? <View style={styles.checkMark}/> : null}
    </Pressable>);
}
const styles = StyleSheet.create({
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
