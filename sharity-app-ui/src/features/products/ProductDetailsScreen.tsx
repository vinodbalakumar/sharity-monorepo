import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLoadingIndicator } from '../../components/ui';
import { electronicsProducts, type ElectronicsProduct } from '../electronics/electronicsData';
import { getMarketplaceListing, getMarketplaceListings } from '../../services/marketplaceApi';
import { colors, radii, spacing } from '../../theme';
import type { MarketplaceListing, MarketplaceReview } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

type ProductDetailsMode = 'digital' | 'electronics';
type ProductAction = 'cart' | 'contact' | 'purchase' | 'report' | 'share' | 'wishlist';

type ProductDetailsScreenProps = {
  mode: ProductDetailsMode;
  onNavigate: (route: AppRoute) => void;
  productId: string | null;
};

type UnifiedReview = {
  body: string;
  date: string;
  id: string;
  rating: number;
  reviewer: string;
  title: string;
  verified: boolean;
};

type UnifiedProduct = {
  availability: string;
  brand?: string;
  category: string;
  condition?: string;
  country: string;
  currencyCode: string;
  description: string;
  deliveryType: string;
  id: string;
  isDigital: boolean;
  licenseNote?: string | null;
  marketplaceName: string;
  originalPrice: number | null;
  price: number;
  productType: string;
  reviews: UnifiedReview[];
  sellerName: string;
  sellerRating: number | null;
  shippingAvailable?: boolean;
  title: string;
  verifiedSeller: boolean;
  warrantyAvailable?: boolean;
};

type LoadState = {
  error: boolean;
  loading: boolean;
  product: UnifiedProduct | null;
  related: UnifiedProduct[];
};

export function ProductDetailsScreen({ mode, onNavigate, productId }: ProductDetailsScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({
    error: false,
    loading: true,
    product: null,
    related: []
  });

  const loadProduct = useCallback(async () => {
    setState((current) => ({ ...current, error: false, loading: true }));

    try {
      if (mode === 'electronics') {
        const product = electronicsProducts.find((item) => item.id === productId) ?? electronicsProducts[0] ?? null;
        setState({
          error: !product,
          loading: false,
          product: product ? mapElectronicsProduct(product) : null,
          related: electronicsProducts
            .filter((item) => item.id !== product?.id)
            .filter((item) => (product ? item.category === product.category || item.brand === product.brand : true))
            .slice(0, 4)
            .map(mapElectronicsProduct)
        });
        return;
      }

      const allListings = await getMarketplaceListings();
      const fallbackListing = allListings.find(isDigitalListing) ?? allListings[0] ?? null;
      const selectedId = productId ?? fallbackListing?.publicId;
      const listing = selectedId ? await getMarketplaceListing(selectedId) : fallbackListing;

      setState({
        error: !listing,
        loading: false,
        product: listing ? mapDigitalListing(listing) : null,
        related: allListings
          .filter(isDigitalListing)
          .filter((item) => item.publicId !== listing?.publicId)
          .filter((item) => (listing ? item.categoryCode === listing.categoryCode || item.deliveryType === listing.deliveryType : true))
          .slice(0, 4)
          .map(mapDigitalListing)
      });
    } catch {
      setState({
        error: true,
        loading: false,
        product: null,
        related: []
      });
    }
  }, [mode, productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const averageRating = useMemo(() => {
    if (!state.product?.reviews.length) {
      return state.product?.sellerRating ?? null;
    }
    const total = state.product.reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / state.product.reviews.length) * 10) / 10;
  }, [state.product]);

  const handleAction = useCallback(
    async (action: ProductAction) => {
      if (action === 'share') {
        await Share.share({
          message: state.product ? `${state.product.title} on Sharity` : 'Product on Sharity'
        });
        return;
      }

      const messages: Record<Exclude<ProductAction, 'share'>, string> = {
        cart: 'Added to guest cart. Please sign in before checkout.',
        contact: 'Please sign in to contact the seller.',
        purchase: 'Please sign in to complete your purchase.',
        report: 'Please sign in to report this listing.',
        wishlist: 'Please sign in to add this product to your wishlist.'
      };

      setActionMessage(messages[action]);
    },
    [state.product]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back to marketplace" onPress={() => onNavigate(mode === 'electronics' ? 'electronics' : 'marketplaces')} style={styles.iconButton}>
          <Ionicons color={colors.black} name="chevron-back" size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Share product" onPress={() => handleAction('share')} style={styles.iconButton}>
            <Ionicons color={colors.black} name="share-outline" size={20} />
          </Pressable>
          <Pressable accessibilityLabel="Report listing" onPress={() => handleAction('report')} style={styles.iconButton}>
            <Ionicons color={colors.black} name="flag-outline" size={20} />
          </Pressable>
        </View>
      </View>

      {state.loading ? (
        <View style={styles.centerState}>
          <AppLoadingIndicator />
          <Text style={styles.stateText}>Loading product details...</Text>
        </View>
      ) : null}

      {!state.loading && state.error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Unable to load product details.</Text>
          <Pressable onPress={loadProduct} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!state.loading && !state.error && !state.product ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Product not found.</Text>
          <Pressable onPress={() => onNavigate('marketplaces')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Back to Marketplace</Text>
          </Pressable>
        </View>
      ) : null}

      {!state.loading && !state.error && state.product ? (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.topLayout, !isDesktop && styles.topLayoutMobile]}>
              <ProductImageGallery isDesktop={isDesktop} product={state.product} />
              <ProductSummaryCard
                actionMessage={actionMessage}
                averageRating={averageRating}
                onAction={handleAction}
                product={state.product}
              />
            </View>

            <View style={styles.detailGrid}>
              <CommonDetailsSection product={state.product} />
              {state.product.isDigital ? <DigitalProductInfoSection product={state.product} /> : <ElectronicsInfoSection product={state.product} />}
              {state.product.isDigital ? <DigitalCodeProtectionCard /> : <ElectronicsSafetyCard product={state.product} />}
              <RefundPolicyCard product={state.product} />
              <SellerCard averageRating={averageRating} product={state.product} />
              <BuyerProtectionCard product={state.product} />
            </View>

            <ReviewsSection averageRating={averageRating} product={state.product} />
            <RelatedProductsSection products={state.related} />
          </ScrollView>
          {!isDesktop ? <ProductActionBar onAction={handleAction} /> : null}
        </>
      ) : null}
    </SafeAreaView>
  );
}

