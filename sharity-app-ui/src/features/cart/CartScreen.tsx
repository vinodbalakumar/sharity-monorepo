import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Card, Input, Paragraph, Text, XStack, YStack } from 'tamagui';

import { AppButton } from '../../components/ui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import type { AppRoute } from '../../types/navigation';
import { getCart, applyCouponToCart, validateCart, proceedToCheckout } from '../../services/cartApi';
import type { CartItem, CartResponse, CartSellerGroup, CartValidationIssue, CheckoutPreviewResponse } from './cartCheckoutTypes';
import { getTotalCartValue, getCartItemCount, canCheckout, requiresSellerAcceptance, hasDigitalProducts, hasPhysicalProducts, calculateSavings } from '../../utils/cartUtils';

type Props = { onNavigate: (route: AppRoute) => void };
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const GroupList = FlashList as unknown as (props: { data: CartSellerGroup[]; estimatedItemSize: number; keyExtractor: (item: CartSellerGroup) => string; renderItem: (info: { item: CartSellerGroup; index: number }) => ReactElement }) => ReactElement;
const ItemList = FlashList as unknown as (props: { data: CartItem[]; estimatedItemSize: number; keyExtractor: (item: CartItem) => string; renderItem: (info: { item: CartItem; index: number }) => ReactElement }) => ReactElement;

export function CartScreen({ onNavigate }: Props) {
  const couponCode = useSelector(appState$.multiSellerCart.couponCode);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await getCart();
      // Ensure response has the required structure
      if (response && typeof response === 'object') {
        setCart(response as any);
        setPreview(null);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setLoadError(error instanceof Error ? error.message : 'Unable to load cart right now.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCoupon() {
    try {
      const normalizedCouponCode = couponCode.trim().toUpperCase();
      appState$.multiSellerCart.couponCode.set(normalizedCouponCode);
      await applyCouponToCart(normalizedCouponCode);
      setMessage('Coupon applied successfully!');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Coupon invalid.');
    }
  }

  async function handleTerms() {
    try {
      await validateCart();
      appState$.multiSellerCart.digitalTermsAccepted.set(true);
      setMessage('Cart valid. Ready for checkout.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cart validation failed.');
    }
  }

  if (loading) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Cart & Checkout" scrollable={true}>
        <CenteredState title="Loading cart..." />
      </InteriorShell>
    );
  }

  if (loadError) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Cart & Checkout" scrollable={true}>
        <CenteredState title={loadError} action="Retry" onAction={load} />
      </InteriorShell>
    );
  }

  if (!cart || cart.sellerGroups.length === 0) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Cart & Checkout" scrollable={true}>
        <CenteredState title="Your cart is empty." action="Explore Marketplace" onAction={() => onNavigate('marketplaces')} />
      </InteriorShell>
    );
  }

  const isReadyForCheckout = canCheckout(cart);
  const needsSellerAcceptance = requiresSellerAcceptance(cart);
  const hasBothProductTypes = hasDigitalProducts(cart) && hasPhysicalProducts(cart);
  const savings = calculateSavings(cart);

  return (
    <InteriorShell onNavigate={onNavigate} title="Cart & Checkout" subtitle={`${getCartItemCount(cart)} items from multiple sellers`} scrollable={true}>
      <YStack gap="$5" maxWidth={1220} mx="auto" width="100%">
        <ValidationBanner issues={cart.validationSummary.issues} />
        {hasBothProductTypes ? (
          <PremiumCard p="$4" bg="$blue3" borderColor="$blue10" borderWidth={1}>
            <XStack ai="center" gap="$2">
              <Ionicons name="information-circle" size={20} color="blue" />
              <Paragraph color="$blue10">Your cart contains both digital and physical items. Digital items will be delivered instantly after payment authorization.</Paragraph>
            </XStack>
          </PremiumCard>
        ) : null}
        {needsSellerAcceptance ? (
          <PremiumCard p="$4" bg="$orange3" borderColor="$orange10" borderWidth={1}>
            <XStack ai="center" gap="$2">
              <Ionicons name="time-outline" size={20} color="orange" />
              <Paragraph color="$orange10">Some items require seller acceptance. You'll be notified once sellers accept your order.</Paragraph>
            </XStack>
          </PremiumCard>
        ) : null}
        {savings > 0 ? (
          <PremiumCard p="$4" bg="$green3" borderColor="$green10" borderWidth={1}>
            <XStack ai="center" gap="$2" jc="space-between">
              <XStack ai="center" gap="$2" flex={1}>
                <Ionicons name="checkmark-circle" size={20} color="green" />
                <Text color="$green10" fontWeight="900">You're saving {money(savings)} with coupons!</Text>
              </XStack>
            </XStack>
          </PremiumCard>
        ) : null}
          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <GroupList
                data={cart.sellerGroups}
                estimatedItemSize={390}
                keyExtractor={(group) => group.sellerId}
                renderItem={({ item, index }) => <SellerGroupCard group={item} index={index} />}
              />
              <SavedForLater items={cart.savedForLaterItems} />
            </YStack>
            <YStack gap="$4" width={380} $md={{ width: '100%' }}>
              <CouponPanel couponCode={couponCode} onApply={handleCoupon} />
              {hasDigitalProducts(cart) ? <DigitalTermsPanel accepted={cart.digitalTerms.accepted} onAccept={handleTerms} summary={cart.digitalTerms.summary} /> : null}
              <PaymentNotice />
              {preview ? <CheckoutPreview preview={preview} /> : null}
              <PricingSummary cart={cart} />
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
              <AppButton
                disabled={!isReadyForCheckout}
                icon={<Ionicons name="lock-closed-outline" size={18} />}
                variant="primary"
                onPress={() => isReadyForCheckout ? onNavigate('checkout') : setMessage(needsSellerAcceptance ? 'Waiting for seller acceptance.' : 'Please resolve validation issues before proceeding.')}
              >
                Proceed to Checkout
              </AppButton>
            </YStack>
          </XStack>
        </YStack>
      </InteriorShell>
    );
  }

