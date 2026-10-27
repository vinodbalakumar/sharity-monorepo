import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { MarketplaceListing } from '../../types/marketplace';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import { ProductArtwork } from './ProductArtwork';
import { formatListingPrice, listingLabel } from '../../utils/listingPresentation';

export function ListingCard({ item, onPress, style, testID = 'product-card' }: {
  item: MarketplaceListing; onPress: () => void; style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const original = item.displayOriginalPriceAmount ?? item.originalPriceAmount;
  const amount = item.displayPriceAmount ?? item.priceAmount;
  const discounted = original != null && original > amount && amount >= 0;
  const sold = item.listingStatus === 'SOLD' || item.stockQuantity === 0;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={onPress}
    style={({ pressed }) => [styles.card, style, pressed && { opacity: .85 }]}>
    <View style={styles.visual}><ProductArtwork item={item} />
    </View>
    <View style={styles.copy}>
      <Text numberOfLines={1} style={styles.category}>{listingLabel(item.categoryCode)}</Text>
      <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
      <View style={styles.prices}><Text style={styles.price}>{formatListingPrice(item)}</Text>
        {discounted && <Text style={styles.original}>{formatListingPrice(item, original)}</Text>}
      </View>
      <View style={styles.sellerRow}><Ionicons name={item.verifiedSeller ? 'shield-checkmark-outline' : 'storefront-outline'} size={13} color={colors.textSecondary} />
        <Text numberOfLines={1} style={styles.seller}>{item.sellerDisplayName || 'Marketplace seller'}</Text></View>
      <Text style={[styles.delivery, sold && { color: colors.error }]}>{sold ? 'Currently unavailable' : listingLabel(item.deliveryType || 'See listing details')}</Text>
    </View>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { minWidth: 0, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  hover: { borderColor: '#a8bfee', boxShadow: '0px 4px 16px rgba(23,35,55,0.08)' },
  visual: { position: 'relative' },
  copy: { padding: 14, gap: 7 }, category: { fontFamily: systemFontFamily, fontSize: 11, lineHeight: 16, color: colors.textSecondary },
  title: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 21, fontWeight: '600', color: colors.textPrimary, minHeight: 42 },
  prices: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  price: { fontFamily: systemFontFamily, fontSize: 21, lineHeight: 28, fontWeight: '700', color: colors.textPrimary },
  original: { fontFamily: systemFontFamily, fontSize: 12, color: colors.textSecondary, textDecorationLine: 'line-through' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, seller: { flex: 1, fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  delivery: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.primary },
});
