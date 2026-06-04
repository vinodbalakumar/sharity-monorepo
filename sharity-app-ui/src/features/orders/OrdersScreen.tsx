import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H1, Input, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { getBuyerOrders, getOrderReceipt, getTrackingSummary } from './ordersMockApi';
import type { OrderFilter, OrderListItem, OrderSort, OrdersResponse } from './ordersTypes';

type OrdersScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenOrderDetails?: (orderId: string) => void;
  onOpenReceipt?: (orderId: string, receiptId: string) => void;
  onOpenTracking?: (orderId: string) => void;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const filters: OrderFilter[] = ['All', 'Digital', 'Electronics', 'Processing', 'Access Ready', 'Shipping Pending', 'Shipped', 'Delivered', 'Cancelled', 'Refunded', 'Disputed', 'Seller Delivery Pending'];
const sorts: OrderSort[] = ['Newest First', 'Oldest First', 'Highest Amount', 'Lowest Amount', 'Recently Updated', 'Status', 'Marketplace'];

const OrdersFlashList = FlashList as unknown as (props: {
  data: OrderListItem[];
  estimatedItemSize: number;
  keyExtractor: (item: OrderListItem) => string;
  renderItem: (info: { index: number; item: OrderListItem }) => ReactElement;
}) => ReactElement;

