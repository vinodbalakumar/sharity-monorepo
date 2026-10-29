import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { MarketplaceListing } from '../../types/marketplace';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import { ProductArtwork } from './ProductArtwork';
import { formatListingPrice, listingLabel } from '../../utils/listingPresentation';
import { getAverageRating } from '../../utils/marketplaceUtils';

export function ListingCard({ item, onPress, style, testID = 'product-card', variant = 'default' }: {
  item: MarketplaceListing; onPress: () => void; style?: StyleProp<ViewStyle>; testID?: string; variant?: 'default' | 'catalog';
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const original = item.displayOriginalPriceAmount ?? item.originalPriceAmount;
  const amount = item.displayPriceAmount ?? item.priceAmount;
  const discounted = original != null && original > amount && amount >= 0;
  const discountPercent = discounted ? Math.floor((original - amount) / original * 100) : 0;
  const sold = item.listingStatus === 'SOLD' || item.stockQuantity === 0;
  const catalog = variant === 'catalog';
  const rating = catalog ? getAverageRating(item) : 0;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={onPress}
    onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.card, catalog && styles.catalogCard, style, hovered && styles.hover, focused && styles.focus, pressed && { opacity: .85 }]}>
    <View style={styles.visual}><ProductArtwork item={item} style={catalog ? styles.catalogArtwork : undefined} />
      {!catalog && !sold && discountPercent > 0 && <View style={styles.dealBadge}><Text style={styles.dealText}>{discountPercent}% off</Text></View>}
    </View>
    <View style={[styles.copy, catalog && styles.catalogCopy]}>
      <Text numberOfLines={1} style={styles.category}>{listingLabel(item.categoryCode)}</Text>
      <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
      {catalog && !!item.description && <Text numberOfLines={2} style={styles.description}>{item.description}</Text>}
      {catalog && rating > 0 && <View style={styles.ratingRow}>
        <View style={styles.ratingBadge}><Text style={styles.ratingText}>{rating.toFixed(1)}</Text><Ionicons name="star" size={11} color={colors.white} /></View>
        <Text style={styles.category}>({item.publicReviews.length} {item.publicReviews.length === 1 ? 'review' : 'reviews'})</Text>
      </View>}
      <View style={styles.prices}><Text style={[styles.price, catalog && styles.catalogPrice]}>{formatListingPrice(item)}</Text>
        {discounted && <Text style={styles.original}>{formatListingPrice(item, original)}</Text>}
        {catalog && !sold && discountPercent > 0 && <Text style={styles.savings}>{discountPercent}% off</Text>}
      </View>
      <View style={styles.sellerRow}><Ionicons name={item.verifiedSeller ? 'shield-checkmark-outline' : 'storefront-outline'} size={13} color={colors.textSecondary} />
        <Text numberOfLines={1} style={styles.seller}>{item.sellerDisplayName || 'Marketplace seller'}</Text></View>
      <Text style={[styles.delivery, sold && { color: colors.error }]}>{sold ? 'Currently unavailable' : listingLabel(item.deliveryType || 'See listing details')}</Text>
    </View>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { minWidth: 0, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  catalogCard: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  catalogArtwork: { aspectRatio: 1, backgroundColor: colors.surface },
  catalogCopy: { padding: 12, flex: 1 },
  catalogPrice: { fontSize: 18, lineHeight: 25 },
  description: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.successDark },
  ratingText: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.white },
  savings: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, fontWeight: '600', color: colors.successDark },
  hover: { borderColor: colors.primary, boxShadow: '0px 4px 16px rgba(23,35,55,0.08)' },
  focus: { borderColor: colors.primary, outlineColor: colors.primary, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' },
  visual: { position: 'relative' },
  dealBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 6, backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4 },
  dealText: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.primaryDark },
  copy: { padding: 14, gap: 7 }, category: { fontFamily: systemFontFamily, fontSize: 11, lineHeight: 16, color: colors.textSecondary },
  title: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 21, fontWeight: '600', color: colors.textPrimary, minHeight: 42 },
  prices: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  price: { fontFamily: systemFontFamily, fontSize: 21, lineHeight: 28, fontWeight: '700', color: colors.textPrimary },
  original: { fontFamily: systemFontFamily, fontSize: 12, color: colors.textSecondary, textDecorationLine: 'line-through' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, seller: { flex: 1, fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  delivery: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.primary },
});