function ProductImageGallery({ isDesktop, product }: { isDesktop: boolean; product: UnifiedProduct }) {
  const labels = product.isDigital ? ['Preview', 'Sample', 'Rules'] : ['Photo', 'Condition', 'Accessories', 'Warranty'];

  return (
    <View style={styles.mediaPanel}>
      <View style={styles.previewImage}>
        <Ionicons color={colors.black} name={product.isDigital ? 'keypad-outline' : 'hardware-chip-outline'} size={44} />
        <Text style={styles.previewText}>{isDesktop ? 'Main preview' : 'Image carousel'}</Text>
        {!isDesktop ? <Text style={styles.smallText}>1 / {labels.length}</Text> : null}
      </View>
      <ScrollView horizontal={!isDesktop} showsHorizontalScrollIndicator={false}>
        <View style={styles.thumbnailRow}>
          {labels.map((label) => (
            <View key={label} style={styles.thumbnail}>
              <Text style={styles.thumbnailText}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Text style={styles.smallText}>
        {product.isDigital
          ? 'No actual code, license key, download URL, credentials, or access details are shown before payment.'
          : 'Review product photos, condition details, included accessories, warranty, and return policy before purchase.'}
      </Text>
    </View>
  );
}

function ProductSummaryCard({
  actionMessage,
  averageRating,
  onAction,
  product
}: {
  actionMessage: string | null;
  averageRating: number | null;
  onAction: (action: ProductAction) => void;
  product: UnifiedProduct;
}) {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <View style={styles.purchasePanel}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>Buyer Protection</Text>
        <Text style={styles.outlineBadge}>{product.verifiedSeller ? 'Verified Seller' : 'Seller Review Needed'}</Text>
        <Text style={styles.outlineBadge}>{product.availability}</Text>
      </View>
      <Text style={styles.productTitle}>{product.title}</Text>
      <Text style={styles.productMeta}>
        {product.marketplaceName} - {product.category} - {product.productType} - {product.country}
      </Text>
      <View style={styles.priceRow}>
        {product.originalPrice ? <Text style={styles.originalPrice}>{formatMoney(product.originalPrice, product.currencyCode)}</Text> : null}
        <Text style={styles.price}>{formatMoney(product.price, product.currencyCode)}</Text>
        {discount ? <Text style={styles.discount}>{discount}% OFF</Text> : null}
      </View>
      <Text style={styles.productMeta}>
        {averageRating ? `${averageRating} rating` : 'No rating yet'} - {product.reviews.length} reviews
      </Text>
      <View style={styles.actionGrid}>
        <Pressable onPress={() => onAction('purchase')} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Buy Now</Text>
        </Pressable>
        <Pressable onPress={() => onAction('cart')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Add to Cart</Text>
        </Pressable>
        <Pressable onPress={() => onAction('wishlist')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Add to Wishlist</Text>
        </Pressable>
        <Pressable onPress={() => onAction('contact')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Contact Seller</Text>
        </Pressable>
      </View>
      {actionMessage ? <Text style={styles.noticeText}>{actionMessage}</Text> : null}
      <Text style={styles.smallText}>Guests can browse and share. Login is required before checkout, seller contact, wishlist, reviews, refunds, and reports.</Text>
    </View>
  );
}

function CommonDetailsSection({ product }: { product: UnifiedProduct }) {
  return (
    <InfoCard icon="list-outline" title="Product Details">
      <DetailRow label="Marketplace" value={product.marketplaceName} />
      <DetailRow label="Category" value={product.category} />
      <DetailRow label="Product type" value={product.productType.replaceAll('_', ' ')} />
      <DetailRow label="Country availability" value={product.country} />
      <DetailRow label="Status" value={product.availability} />
      <Text style={styles.cardText}>{product.description}</Text>
    </InfoCard>
  );
}

function DigitalProductInfoSection({ product }: { product: UnifiedProduct }) {
  return (
    <InfoCard icon="download-outline" title="Digital Product Info">
      <DetailRow label="Delivery type" value={product.deliveryType} />
      <DetailRow label="Instant access" value={product.deliveryType.includes('Instant') ? 'Eligible after successful payment' : 'Seller/admin step may be required'} />
      <DetailRow label="License" value={product.licenseNote || 'Shown after purchase when provided by seller'} />
      <DetailRow label="Compatibility" value={product.country} />
      <DetailRow label="Instructions" value="Pay, wait for order and risk checks, then reveal/download/access through Sharity." />
    </InfoCard>
  );
}

function DigitalCodeProtectionCard() {
  return (
    <InfoCard icon="lock-closed-outline" title="Digital Code Protection">
      <Text style={styles.cardText}>The actual code is hidden until payment is complete. Code reveal and access history may affect refund eligibility.</Text>
      <Text style={styles.cardText}>Seller previews must not expose redeemable codes, sensitive keys, passwords, or hidden download URLs.</Text>
    </InfoCard>
  );
}

function ElectronicsInfoSection({ product }: { product: UnifiedProduct }) {
  return (
    <InfoCard icon="hardware-chip-outline" title="Electronics Info">
      <DetailRow label="Brand" value={product.brand || 'Not provided'} />
      <DetailRow label="Model" value={product.title} />
      <DetailRow label="Condition" value={product.condition || 'Not provided'} />
      <DetailRow label="Shipping" value={product.shippingAvailable ? 'Shipping available' : 'Shipping unavailable'} />
      <DetailRow label="Warranty" value={product.warrantyAvailable ? 'Warranty available' : 'No warranty listed'} />
      <DetailRow label="Included accessories" value="Review seller photos and description before purchase." />
    </InfoCard>
  );
}

function ElectronicsSafetyCard({ product }: { product: UnifiedProduct }) {
  const needsWarning = product.condition !== 'New';

  return (
    <InfoCard icon="alert-circle-outline" title="Check before buying">
      <Text style={styles.cardText}>
        {needsWarning
          ? 'Review product condition, photos, warranty, return policy, included accessories, and seller rating before purchasing electronics.'
          : 'Review product photos, warranty, shipping, return policy, and seller rating before purchasing electronics.'}
      </Text>
    </InfoCard>
  );
}

function RefundPolicyCard({ product }: { product: UnifiedProduct }) {
  return (
    <InfoCard icon="return-down-back-outline" title={product.isDigital ? 'Refund Policy' : 'Return Policy'}>
      <Text style={styles.cardText}>
        {product.isDigital
          ? 'Refunds may be limited after the digital code is revealed, file is downloaded, or product access is granted.'
          : 'Returns depend on seller policy, product condition, warranty status, and Sharity buyer protection rules.'}
      </Text>
      <Text style={styles.cardText}>Invalid, misleading, damaged, counterfeit, or not-as-described products can be reported for admin review.</Text>
    </InfoCard>
  );
}

function SellerCard({ averageRating, product }: { averageRating: number | null; product: UnifiedProduct }) {
  return (
    <InfoCard icon="storefront-outline" title="Seller">
      <Text style={styles.cardTitle}>{product.sellerName || 'Seller alias'}</Text>
      <Text style={styles.cardText}>{product.verifiedSeller ? 'Verified seller' : 'Seller verification unavailable'}</Text>
      <Text style={styles.cardText}>{averageRating ? `${averageRating} seller rating` : 'Seller rating unavailable'}</Text>
      <Text style={styles.cardText}>Country/location: {product.country}</Text>
      <Text style={styles.cardText}>Sales, joined date, and response rate will appear when seller metrics API is available.</Text>
      <View style={styles.inlineActions}>
        <Text style={styles.linkText}>View Seller Profile</Text>
        <Text style={styles.linkText}>Contact Seller</Text>
      </View>
    </InfoCard>
  );
}

function BuyerProtectionCard({ product }: { product: UnifiedProduct }) {
  return (
    <InfoCard icon="shield-checkmark-outline" title="Buyer Protection">
      <Text style={styles.cardText}>
        {product.isDigital
          ? 'Secure checkout, code/access reveal after payment, seller verification, refund rules, and Sharity dispute support.'
          : 'Secure checkout, seller verification, condition review, return rules, and Sharity dispute support.'}
      </Text>
    </InfoCard>
  );
}

function ReviewsSection({ averageRating, product }: { averageRating: number | null; product: UnifiedProduct }) {
  const breakdown = [5, 4, 3, 2, 1].map((rating) => ({
    count: product.reviews.filter((review) => Math.round(review.rating) === rating).length,
    rating
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reviews</Text>
      <Text style={styles.cardText}>{averageRating ? `${averageRating} average rating` : 'No reviews yet.'}</Text>
      {product.reviews.length ? (
        <View style={styles.breakdownList}>
          {breakdown.map((item) => (
            <View key={item.rating} style={styles.breakdownRow}>
              <Text style={styles.smallText}>{item.rating} stars</Text>
              <View style={styles.breakdownTrack}>
                <View style={[styles.breakdownFill, { flex: item.count }]} />
                <View style={{ flex: Math.max(product.reviews.length - item.count, 0) }} />
              </View>
              <Text style={styles.smallText}>{item.count}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {product.reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <Text style={styles.cardTitle}>{review.title}</Text>
          <Text style={styles.cardText}>{review.rating} rating - {review.verified ? 'Verified purchase' : 'Unverified'}</Text>
          <Text style={styles.cardText}>{review.body}</Text>
          <Text style={styles.smallText}>{review.reviewer} - {formatDate(review.date)}</Text>
          <Text style={styles.linkText}>Helpful</Text>
        </View>
      ))}
    </View>
  );
}

function RelatedProductsSection({ products }: { products: UnifiedProduct[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Related Products</Text>
      {!products.length ? <Text style={styles.cardText}>No related products found.</Text> : null}
      <View style={styles.relatedGrid}>
        {products.map((product) => (
          <View key={product.id} style={styles.relatedCard}>
            <Text style={styles.badge}>{product.productType}</Text>
            <Text style={styles.cardTitle}>{product.title}</Text>
            <Text style={styles.cardText}>{formatMoney(product.price, product.currencyCode)}</Text>
            <Text style={styles.linkText}>View Product</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProductActionBar({ onAction }: { onAction: (action: ProductAction) => void }) {
  return (
    <View style={styles.stickyBar}>
      <Pressable onPress={() => onAction('purchase')} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Buy Now</Text>
      </Pressable>
      <Pressable onPress={() => onAction('cart')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Add to Cart</Text>
      </Pressable>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function InfoCard({ children, icon, title }: { children: ReactNode; icon: ComponentProps<typeof Ionicons>['name']; title: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons color={colors.black} name={icon} size={22} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function mapDigitalListing(listing: MarketplaceListing): UnifiedProduct {
  return {
    availability: statusLabel(listing.listingStatus),
    category: listing.categoryCode,
    country: listing.providerCountryCode || 'Global',
    currencyCode: listing.currencyCode,
    deliveryType: deliveryLabelFor(listing),
    description: listing.description || 'Digital access details and instructions after purchase.',
    id: listing.publicId,
    isDigital: true,
    licenseNote: listing.licenseNote,
    marketplaceName: 'Digital Marketplace',
    originalPrice: listing.originalPriceAmount,
    price: listing.priceAmount,
    productType: listing.productType,
    reviews: listing.publicReviews.map(mapReview),
    sellerName: listing.sellerDisplayName || 'Seller alias',
    sellerRating: null,
    title: listing.title,
    verifiedSeller: listing.verifiedSeller
  };
}

function mapElectronicsProduct(product: ElectronicsProduct): UnifiedProduct {
  return {
    availability: 'Available',
    brand: product.brand,
    category: product.category,
    condition: product.condition,
    country: product.location,
    currencyCode: 'USD',
    deliveryType: product.shippingAvailable ? 'Shipping Required' : 'Seller Shipping Unavailable',
    description: `${product.title} from ${product.sellerName}. Review condition, warranty, shipping, return eligibility, and seller rating before purchase.`,
    id: product.id,
    isDigital: false,
    marketplaceName: 'Electronics Marketplace',
    originalPrice: product.originalPrice ?? null,
    price: product.price,
    productType: 'ELECTRONICS',
    reviews: [
      {
        body: 'Condition and seller communication matched the listing preview.',
        date: '2026-01-15T00:00:00',
        id: `${product.id}-review`,
        rating: product.sellerRating,
        reviewer: 'Verified buyer',
        title: 'Good marketplace experience',
        verified: true
      }
    ],
    sellerName: product.sellerName,
    sellerRating: product.sellerRating,
    shippingAvailable: product.shippingAvailable,
    title: product.title,
    verifiedSeller: product.sellerName.toLowerCase().includes('verified'),
    warrantyAvailable: product.warrantyAvailable
  };
}

function mapReview(review: MarketplaceReview): UnifiedReview {
  return {
    body: review.body,
    date: review.createdAt,
    id: review.reviewId,
    rating: review.rating,
    reviewer: review.reviewerDisplayName,
    title: review.title,
    verified: review.verifiedPurchase
  };
}

function isDigitalListing(listing: MarketplaceListing) {
  return listing.productType === 'DIGITAL' || listing.deliveryType === 'INSTANT' || listing.deliveryType === 'MANUAL';
}

function deliveryLabelFor(listing: MarketplaceListing) {
  if (listing.deliveryType === 'INSTANT') {
    return 'Instant Code Reveal';
  }
  if (listing.deliveryType === 'MANUAL') {
    return 'Manual Seller Delivery';
  }
  if (listing.deliveryType === 'DOWNLOAD') {
    return 'Secure Download';
  }
  if (listing.productType === 'DIGITAL') {
    return 'Secure Digital Access';
  }
  return listing.deliveryType.replaceAll('_', ' ');
}

function statusLabel(status: string) {
  return status ? status.replaceAll('_', ' ') : 'Available';
}

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencyCode, style: 'currency' }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}

function formatDate(value: string) {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
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
    fontSize: 20,
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
    paddingBottom: spacing.xxxl
  },
  topLayout: {
    flexDirection: 'row',
    gap: spacing.xl
  },
  topLayoutMobile: {
    flexDirection: 'column'
  },
  mediaPanel: {
    flex: 1,
    gap: spacing.md
  },
  previewImage: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 320,
    padding: spacing.xl
  },
  previewText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm
  },
  thumbnail: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  thumbnailText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '800'
  },
  purchasePanel: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.black,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  outlineBadge: {
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
    fontSize: 30,
    fontWeight: '900'
  },
  productMeta: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 21
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  originalPrice: {
    color: colors.black,
    fontSize: 15,
    textDecorationLine: 'line-through'
  },
  price: {
    color: colors.black,
    fontSize: 28,
    fontWeight: '900'
  },
  discount: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900'
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.black,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  secondaryButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900'
  },
  noticeText: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.black,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    padding: spacing.md
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  infoCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 300,
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  infoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  cardTitle: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '900'
  },
  cardText: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 21
  },
  smallText: {
    color: colors.black,
    fontSize: 12,
    lineHeight: 18
  },
  detailRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.sm
  },
  detailLabel: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  detailValue: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 20
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  linkText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
    textDecorationLine: 'underline'
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 24,
    fontWeight: '900'
  },
  breakdownList: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  breakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  breakdownTrack: {
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 10,
    overflow: 'hidden'
  },
  breakdownFill: {
    backgroundColor: colors.black
  },
  reviewCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  relatedCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  stickyBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl
  },
  stateTitle: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900'
  },
  stateText: {
    color: colors.black,
    fontSize: 14
  }
});