export function OrdersScreen({ onNavigate, onOpenOrderDetails, onOpenReceipt, onOpenTracking }: OrdersScreenProps) {
  const selectedFilter = useSelector(appState$.orders.selectedFilter) as OrderFilter;
  const selectedSort = useSelector(appState$.orders.selectedSort) as OrderSort;
  const searchQuery = useSelector(appState$.orders.searchQuery);
  const receiptModalOrderId = useSelector(appState$.orders.receiptModalOrderId);
  const [response, setResponse] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const orders = await getBuyerOrders();
      setResponse(orders);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const storedFilter = appStorage.getString('ordersSelectedFilter') as OrderFilter | null;
    const storedSort = appStorage.getString('ordersSelectedSort') as OrderSort | null;
    if (storedFilter && filters.includes(storedFilter)) {
      appState$.orders.selectedFilter.set(storedFilter);
    }
    if (storedSort && sorts.includes(storedSort)) {
      appState$.orders.selectedSort.set(storedSort);
    }
  }, [loadOrders]);

  const orders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortOrders(
      (response?.orders ?? []).filter((order) => {
        const matchesFilter = matchesFilterValue(order, selectedFilter);
        const haystack = [
          order.orderId,
          order.orderReference,
          order.productTitle,
          order.sellerDisplayName,
          order.marketplaceName,
          order.orderStatus,
          order.paymentStatus,
          order.digitalAccessStatus,
          order.shippingStatus,
          order.refundDisputeStatus
        ].join(' ').toLowerCase();
        return matchesFilter && (!query || haystack.includes(query));
      }),
      selectedSort
    );
  }, [response?.orders, searchQuery, selectedFilter, selectedSort]);

  async function viewReceipt(order: OrderListItem) {
    if (!order.receiptAvailable) {
      setMessage('Receipt is not available for this order yet.');
      return;
    }
    const receipt = await getOrderReceipt(order.orderId);
    appState$.orders.receiptModalOrderId.set(order.orderId);
    if (onOpenReceipt) {
      onOpenReceipt(order.orderId, receipt.receiptId);
      return;
    }
    setMessage(`Receipt ${receipt.receiptId} ready. Payment reference ${receipt.safePaymentReference}.`);
  }

  async function trackPackage(order: OrderListItem) {
    const tracking = await getTrackingSummary(order.orderId);
    if (!tracking.trackingAvailable) {
      setMessage('Tracking will be available after the seller ships your item.');
      return;
    }
    if (onOpenTracking) {
      onOpenTracking(order.orderId);
      return;
    }
    setMessage(`Tracking available: ${tracking.carrier ?? 'Carrier'} ${tracking.trackingMaskedReference ?? ''}.`);
  }

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1240} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack gap="$2">
              <Text color="$blue10" fontWeight="800">Order history</Text>
              <H1>My Orders</H1>
              <Paragraph color="$gray10">Digital, electronics, refunds, disputes, receipts, and safe tracking summaries in one place.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button onPress={() => onNavigate('home')}>Dashboard</Button>
              <Button theme="purple" onPress={() => onNavigate('marketplaces')}>Explore Marketplace</Button>
            </XStack>
          </XStack>

          <PremiumCard p="$4">
            <YStack gap="$4">
              <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
                <XStack ai="center" bg="$background" br="$6" borderColor="$borderColor" borderWidth={1} flex={1} gap="$2" px="$3" py="$2" width="100%">
                  <Ionicons color={colors.textSecondary} name="search" size={20} />
                  <Input
                    aria-label="Search orders"
                    bg="transparent"
                    borderWidth={0}
                    flex={1}
                    focusStyle={{ borderWidth: 0 }}
                    onChangeText={(value) => appState$.orders.searchQuery.set(value)}
                    placeholder="Search orders"
                    value={searchQuery}
                  />
                </XStack>
                <XStack flexWrap="wrap" gap="$2">
                  {sorts.map((sort) => (
                    <Button
                      key={sort}
                      size="$3"
                      theme={selectedSort === sort ? 'purple' : undefined}
                      onPress={() => {
                        appState$.orders.selectedSort.set(sort);
                        appStorage.setString('ordersSelectedSort', sort);
                      }}
                    >
                      {sort}
                    </Button>
                  ))}
                </XStack>
              </XStack>
              <XStack flexWrap="wrap" gap="$2">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    size="$3"
                    theme={selectedFilter === filter ? 'purple' : undefined}
                    onPress={() => {
                      appState$.orders.selectedFilter.set(filter);
                      appStorage.setString('ordersSelectedFilter', filter);
                    }}
                  >
                    {filter}
                  </Button>
                ))}
              </XStack>
              {response ? <SummaryCounts orders={response} /> : null}
            </YStack>
          </PremiumCard>

          {loading ? <LoadingState /> : null}
          {error ? <CenteredState actionLabel="Retry" message="Unable to load your orders." onAction={loadOrders} /> : null}
          {!loading && !error && orders.length === 0 ? (
            <CenteredState
              actionLabel={searchQuery ? 'Clear Search' : selectedFilter === 'All' ? 'Explore Marketplace' : 'View All Orders'}
              message={searchQuery ? 'No orders found.' : selectedFilter === 'All' ? 'No orders yet.' : 'No orders match this filter.'}
              onAction={() => {
                if (searchQuery) {
                  appState$.orders.searchQuery.set('');
                  return;
                }
                if (selectedFilter !== 'All') {
                  appState$.orders.selectedFilter.set('All');
                  return;
                }
                onNavigate('marketplaces');
              }}
              subtitle="Your digital purchases, electronics orders, refunds, and shipment updates will appear here."
            />
          ) : null}
          {!loading && !error && orders.length > 0 ? (
            <YStack gap="$4">
              <Text color="$gray10" fontWeight="800">{groupLabel(orders[0]!)}</Text>
              <OrdersFlashList
                data={orders}
                estimatedItemSize={320}
                keyExtractor={(order) => order.orderId}
                renderItem={({ item, index }) => (
                  <OrderCard
                    index={index}
                    order={item}
                    onGoToLibrary={() => onNavigate('library')}
                    onTrackPackage={() => trackPackage(item)}
                    onViewDetails={() => {
                      if (onOpenOrderDetails) {
                        onOpenOrderDetails(item.orderId);
                        return;
                      }
                      setMessage('Order Details is not available yet.');
                    }}
                    onViewReceipt={() => viewReceipt(item)}
                  />
                )}
              />
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>
      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
      {receiptModalOrderId ? null : null}
    </YStack>
  );
}

