import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H2, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import {
  getOrderConfirmationSummary,
  getPaymentConfirmation,
  getReceipt
} from './paymentMockApi';
import type { OrderConfirmationResponse, OrderGroupSummary, ReceiptResponse } from './paymentTypes';

type PaymentSuccessScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const OrderGroupFlashList = FlashList as unknown as (props: {
  data: OrderGroupSummary[];
  estimatedItemSize: number;
  keyExtractor: (item: OrderGroupSummary) => string;
  renderItem: (info: { index: number; item: OrderGroupSummary }) => ReactElement;
}) => ReactElement;

export function PaymentSuccessScreen({ onNavigate }: PaymentSuccessScreenProps) {
  const [confirmation, setConfirmation] = useState<OrderConfirmationResponse | null>(null);
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  const loadConfirmation = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const payment = await getPaymentConfirmation('payment-session-001');
      const order = await getOrderConfirmationSummary(payment.checkoutId);
      const receiptData = await getReceipt(order.orderGroups[0]?.orderId ?? 'order-digital-001');
      setConfirmation(order);
      setReceipt(receiptData);
      appState$.cart.count.set(0);
      appState$.payment.status.set('SUCCESS');
      appState$.payment.lastSuccessfulOrderId.set(order.orderGroups[0]?.orderId ?? '');
      appStorage.setString('lastSuccessfulOrderId', order.orderGroups[0]?.orderId ?? '');
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfirmation();
    scale.value = withSpring(1, { damping: 12, stiffness: 130 });
    opacity.value = withTiming(1, { duration: 320 });
  }, [loadConfirmation, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const isDigitalOnly = useMemo(() => confirmation?.orderGroups.every((group) => group.marketplaceCode === 'DIGITAL') ?? false, [confirmation]);

  if (loading) {
    return (
      <ScreenShell>
        <CenteredCard>
          <Paragraph color="$color">Confirming your order...</Paragraph>
        </CenteredCard>
      </ScreenShell>
    );
  }

  if (error || !confirmation) {
    return (
      <ScreenShell>
        <CenteredCard>
          <H2 color="$color">Payment was received, but we could not load your order details.</H2>
          <Button theme="blue" onPress={() => onNavigate('orders')}>Go to Orders</Button>
          <Button onPress={() => onNavigate('marketplaces')}>Contact Support</Button>
        </CenteredCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1180} mx="auto" p="$5" width="100%">
          <Animated.View style={animatedStyle}>
            <PremiumCard p="$6" theme="green">
              <YStack ai="center" gap="$4">
                <YStack ai="center" bg="$green5" br="$10" h={86} jc="center" w={86}>
                  <Ionicons color="green" name="checkmark" size={48} />
                </YStack>
                <H2 ta="center">Order Confirmed</H2>
                <Paragraph ta="center">Your payment was successful and your order has been created.</Paragraph>
                <XStack flexWrap="wrap" gap="$3" jc="center">
                  <StatusPill label="Payment: PayPal" tone="success" />
                  <StatusPill label={`Reference: ${confirmation.safePaymentReference}`} tone="info" />
                  <StatusPill label={confirmation.notificationMessage} tone="info" />
                </XStack>
              </YStack>
            </PremiumCard>
          </Animated.View>

          <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <Text color="$color" fontSize="$7" fontWeight="800">Order groups</Text>
              <OrderGroupFlashList
                data={confirmation.orderGroups}
                estimatedItemSize={260}
                keyExtractor={(item) => item.orderId}
                renderItem={({ item, index }) => <SuccessOrderGroupCard group={item} index={index} onNavigate={onNavigate} />}
              />
            </YStack>
            <PremiumCard p="$5" width={360} $sm={{ width: '100%' }}>
              <YStack gap="$4">
                <Text fontSize="$6" fontWeight="800">Next steps</Text>
                <Button theme="purple" onPress={() => onNavigate(isDigitalOnly ? 'library' : 'orders')}>
                  {isDigitalOnly ? 'Go to Library' : 'View Order Details'}
                </Button>
                <Button onPress={() => onNavigate('marketplaces')}>Continue Shopping</Button>
                <Button onPress={() => appState$.payment.receiptModalOpen.set(true)}>View Receipt</Button>
                {confirmation.orderGroups.some((group) => group.marketplaceCode === 'DIGITAL') ? <Button onPress={() => onNavigate('library')}>Go to Library</Button> : null}
                {receipt ? (
                  <YStack gap="$2">
                    <Text color="$gray10">Receipt {receipt.receiptId}</Text>
                    <Text color="$gray10">Total {formatMoney(receipt.total)}</Text>
                  </YStack>
                ) : null}
              </YStack>
            </PremiumCard>
          </XStack>
        </YStack>
      </ScrollView>
    </ScreenShell>
  );
}

