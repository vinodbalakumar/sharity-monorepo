import { CurrencyAmount, OrderCurrencyContext } from '../../components/ui/CurrencyAmount';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import {
  cancelOrder,
  getBuyerOrderDetails,
  startDispute,
  startRefundRequest
} from './orderDetailsMockApi';
import type { OrderDetailsItem, OrderDetailsResponse, OrderTimelineEvent } from './orderDetailsTypes';
import { getOrderStatusColor, getOrderStatusLabel, canRequestRefund, canInitiateDispute, canTrackOrder, getPaymentStatusIcon, isPaymentAuthorized } from '../../utils/orderUtils';

type OrderDetailsScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenDispute?: (orderId: string) => void;
  onOpenRefundReturn?: (orderId: string) => void;
  onOpenReceipt?: (orderId: string, receiptId: string) => void;
  onOpenTracking?: (orderId: string) => void;
  orderId: string | null;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const ItemFlashList = FlashList as unknown as (props: {
  data: OrderDetailsItem[];
  estimatedItemSize: number;
  keyExtractor: (item: OrderDetailsItem) => string;
  renderItem: (info: { index: number; item: OrderDetailsItem }) => ReactElement;
}) => ReactElement;

const TimelineFlashList = FlashList as unknown as (props: {
  data: OrderTimelineEvent[];
  estimatedItemSize: number;
  keyExtractor: (item: OrderTimelineEvent) => string;
  renderItem: (info: { index: number; item: OrderTimelineEvent }) => ReactElement;
}) => ReactElement;

