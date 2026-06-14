import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { authPalette, authSpacing } from './authTheme';
export function AuthOptionModal({ description, onClose, onSelect, options, title, visible }) {
    return (<Modal animationType="fade" transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons color={authPalette.text} name="close" size={20}/>
            </Pressable>
          </View>

          <FlatList data={options} keyExtractor={(item) => item.key} renderItem={({ item }) => (<Pressable onPress={() => onSelect(item)} style={styles.optionRow}>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  {item.subtitle ? <Text style={styles.optionSubtitle}>{item.subtitle}</Text> : null}
                </View>
                {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
              </Pressable>)} ItemSeparatorComponent={() => <View style={styles.separator}/>} showsVerticalScrollIndicator={false}/>
        </Pressable>
      </Pressable>
    </Modal>);
}
const styles = StyleSheet.create({
    overlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(5, 5, 18, 0.72)',
        flex: 1,
        justifyContent: 'center',
        padding: authSpacing.lg
    },
    sheet: {
        backgroundColor: authPalette.card,
        borderColor: authPalette.border,
        borderRadius: 24,
        borderWidth: 1,
        maxHeight: '82%',
        maxWidth: 560,
        padding: authSpacing.xl,
        width: '100%'
    },
    header: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: authSpacing.md,
        justifyContent: 'space-between',
        marginBottom: authSpacing.lg
    },
    headerCopy: {
        flex: 1,
        gap: authSpacing.xs
    },
    title: {
        color: authPalette.text,
        fontSize: 22,
        fontWeight: '900'
    },
    description: {
        color: authPalette.textMuted,
        fontSize: 14,
        lineHeight: 20
    },
    closeButton: {
        alignItems: 'center',
        backgroundColor: authPalette.input,
        borderRadius: 999,
        height: 36,
        justifyContent: 'center',
        width: 36
    },
    optionRow: {
        alignItems: 'center',
        backgroundColor: authPalette.cardAlt,
        borderRadius: 18,
        flexDirection: 'row',
        gap: authSpacing.md,
        justifyContent: 'space-between',
        minHeight: 64,
        paddingHorizontal: authSpacing.lg,
        paddingVertical: authSpacing.md
    },
    optionCopy: {
        flex: 1,
        gap: authSpacing.xs
    },
    optionTitle: {
        color: authPalette.text,
        fontSize: 16,
        fontWeight: '900'
    },
    optionSubtitle: {
        color: authPalette.textMuted,
        fontSize: 13,
        lineHeight: 18
    },
    badge: {
        color: authPalette.text,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0
    },
    separator: {
        height: authSpacing.sm
    }
});