const OrderCard = memo(function OrderCard({
  index,
  onGoToLibrary,
  onTrackPackage,
  onViewDetails,
  onViewReceipt,
  order
}: {
  index: number;
  onGoToLibrary: () => void;
  onTrackPackage: () => void;
  onViewDetails: () => void;
  onViewReceipt: () => void;
  order: OrderListItem;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const isDigital = order.marketplaceCode === 'DIGITAL';
  const isElectronics = order.marketplaceCode === 'ELECTRONICS';

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$4" p="$4">
        <YStack gap="$4">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" gap="$4">
            <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: order.productImageUrl }} style={{ borderRadius: 16, height: 112, width: 112 }} />
            <YStack flex={1} gap="$3" minWidth={0}>
              <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$2">
                <YStack flex={1} gap="$1">
                  <Text fontSize="$6" fontWeight="900">{order.productTitle}</Text>
                  <Paragraph color="$gray10">{order.marketplaceName} - {order.productType} - Seller: {order.sellerDisplayName}</Paragraph>
                  <Text color="$gray10" fontSize="$2">Order {order.orderReference} - {formatDate(order.orderDate)} - {formatMoney(order.totalAmount)}</Text>
                </YStack>
                <XStack flexWrap="wrap" gap="$2">
                  <StatusPill label={labelize(order.orderStatus)} tone={statusTone(order.orderStatus)} />
                  <StatusPill label={labelize(order.paymentStatus)} tone={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'PAYMENT_FAILED' ? 'error' : 'warning'} />
                </XStack>
              </XStack>
              <XStack flexWrap="wrap" gap="$2">
                {isDigital ? <StatusPill label={labelize(order.digitalAccessStatus ?? 'ACCESS_READY')} tone="info" /> : null}
                {isElectronics ? <StatusPill label={labelize(order.shippingStatus ?? 'TRACKING_NOT_AVAILABLE')} tone={order.trackingAvailable ? 'info' : 'warning'} /> : null}
                <StatusPill label={labelize(order.refundDisputeStatus)} tone={order.refundDisputeStatus === 'NONE' ? 'success' : order.refundDisputeStatus.includes('DISPUTE') ? 'error' : 'warning'} />
                <StatusPill label={order.sellerVerified ? 'Verified Seller' : 'Seller Review'} tone={order.sellerVerified ? 'success' : 'warning'} />
              </XStack>
            </YStack>
          </XStack>

          <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} gap="$2" p="$3">
            {isDigital ? <Paragraph>Digital access actions stay protected in My Library. This list never reveals codes or starts downloads directly.</Paragraph> : null}
            {isElectronics ? <Paragraph>{order.trackingAvailable ? 'Tracking summary is available for this shipment.' : 'Tracking will be available after the seller ships your item.'}</Paragraph> : null}
          </YStack>

          <XStack flexWrap="wrap" gap="$2">
            <Button theme="purple" onPress={onViewDetails}>View Details</Button>
            {isDigital ? <Button onPress={onGoToLibrary}>Go to Library</Button> : null}
            {isElectronics ? <Button onPress={onTrackPackage}>Track Package</Button> : null}
            <Button onPress={onViewReceipt}>View Receipt</Button>
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
});

function SummaryCounts({ orders }: { orders: OrdersResponse }) {
  const items = [
    ['All', orders.summaryCounts.all],
    ['Digital', orders.summaryCounts.digital],
    ['Electronics', orders.summaryCounts.electronics],
    ['Access Ready', orders.summaryCounts.accessReady],
    ['Shipped', orders.summaryCounts.shipped],
    ['Refunded', orders.summaryCounts.refunded],
    ['Disputed', orders.summaryCounts.disputed]
  ];
  return (
    <XStack flexWrap="wrap" gap="$2">
      {items.map(([label, count]) => (
        <StatusPill key={label} label={`${label}: ${count}`} tone="info" />
      ))}
    </XStack>
  );
}