export function OrderDetailsScreen({ onNavigate, onOpenDispute, onOpenReceipt, onOpenRefundReturn, onOpenTracking, orderId }: OrderDetailsScreenProps) {
  const [details, setDetails] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const loadDetails = useCallback(async () => {
    if (!orderId) {
      setError(true);
      setLoading(false);
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const response = await getBuyerOrderDetails(orderId);
      setDetails(response); setError(!response);
    } catch { setDetails(null); setError(true); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function requestRefund() {
    if (!details) {
      return;
    }
    await startRefundRequest(details.order.orderId);
    if (onOpenRefundReturn) {
      onOpenRefundReturn(details.order.orderId);
      return;
    }
    setMessage('Refund / Return Request screen is not available yet.');
  }

  async function openDispute() {
    if (!details) {
      return;
    }
    await startDispute(details.order.orderId);
    if (onOpenDispute) {
      onOpenDispute(details.order.orderId);
      return;
    }
    setMessage('Open Dispute screen is not available yet.');
  }

  async function cancelCurrentOrder() {
    if (!details || !details.eligibility.canCancel) {
      setMessage(details?.eligibility.cancelReason ?? 'This action is not available for the current order status.');
      return;
    }
    await cancelOrder(details.order.orderId);
    appState$.orders.cancelConfirmationOrderId.set('');
    setMessage('Cancellation request submitted.');
  }

  async function reportIssue() {
    if (!details) {
      return;
    }
    onNavigate('support');
  }

  function openTracking() {
    if (!details) {
      return;
    }
    if (!details.shippingSummary?.trackingAvailable) {
      setMessage('Tracking will be available after the seller ships your item.');
      return;
    }
    if (onOpenTracking) {
      onOpenTracking(details.order.orderId);
      return;
    }
    setMessage('Tracking screen is not available yet.');
  }

  function viewReceipt() {
    if (!details) {
      return;
    }
    if (!details.receiptSummary.receiptAvailable) {
      setMessage('Receipt is not available for this order yet.');
      return;
    }
    if (onOpenReceipt) {
      onOpenReceipt(details.order.orderId, details.receiptSummary.receiptId);
      return;
    }
    onNavigate('receipt');
  }

  if (loading) {
    return <CenteredState message="Loading order details..." />;
  }

  if (error || !details) {
    return <CenteredState actionLabel="Back to Orders" message="Order not found." onAction={() => onNavigate('orders')} />;
  }

  const isDigital = details.order.marketplaceCode === 'DIGITAL';
  const isElectronics = details.order.marketplaceCode === 'ELECTRONICS';
  const canRefund = canRequestRefund(details.order.orderStatus, details.order.refundDisputeStatus === 'NONE' ? null : details.order.refundDisputeStatus);
  const canDispute = canInitiateDispute(details.order.refundDisputeStatus === 'NONE' ? null : details.order.refundDisputeStatus, null);
  const canTrack = canTrackOrder(details.order.orderStatus);

  return (
    <OrderCurrencyContext.Provider value={details.order.currency}>
    <InteriorShell onNavigate={onNavigate} title="Order Details" subtitle={`Order ${details.order.orderReference}`} scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <SummaryCard details={details} />
              <SectionTitle title="Items" />
              <ItemFlashList
                data={details.items}
                estimatedItemSize={150}
                keyExtractor={(item) => item.productId}
                renderItem={({ item, index }) => <ItemCard index={index} item={item} />}
              />
              {isDigital && details.digitalAccessSummary ? <DigitalAccessCard details={details} onNavigate={onNavigate} /> : null}
              {isElectronics && details.shippingSummary ? <ShippingCard details={details} /> : null}
              {isElectronics && details.shippingAddress ? <ShippingAddressCard details={details} /> : null}
              <SectionTitle title="Timeline" />
              <TimelineFlashList
                data={details.timeline}
                estimatedItemSize={108}
                keyExtractor={(event) => event.eventId}
                renderItem={({ item, index }) => <TimelineCard event={item} index={index} />}
              />
            </YStack>

            <YStack gap="$4" width={380} $sm={{ width: '100%' }}>
              <SellerCard details={details} />
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="700">Actions</Text>
                  {isDigital ? <Button theme="blue" onPress={() => onNavigate('library')}>Go to Library</Button> : null}
                  {isElectronics && canTrack ? <Button theme="blue" onPress={openTracking}>Track Package</Button> : null}
                  <Button disabled={!canRefund} onPress={requestRefund}>{canRefund ? 'Request Refund / Return' : 'Refund not available'}</Button>
                  <Button disabled={!canDispute} onPress={openDispute}>{canDispute ? 'Open Dispute' : 'Dispute not available'}</Button>
                  <Button disabled={!details.eligibility.canCancel} onPress={cancelCurrentOrder}>{details.eligibility.canCancel ? 'Cancel Order' : 'Cannot cancel'}</Button>
                  <Button onPress={reportIssue}>Report Issue</Button>
                  <Button onPress={() => setMessage('Safe seller contact flow will be added later. Seller private phone/email is not exposed.')}>Contact Seller</Button>
                  {!details.eligibility.canCancel ? <Paragraph color="$gray10">{details.eligibility.cancelReason}</Paragraph> : null}
                  {!canRefund && details.eligibility.refundReason ? <Paragraph color="$gray10">{details.eligibility.refundReason}</Paragraph> : null}
                </YStack>
              </PremiumCard>
            </YStack>
          </XStack>
        </YStack>
      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
    </InteriorShell>
    </OrderCurrencyContext.Provider>
  );
}

function SummaryCard({ details }: { details: OrderDetailsResponse }) {
  const paymentTone = isPaymentAuthorized(details.order.paymentStatus) ? 'success' : 'warning';
  const statusColor = getOrderStatusColor(details.order.orderStatus);
  const statusLabel = getOrderStatusLabel(details.order.orderStatus);
  const refundTone = details.order.refundDisputeStatus === 'NONE' ? 'success' : details.order.refundDisputeStatus.includes('DISPUTE') ? 'error' : 'warning';

  return (
    <PremiumCard p="$5">
      <YStack gap="$4">
        <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
          <YStack gap="$1">
            <Text fontSize="$7" fontWeight="700">{details.order.orderReference}</Text>
            <Paragraph color="$gray10">{details.order.marketplaceName} - Seller: {details.seller.sellerDisplayName}</Paragraph>
            <Text color="$gray10">Placed {formatDate(details.order.orderDate)} - Updated {formatDate(details.order.updatedAt)}</Text>
          </YStack>
          <Text fontSize="$7" fontWeight="700"><CurrencyAmount amount={details.order.totalAmount} /></Text>
        </XStack>
        <XStack flexWrap="wrap" gap="$2" ai="center">
          <XStack ai="center" gap="$1">
            <Ionicons name={getPaymentStatusIcon(details.order.paymentStatus)} size={16} color="currentColor" />
            <StatusPill label={labelize(details.order.paymentStatus)} tone={paymentTone} />
          </XStack>
          <XStack ai="center" gap="$1">
            <Ionicons name="layers-outline" size={16} color="currentColor" />
            <StatusPill label={statusLabel} tone={refundTone} />
          </XStack>
          <XStack ai="center" gap="$1">
            <Ionicons name={details.order.refundDisputeStatus === 'NONE' ? 'checkmark-circle' : 'alert-circle'} size={16} color="currentColor" />
            <StatusPill label={labelize(details.order.refundDisputeStatus)} tone={refundTone} />
          </XStack>
        </XStack>
      </YStack>
    </PremiumCard>
  );
}

const ItemCard = memo(function ItemCard({ index, item }: { index: number; item: OrderDetailsItem }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$3" p="$4">
        <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
          <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: item.productImageUrl }} style={{ borderRadius: 14, height: 78, width: 78 }} />
          <YStack flex={1} gap="$1">
            <Text fontWeight="700">{item.productTitle}</Text>
            <Text color="$gray10">{item.productType} - Qty {item.quantity} - {item.deliveryType === 'DIGITAL' ? 'Digital access' : 'Shipping required'}</Text>
            {item.condition ? <Text color="$gray10">{item.condition}</Text> : null}
            <Text>{item.refundReturnSummary}</Text>
          </YStack>
          <Text fontWeight="700"><CurrencyAmount amount={item.price} /></Text>
        </XStack>
      </PremiumCard>
    </Animated.View>
  );
});