function SuccessOrderGroupCard({ group, index, onNavigate }: { group: OrderGroupSummary; index: number; onNavigate: (route: AppRoute) => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(index * 80, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const isDigital = group.marketplaceCode === 'DIGITAL';
  const canViewCode = group.availableActions.includes('VIEW_CODE');
  const canDownload = group.availableActions.includes('DOWNLOAD_FILE');

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$4" p="$5">
        <YStack gap="$4">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="800">{group.marketplaceName}</Text>
              <Paragraph>Seller: {group.sellerDisplayName}</Paragraph>
              <Paragraph>Order ID: {group.orderId}</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <StatusPill label={group.sellerVerified ? 'Verified Seller' : 'Seller Review'} tone="success" />
              <StatusPill label={group.paymentStatus} tone="success" />
              <StatusPill label={isDigital ? group.digitalAccessStatus ?? group.fulfillmentStatus : group.shippingStatus ?? group.fulfillmentStatus} tone={isDigital ? 'success' : 'warning'} />
            </XStack>
          </XStack>
          {group.items.map((item) => (
            <XStack key={item.productId} ai="center" gap="$3">
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                placeholder={blurhash}
                source={{ uri: item.productImageUrl }}
                style={{ borderRadius: 14, height: 58, width: 58 }}
              />
              <YStack flex={1}>
                <Text fontWeight="800">{item.productTitle}</Text>
                <Text color="$gray10">{item.productType.replaceAll('_', ' ')} - Qty {item.quantity}</Text>
              </YStack>
              <Text fontWeight="800">{formatMoney(item.price)}</Text>
            </XStack>
          ))}
          <XStack flexWrap="wrap" gap="$2">
            {isDigital ? <Button onPress={() => onNavigate('library')}>Go to Library</Button> : null}
            {canDownload ? <Button onPress={() => onNavigate('library')}>Download File</Button> : null}
            {canViewCode ? <Button onPress={() => onNavigate('library')}>View Code</Button> : null}
            <Button onPress={() => onNavigate('orders')}>View Order Details</Button>
            {!isDigital ? <Button onPress={() => onNavigate('marketplaces')}>Track Shipping</Button> : null}
            {!isDigital ? <Button onPress={() => onNavigate('marketplaces')}>Contact Seller</Button> : null}
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

function ScreenShell({ children }: { children: ReactNode }) {
  return <YStack bg="$background" f={1}>{children}</YStack>;
}

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <YStack ai="center" f={1} jc="center" p="$5">
      <PremiumCard maxWidth={560} p="$6" width="100%">
        <YStack gap="$4">{children}</YStack>
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

function StatusPill({ label, tone }: { label: string; tone: 'info' | 'success' | 'warning' }) {
  const theme = tone === 'success' ? 'green' : tone === 'warning' ? 'orange' : 'blue';
  return (
    <YStack bg={`$${theme}4`} br="$10" px="$3" py="$2">
      <Text color={`$${theme}11`} fontSize="$2" fontWeight="800">{label}</Text>
    </YStack>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
