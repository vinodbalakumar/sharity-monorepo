import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
export function FeaturePreviewNotice() {
 return <View style={styles.notice} accessibilityRole="text"><Text style={styles.title}>Feature preview</Text>
  <Text style={styles.body}>This section uses sample data. Actions here do not update your account, payments or support requests.</Text></View>;
}
const styles = StyleSheet.create({ notice: { padding: 16, marginBottom: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.primaryLight },
 title: { fontFamily: systemFontFamily, fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 5 },
 body: { fontFamily: systemFontFamily, fontSize: 13, lineHeight: 21, color: colors.textSecondary } });