function DigitalAccessCard({ details, onNavigate }: { details: OrderDetailsResponse; onNavigate: (route: AppRoute) => void }) {
  const summary = details.digitalAccessSummary!;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Digital access</Text>
        <Paragraph>{summary.message}</Paragraph>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={labelize(summary.accessStatus)} tone="info" />
          <StatusPill label={summary.refundEligibilityStatus} tone="warning" />
          <StatusPill label={summary.riskReviewStatus} tone="success" />
        </XStack>
        <Button theme="blue" onPress={() => onNavigate('library')}>Go to Library</Button>
      </YStack>
    </PremiumCard>
  );
}

function ShippingCard({ details }: { details: OrderDetailsResponse }) {
  const shipping = details.shippingSummary!;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Shipping / tracking</Text>
        <Paragraph>{shipping.trackingAvailable ? 'Tracking is available for this package.' : 'Tracking will be available after the seller ships your item.'}</Paragraph>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={labelize(shipping.shippingStatus)} tone={shipping.trackingAvailable ? 'info' : 'warning'} />
          {shipping.carrier ? <StatusPill label={`${shipping.carrier} ${shipping.trackingMaskedReference ?? ''}`} tone="info" /> : null}
          {shipping.estimatedDelivery ? <StatusPill label={`ETA ${formatDate(shipping.estimatedDelivery)}`} tone="success" /> : null}
        </XStack>
      </YStack>
    </PremiumCard>
  );
}

function ShippingAddressCard({ details }: { details: OrderDetailsResponse }) {
  const address = details.shippingAddress!;
  return (
    <PremiumCard p="$4">
      <YStack gap="$2">
        <Text color="$blue10" fontWeight="700">Shipping address</Text>
        <Text>{address.fullName}</Text>
        <Text>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</Text>
        <Text>{address.city}, {address.state} {address.postalCode}</Text>
        <Text>{address.country} - {address.phoneMasked}</Text>
      </YStack>
    </PremiumCard>
  );
}

