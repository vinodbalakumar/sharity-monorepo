import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { AppSearchBar } from '../../components/ui';
import {
  electronicsCategories,
  electronicsConditionIcons,
  electronicsProducts,
  sortOptions,
  type ElectronicsProduct
} from './electronicsData';
import { colors, radii, spacing } from '../../theme';
import type { AppRoute } from '../../types/navigation';

type ElectronicsMarketplaceHomeScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenProduct: (productId: string) => void;
};

export function ElectronicsMarketplaceHomeScreen({ onNavigate, onOpenProduct }: ElectronicsMarketplaceHomeScreenProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState('Best Match');

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return electronicsProducts
      .filter((product) => (selectedCategory ? product.category === selectedCategory : true))
      .filter((product) => {
        if (!normalizedQuery) {
          return true;
        }
        return [product.title, product.brand, product.category, product.condition].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((left, right) => sortProducts(left, right, sort));
  }, [query, selectedCategory, sort]);

  return (
    <InteriorShell activeLabel="Marketplace" onNavigate={onNavigate} scrollable={false} subtitle="Buy and sell phones, laptops, tablets, gaming consoles, accessories, smart devices, used electronics, and refurbished products." title="Electronics">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Electronics & Gadgets</Text>
          <Text style={styles.heroText}>
            Buy and sell phones, laptops, tablets, gaming consoles, accessories, smart devices, used electronics,
            and refurbished products from trusted sellers.
          </Text>
          <Text style={styles.heroTrust}>Protected checkout. Verified sellers. Clear condition, shipping, warranty, and return details.</Text>
        </View>

        <View style={styles.searchRow}>
          <AppSearchBar onChangeText={setQuery} placeholder="Search electronics" style={styles.searchBox} value={query} />
          <Pressable style={styles.filterButton}>
            <Ionicons color={colors.black} name="options-outline" size={18} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </Pressable>
        </View>

        <View style={styles.safetyBanner}>
          <Ionicons color={colors.black} name="alert-circle-outline" size={24} />
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>Buy electronics safely</Text>
            <Text style={styles.safetyText}>
              For used, refurbished, open-box, and like-new electronics, check condition, warranty, return policy,
              seller rating, and product photos before purchase.
            </Text>
            <Text style={styles.linkText}>Learn More</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
          <View style={styles.categoryRow}>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={[styles.chip, selectedCategory === null && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>All</Text>
            </Pressable>
            {electronicsCategories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.chip, selectedCategory === category && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedCategory === category && styles.chipTextActive]}>{category}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.sortRow}>
          <Text style={styles.sectionTitle}>Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <Pressable key={option} onPress={() => setSort(option)} style={[styles.sortChip, sort === option && styles.chipActive]}>
                  <Text style={[styles.chipText, sort === option && styles.chipTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{selectedCategory ? 'No electronics available in this category yet.' : 'No electronics found.'}</Text>
            <Pressable
              onPress={() => {
                setSelectedCategory(null);
                setQuery('');
              }}
            >
              <Text style={styles.linkText}>{selectedCategory ? 'Explore Other Categories' : 'Clear Filters'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ElectronicsProductCard key={product.id} onOpenProduct={onOpenProduct} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </InteriorShell>
  );
}

function ElectronicsProductCard({ onOpenProduct, product }: { onOpenProduct: (productId: string) => void; product: ElectronicsProduct }) {
  const conditionIcon = electronicsConditionIcons[product.condition];
  const discount = product.discountLabel ?? calculateDiscount(product);

  return (
    <Pressable onPress={() => onOpenProduct(product.id)} style={styles.productCard}>
      <View style={styles.productImage}>
        <Ionicons color={colors.black} name="hardware-chip-outline" size={32} />
      </View>
      <View style={styles.productTopRow}>
        <Text style={styles.badge}>Electronics</Text>
        <Text style={styles.conditionBadge}>
          <Ionicons color={colors.black} name={conditionIcon} size={12} /> {product.condition}
        </Text>
      </View>
      <Text style={styles.productTitle}>{product.title}</Text>
      <Text style={styles.productMeta}>{product.brand} · {product.category}</Text>
      <View style={styles.priceRow}>
        {product.originalPrice ? <Text style={styles.originalPrice}>${product.originalPrice}</Text> : null}
        <Text style={styles.price}>${product.price}</Text>
        {discount ? <Text style={styles.discount}>{discount}</Text> : null}
      </View>
      <Text style={styles.productMeta}>{product.sellerName} · {product.sellerRating} rating · {product.location}</Text>
      <View style={styles.badgeGrid}>
        <Text style={styles.outlineBadge}>{product.shippingAvailable ? 'Shipping available' : 'Shipping unavailable'}</Text>
        <Text style={styles.outlineBadge}>{product.returnEligible ? 'Return eligible' : 'Seller policy'}</Text>
        <Text style={styles.outlineBadge}>{product.warrantyAvailable ? 'Warranty available' : 'No warranty'}</Text>
        <Text style={styles.outlineBadge}>Buyer protection</Text>
      </View>
      <Text style={styles.linkText}>View Product</Text>
    </Pressable>
  );
}

function calculateDiscount(product: ElectronicsProduct) {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return null;
  }
  return `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`;
}

function sortProducts(left: ElectronicsProduct, right: ElectronicsProduct, sort: string) {
  if (sort === 'Lowest Price') {
    return left.price - right.price;
  }
  if (sort === 'Highest Price') {
    return right.price - left.price;
  }
  if (sort === 'Top Rated') {
    return right.sellerRating - left.sellerRating;
  }
  if (sort === 'Highest Discount') {
    return discountAmount(right) - discountAmount(left);
  }
  if (sort === 'Warranty Available') {
    return Number(right.warrantyAvailable) - Number(left.warrantyAvailable);
  }
  return 0;
}

function discountAmount(product: ElectronicsProduct) {
  return product.originalPrice ? product.originalPrice - product.price : 0;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  shell: {
    backgroundColor: colors.white,
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: spacing.md,
    width: 236
  },
  sidebarBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: colors.black,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  logoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  sidebarTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  sidebarList: {
    gap: spacing.sm
  },
  sidebarItem: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  sidebarItemActive: {
    backgroundColor: colors.black
  },
  sidebarItemText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '800'
  },
  sidebarItemTextActive: {
    color: colors.white
  },
  filterSidebar: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    width: 250
  },
  filterTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  filterGroup: {
    gap: spacing.xs
  },
  filterGroupTitle: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900'
  },
  filterValue: {
    color: colors.black,
    fontSize: 13
  },
  main: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.xl
  },
  headerTitle: {
    color: colors.black,
    fontSize: 22,
    fontWeight: '900'
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing['6xl']
  },
  hero: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.xl
  },
  heroTitle: {
    color: colors.black,
    fontSize: 36,
    fontWeight: '900'
  },
  heroText: {
    color: colors.black,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 780
  },
  heroTrust: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.md
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  searchBox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    minWidth: 220,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    color: colors.black,
    flex: 1,
    fontSize: 15
  },
  filterButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  filterButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900'
  },
  safetyBanner: {
    alignItems: 'flex-start',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg
  },
  safetyCopy: {
    flex: 1
  },
  safetyTitle: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900'
  },
  safetyText: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs
  },
  categoryScroller: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.xl
  },
  chip: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipActive: {
    backgroundColor: colors.black
  },
  chipText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '800'
  },
  chipTextActive: {
    color: colors.white
  },
  sortRow: {
    gap: spacing.md
  },
  sortOptions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  sortChip: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 26,
    fontWeight: '900'
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  productCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 260,
    flexGrow: 1,
    padding: spacing.lg
  },
  productImage: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 110,
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  productTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  badge: {
    backgroundColor: colors.black,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  conditionBadge: {
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  productTitle: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md
  },
  productMeta: {
    color: colors.black,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  originalPrice: {
    color: colors.black,
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  price: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  discount: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900'
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md
  },
  outlineBadge: {
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.black,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  linkText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.md,
    textDecorationLine: 'underline'
  },
  emptyState: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  emptyTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '900'
  },
  bottomTabs: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm
  },
  bottomTab: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 58
  },
  bottomTabText: {
    color: colors.black,
    fontSize: 11,
    fontWeight: '700'
  },
  bottomTabTextActive: {
    fontWeight: '900'
  }
});