function LoadingState() {
  return (
    <YStack gap="$3">
      {[0, 1, 2].map((item) => (
        <PremiumCard key={item} p="$5">
          <YStack gap="$3">
            <YStack bg="$gray4" br="$4" h={18} w="65%" />
            <YStack bg="$gray3" br="$4" h={96} w="100%" />
          </YStack>
        </PremiumCard>
      ))}
    </YStack>
  );
}

function CenteredState({ actionLabel, message, onAction, subtitle }: { actionLabel: string; message: string; onAction: () => void; subtitle?: string }) {
  return (
    <YStack ai="center" jc="center" minHeight={320} p="$5">
      <PremiumCard maxWidth={560} p="$6" width="100%">
        <YStack ai="center" gap="$4">
          <Text fontSize="$6" fontWeight="900" ta="center">{message}</Text>
          {subtitle ? <Paragraph ta="center">{subtitle}</Paragraph> : null}
          <Button theme="purple" onPress={onAction}>{actionLabel}</Button>
        </YStack>
      </PremiumCard>
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

function matchesFilterValue(order: OrderListItem, filter: OrderFilter) {
  if (filter === 'All') {
    return true;
  }
  if (filter === 'Digital') {
    return order.marketplaceCode === 'DIGITAL';
  }
  if (filter === 'Electronics') {
    return order.marketplaceCode === 'ELECTRONICS';
  }
  if (filter === 'Processing') {
    return ['ORDER_CREATED', 'PROCESSING'].includes(order.orderStatus);
  }
  if (filter === 'Access Ready') {
    return ['ACCESS_READY', 'CODE_REVEAL_AVAILABLE', 'DOWNLOAD_READY'].includes(order.digitalAccessStatus ?? '');
  }
  if (filter === 'Shipping Pending') {
    return order.orderStatus === 'SHIPPING_PENDING' || order.shippingStatus === 'SHIPPING_PENDING';
  }
  if (filter === 'Shipped') {
    return order.orderStatus === 'SHIPPED' || order.shippingStatus === 'SHIPPED';
  }
  if (filter === 'Delivered') {
    return order.orderStatus === 'DELIVERED' || order.shippingStatus === 'DELIVERED';
  }
  if (filter === 'Cancelled') {
    return order.orderStatus === 'CANCELLED';
  }
  if (filter === 'Refunded') {
    return order.orderStatus === 'REFUNDED' || order.paymentStatus === 'REFUNDED';
  }
  if (filter === 'Disputed') {
    return order.refundDisputeStatus.includes('DISPUTE');
  }
  return order.orderStatus === 'SELLER_DELIVERY_PENDING';
}

function sortOrders(orders: OrderListItem[], sort: OrderSort) {
  return [...orders].sort((a, b) => {
    if (sort === 'Oldest First') {
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    }
    if (sort === 'Highest Amount') {
      return b.totalAmount - a.totalAmount;
    }
    if (sort === 'Lowest Amount') {
      return a.totalAmount - b.totalAmount;
    }
    if (sort === 'Recently Updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sort === 'Status') {
      return a.orderStatus.localeCompare(b.orderStatus);
    }
    if (sort === 'Marketplace') {
      return a.marketplaceName.localeCompare(b.marketplaceName);
    }
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });
}

function statusTone(status: string): 'error' | 'info' | 'success' | 'warning' {
  if (['PAID', 'ACCESS_READY', 'DELIVERED', 'COMPLETED'].includes(status)) {
    return 'success';
  }
  if (['CANCELLED', 'REFUNDED', 'DISPUTED', 'FAILED', 'PAYMENT_FAILED'].includes(status)) {
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

function groupLabel(order: OrderListItem) {
  return `Newest first - ${new Date(order.orderDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