function SellerCard({ details }: { details: OrderDetailsResponse }) {
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <XStack ai="center" gap="$3">
          <YStack ai="center" bg="$purple4" br="$10" h={52} jc="center" w={52}>
            <Ionicons color={colors.primary} name="storefront-outline" size={24} />
          </YStack>
          <YStack flex={1}>
            <Text fontSize="$6" fontWeight="700">{details.seller.sellerDisplayName}</Text>
            <Text color="$gray10">{details.seller.country} - Rating {details.seller.sellerRating}</Text>
          </YStack>
        </XStack>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={details.seller.sellerVerified ? 'Verified Seller' : 'Seller Review'} tone={details.seller.sellerVerified ? 'success' : 'warning'} />
          <StatusPill label={details.order.marketplaceName} tone="info" />
        </XStack>
      </YStack>
    </PremiumCard>
  );
}

const TimelineCard = memo(function TimelineCard({ event, index }: { event: OrderTimelineEvent; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 55, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$3" p="$4">
        <XStack ai="flex-start" gap="$3">
          <YStack ai="center" bg="$blue4" br="$10" h={38} jc="center" w={38}>
            <Ionicons color={colors.info} name="checkmark" size={20} />
          </YStack>
          <YStack flex={1} gap="$1">
            <Text fontWeight="700">{event.title}</Text>
            <Text>{event.description}</Text>
            <Text color="$gray10" fontSize="$2">{formatDate(event.timestamp)}</Text>
          </YStack>
        </XStack>
      </PremiumCard>
    </Animated.View>
  );
});

function SectionTitle({ title }: { title: string }) {
  return <Text fontSize="$6" fontWeight="700">{title}</Text>;
}

function CenteredState({ actionLabel, message, onAction }: { actionLabel?: string; message: string; onAction?: () => void }) {
  return (
    <YStack bg="$background" f={1}>
      <YStack ai="center" f={1} jc="center" p="$5">
        <PremiumCard maxWidth={560} p="$6" width="100%">
          <YStack ai="center" gap="$4">
            <Text fontSize="$6" fontWeight="700" ta="center">{message}</Text>
            {actionLabel && onAction ? <Button theme="blue" onPress={onAction}>{actionLabel}</Button> : null}
          </YStack>
        </PremiumCard>
      </YStack>
    </YStack>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <YStack bottom={24} left={24} pos="absolute" right={24}>
      <PremiumCard p="$3">
        <XStack ai="center" jc="space-between" gap="$3">
          <Text flex={1}>{message}</Text>
          <Button size="$3" onPress={onClose}>Dismiss</Button>
        </XStack>
      </PremiumCard>
    </YStack>
  );
}

function PremiumCard({ children, ...props }: { children: ReactNode; [key: string]: unknown }) {
  return (
    <Card borderColor="$borderColor" borderWidth={1} shadowColor="$shadowColor" shadowRadius={12} {...props}>
      {children}
    </Card>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'error' | 'info' | 'success' | 'warning' }) {
  const theme = tone === 'success' ? 'green' : tone === 'warning' ? 'orange' : tone === 'error' ? 'red' : 'blue';
  return (
    <YStack bg={`$${theme}4`} br="$10" px="$3" py="$2">
      <Text color={`$${theme}11`} fontSize="$2" fontWeight="800">{label}</Text>
    </YStack>
  );
}

function statusTone(status: string): 'error' | 'info' | 'success' | 'warning' {
  if (['PAID', 'ACCESS_READY', 'DELIVERED', 'COMPLETED'].includes(status)) {
    return 'success';
  }
  if (['CANCELLED', 'REFUNDED', 'DISPUTED', 'FAILED'].includes(status)) {
    return 'error';
  }
  if (['SHIPPED'].includes(status)) {
    return 'info';
  }
  return 'warning';
}

function labelize(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