function SellerGroupCard({ group, index }: { group: CartSellerGroup; index: number }) {
  const style = useEntrance(index);
  return (
    <Animated.View style={style}>
      <PremiumCard mb="$4" p="$5">
        <YStack gap="$4">
          <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
            <Image source={group.storeLogoUrl} placeholder={blurhash} style={{ width: 58, height: 58, borderRadius: 14 }} />
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="900">{group.storeName}</Text>
              <Paragraph color="$gray10">Seller alias: {group.sellerAlias} • {group.marketplaceCode}</Paragraph>
              <XStack flexWrap="wrap" gap="$2"><Badge label={group.sellerVerificationBadge} tone="success" /><Badge label={group.sellerAcceptanceRequired ? 'Seller acceptance required' : 'Instant digital delivery'} tone={group.sellerAcceptanceRequired ? 'warning' : 'info'} /><Badge label={group.digitalInventoryStatus} tone="success" /></XStack>
            </YStack>
            <YStack ai="flex-end"><Text fontSize="$6" fontWeight="900">{money(group.groupSubtotal)}</Text><Text color="$gray10">Group subtotal</Text></YStack>
          </XStack>
          <XStack flexWrap="wrap" gap="$2">
            <Badge label={`Seller coupon -${money(group.sellerCouponDiscount)}`} tone="success" />
            <Badge label={`Platform allocation -${money(group.platformCouponAllocation)}`} tone="info" />
            <Badge label={group.refundRuleSummary} tone="warning" />
          </XStack>
          <ItemList data={group.items} estimatedItemSize={156} keyExtractor={(item) => item.cartItemId} renderItem={({ item, index: itemIndex }) => <CartItemRow item={item} index={itemIndex} />} />
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

const CartItemRow = memo(function CartItemRow({ item, index }: { item: CartItem; index: number }) {
  const style = useEntrance(index);
  return (
    <Animated.View style={style}>
      <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3">
        <Image source={item.productImageUrl} placeholder={blurhash} style={{ width: 72, height: 72, borderRadius: 12 }} />
        <YStack flex={1} gap="$1" minWidth={0}>
          <Text fontWeight="900">{item.productTitle}</Text>
          <Paragraph color="$gray10">{item.productType} • {item.deliveryType.replaceAll('_', ' ')} • Qty {item.quantity}</Paragraph>
          <Paragraph color="$gray10">{item.digitalDeliveryNote} • {item.regionRestriction}</Paragraph>
          <Paragraph color="$gray10">{item.refundRuleSummary}</Paragraph>
        </YStack>
        <YStack ai="flex-end" gap="$2">
          <Text fontWeight="900">{money(item.price * item.quantity)}</Text>
          <Text color="$gray10" textDecorationLine="line-through">{money(item.originalPrice * item.quantity)}</Text>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger><AppButton size="small" icon={<Ionicons name="ellipsis-horizontal" size={16} />}>Item</AppButton></DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item key="remove">Remove Item</DropdownMenu.Item>
              <DropdownMenu.Item key="save">Save for Later</DropdownMenu.Item>
              <DropdownMenu.Item key="seller">View Seller</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </YStack>
      </XStack>
    </Animated.View>
  );
});

function CouponPanel({ couponCode, onApply }: { couponCode: string; onApply: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Coupons</Text><Input bg="$background" borderColor="$borderColor" onChangeText={(value) => appState$.multiSellerCart.couponCode.set(value)} placeholder="SELLER5 or SHARITY10" value={couponCode} /><AppButton variant="primary" onPress={onApply}>Apply Coupon</AppButton><Paragraph color="$gray10">Seller coupons reduce eligible seller groups. Platform coupons reduce buyer total or platform-funded portions.</Paragraph></YStack></PremiumCard>;
}

function DigitalTermsPanel({ accepted, summary, onAccept }: { accepted: boolean; summary: string; onAccept: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Digital Terms</Text><Paragraph color="$gray10">{summary}</Paragraph><AppButton icon={<Ionicons name={accepted ? 'checkmark-circle' : 'square-outline'} size={18} />} variant={accepted ? 'success' : 'danger'} onPress={onAccept}>{accepted ? 'Digital Terms Accepted' : 'Accept Digital Terms'}</AppButton></YStack></PremiumCard>;
}

function PaymentNotice() {
  return <PremiumCard p="$5"><YStack gap="$2"><Badge label="Authorize-first payment" tone="warning" /><Paragraph color="$gray10">Your payment may be authorized first. Some seller orders may require seller acceptance before final capture.</Paragraph></YStack></PremiumCard>;
}

function CheckoutPreview({ preview }: { preview: CheckoutPreviewResponse }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Order Split Preview</Text><Paragraph color="$gray10">Parent order {preview.parentOrderPreview.parentOrderReferencePreview} creates {preview.parentOrderPreview.sellerOrderCount} seller orders.</Paragraph>{preview.sellerOrderPreviews.map((order) => <XStack key={order.sellerOrderReferencePreview} jc="space-between" gap="$3"><Text>{order.sellerOrderReferencePreview}</Text><Text color="$gray10">{order.storeName}</Text></XStack>)}<Badge label={preview.paymentAuthorizationModel} tone="info" /></YStack></PremiumCard>;
}

function PricingSummary({ cart }: { cart: CartResponse }) {
  const p = cart.pricingSummary;
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Pricing Summary</Text><PriceRow label="Items total" value={p.itemsTotal} /><PriceRow label="Seller discounts" value={-p.sellerCouponDiscountTotal} /><PriceRow label="Platform coupon" value={-p.platformCouponDiscountTotal} /><PriceRow label="Buyer service fee" value={p.buyerServiceFee} /><PriceRow label="Total authorization" value={p.totalAuthorizationAmount} strong /><Paragraph color="$gray10">Buyer-safe pricing only. Seller commission and fee-waiver rules are not shown.</Paragraph></YStack></PremiumCard>;
}

function ValidationBanner({ issues }: { issues: CartValidationIssue[] }) {
  return <PremiumCard p="$4"><YStack gap="$2">{issues.map((issue) => <XStack key={issue.issueId} ai="center" gap="$2"><Ionicons name={issue.severity === 'CRITICAL' ? 'close-circle' : 'alert-circle'} size={20} color={issue.severity === 'CRITICAL' ? 'red' : 'orange'} /><Text flex={1}>{issue.message}</Text><Badge label={issue.requiredAction} tone={issue.severity === 'CRITICAL' ? 'critical' : 'warning'} /></XStack>)}</YStack></PremiumCard>;
}

function SavedForLater({ items }: { items: CartItem[] }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Saved for Later</Text>{items.map((item) => <XStack key={item.cartItemId} ai="center" gap="$3"><Image source={item.productImageUrl} placeholder={blurhash} style={{ width: 48, height: 48, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="900">{item.productTitle}</Text><Text color="$gray10">{money(item.price)}</Text></YStack><AppButton variant="secondary">Move to Cart</AppButton></XStack>)}</YStack></PremiumCard>;
}

function PriceRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{money(value)}</Text></XStack>;
}

function CenteredState({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <PremiumCard p="$6"><YStack ai="center" gap="$3"><Text fontSize="$6" fontWeight="900" ta="center">{title}</Text>{action ? <AppButton variant="primary" onPress={onAction}>{action}</AppButton> : null}</YStack></PremiumCard>;
}

function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) {
  const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3';
  const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10';
  return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>;
}

function PremiumCard(props: ComponentProps<typeof Card>) {
  return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />;
}

function money(value: number) {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function useEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 }));
  }, [index, opacity, translateY]);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}
