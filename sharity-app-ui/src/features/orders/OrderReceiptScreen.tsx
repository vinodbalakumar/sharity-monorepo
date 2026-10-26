import { CurrencyAmount, OrderCurrencyContext } from '../../components/ui/CurrencyAmount';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
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
import { emailReceipt, getReceiptByOrder, getReceiptRefundHistory, requestReceiptPdf } from './receiptMockApi';
import type { ReceiptMarketplaceGroup, ReceiptRefundHistoryItem, ReceiptResponse } from './receiptTypes';

type OrderReceiptScreenProps = {
  onNavigate: (route: AppRoute) => void;
  orderId: string | null;
  receiptId?: string | null;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const GroupFlashList = FlashList as unknown as (props: {
  data: ReceiptMarketplaceGroup[];
  estimatedItemSize: number;
  keyExtractor: (item: ReceiptMarketplaceGroup) => string;
  renderItem: (info: { index: number; item: ReceiptMarketplaceGroup }) => ReactElement;
}) => ReactElement;

const RefundFlashList = FlashList as unknown as (props: {
  data: ReceiptRefundHistoryItem[];
  estimatedItemSize: number;
  keyExtractor: (item: ReceiptRefundHistoryItem) => string;
  renderItem: (info: { index: number; item: ReceiptRefundHistoryItem }) => ReactElement;
}) => ReactElement;

export function OrderReceiptScreen({ onNavigate, orderId }: OrderReceiptScreenProps) {
  const expandedGroupId = useSelector(appState$.receipt.expandedGroupId);
  const refundHistoryExpanded = useSelector(appState$.receipt.refundHistoryExpanded);
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'NOT_FOUND' | 'ACCESS_DENIED' | 'NOT_AVAILABLE' | 'LOAD_FAILED' | null>(null);
  const [message, setMessage] = useState('');

  const loadReceipt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextReceipt = await getReceiptByOrder(orderId);
      if (!nextReceipt) { setReceipt(null); setError('NOT_FOUND'); return; }
      setReceipt(nextReceipt);
      appState$.receipt.expandedGroupId.set(nextReceipt.marketplaceGroups[0]?.sellerId ?? '');
      appState$.receipt.refundHistoryExpanded.set(nextReceipt.refundHistory.length > 0);
    } catch { setReceipt(null); setError('NOT_FOUND'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  async function futurePdf() {
    if (!receipt) {
      return;
    }
    await requestReceiptPdf(receipt.receipt.receiptId);
    setMessage('Download PDF is a future receipt action for MVP.');
  }

  async function futureEmail() {
    if (!receipt) {
      return;
    }
    await emailReceipt(receipt.receipt.receiptId);
    setMessage('Email Receipt is a future receipt action for MVP.');
  }

  if (loading) {
    return <CenteredState message="Loading receipt..." />;
  }

  if (error || !receipt) {
    return (
      <CenteredState
        actionLabel={error === 'ACCESS_DENIED' ? 'Back to Orders' : 'Back to Order Details'}
        message={error === 'ACCESS_DENIED' ? 'You do not have permission to view this receipt.' : error === 'NOT_AVAILABLE' ? 'Receipt is not available yet.' : 'Receipt not found.'}
        onAction={() => onNavigate(error === 'ACCESS_DENIED' ? 'orders' : 'orderDetails')}
      />
    );
  }

  const actions = receipt.availableActions;

  return (
    <OrderCurrencyContext.Provider value={receipt.receipt.currency}>
    <InteriorShell onNavigate={onNavigate} title="Order Receipt" subtitle={`Receipt ${receipt.receipt.receiptNumber} - Order ${receipt.receipt.orderReference}`} scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <ReceiptStatusCard receipt={receipt} />
              <SectionTitle title="Marketplace and seller groups" />
              <GroupFlashList
                data={receipt.marketplaceGroups}
                estimatedItemSize={220}
                keyExtractor={(group) => `${group.marketplaceCode}-${group.sellerId}`}
                renderItem={({ item, index }) => (
                  <ReceiptGroupCard
                    expanded={expandedGroupId === item.sellerId}
                    group={item}
                    index={index}
                    onToggle={() => appState$.receipt.expandedGroupId.set(expandedGroupId === item.sellerId ? '' : item.sellerId)}
                  />
                )}
              />
              {receipt.digitalAccessSummary?.hasDigitalItems ? <DigitalAccessCard receipt={receipt} onNavigate={onNavigate} /> : null}
              {receipt.addressSummary ? <AddressSummaryCard receipt={receipt} /> : null}
              {receipt.refundHistory.length > 0 ? (
                <PremiumCard p="$4">
                  <YStack gap="$3">
                    <XStack ai="center" jc="space-between" gap="$3">
                      <Text color="$blue10" fontWeight="700">Refund history</Text>
                      <Button size="$3" onPress={() => appState$.receipt.refundHistoryExpanded.set(!refundHistoryExpanded)}>
                        {refundHistoryExpanded ? 'Hide' : 'Show'}
                      </Button>
                    </XStack>
                    {refundHistoryExpanded ? (
                      <RefundFlashList
                        data={receipt.refundHistory}
                        estimatedItemSize={96}
                        keyExtractor={(item) => item.refundRequestId}
                        renderItem={({ item, index }) => <RefundHistoryCard index={index} item={item} />}
                      />
                    ) : null}
                  </YStack>
                </PremiumCard>
              ) : null}
              <LegalNoteCard receipt={receipt} />
            </YStack>

            <YStack gap="$4" width={420} $sm={{ width: '100%' }}>
              <PaymentSummaryCard receipt={receipt} />
              <FeeBreakdownCard receipt={receipt} />
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="700">Actions</Text>
                  {actions.canBackToOrder ? <Button onPress={() => onNavigate('orderDetails')}>Back to Order Details</Button> : null}
                  {actions.canViewOrders ? <Button onPress={() => onNavigate('orders')}>View Orders</Button> : null}
                  {actions.canGoToLibrary ? <Button theme="blue" onPress={() => onNavigate('library')}>Go to Library</Button> : null}
                  {actions.canTrackPackage ? <Button theme="blue" onPress={() => onNavigate('tracking')}>Track Package</Button> : null}
                  {actions.canContactSupport ? <Button onPress={() => setMessage('Support routing will open /support/orders when backend routing is ready.')}>Contact Support</Button> : null}
                  <Button disabled onPress={futurePdf}>Download PDF Future</Button>
                  <Button disabled onPress={futureEmail}>Email Receipt Future</Button>
                  <Paragraph color="$gray10">MVP receipt is view-only. PDF and email actions stay disabled until backend support is ready.</Paragraph>
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

function ReceiptStatusCard({ receipt }: { receipt: ReceiptResponse }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 260 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 140 });
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <PremiumCard p="$5">
        <YStack gap="$4">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
            <YStack gap="$1">
              <Text fontSize="$7" fontWeight="700">{receipt.receipt.receiptNumber}</Text>
              <Paragraph color="$gray10">Order {receipt.receipt.orderReference} - Checkout {receipt.receipt.checkoutReference}</Paragraph>
              <Text color="$gray10">Paid {formatDate(receipt.receipt.paymentDate)} - Ordered {formatDate(receipt.receipt.orderDate)}</Text>
            </YStack>
            <StatusPill label={labelize(receipt.receipt.receiptStatus)} tone={receipt.receipt.receiptStatus === 'PAID' ? 'success' : 'warning'} />
          </XStack>
          <XStack flexWrap="wrap" gap="$2">
            <StatusPill label={`${receipt.marketplaceGroups.length} marketplace group${receipt.marketplaceGroups.length === 1 ? '' : 's'}`} tone="info" />
            <StatusPill label={receipt.paymentSummary.paymentMethod} tone="info" />
            <StatusPill label={`Total $<CurrencyAmount amount={receipt.paymentSummary.totalPaid} />`} tone="success" />
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

const ReceiptGroupCard = memo(function ReceiptGroupCard({ expanded, group, index, onToggle }: {
  expanded: boolean;
  group: ReceiptMarketplaceGroup;
  index: number;
  onToggle: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

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
        <YStack gap="$3">
          <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
            <YStack ai="center" bg="$blue4" br="$10" h={48} jc="center" w={48}>
              <Ionicons color={colors.info} name={group.marketplaceCode === 'DIGITAL' ? 'key-outline' : 'laptop-outline'} size={22} />
            </YStack>
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="700">{group.marketplaceName}</Text>
              <Text color="$gray10">Seller: {group.sellerDisplayName}</Text>
            </YStack>
            <YStack ai="flex-end" gap="$2">
              <Text fontWeight="700"><CurrencyAmount amount={group.groupSubtotal} /></Text>
              <StatusPill label={group.sellerVerified ? 'Verified seller' : 'Seller review'} tone={group.sellerVerified ? 'success' : 'warning'} />
            </YStack>
          </XStack>
          <Button size="$3" onPress={onToggle}>{expanded ? 'Hide items' : 'Show items'}</Button>
          {expanded ? (
            <YStack gap="$3">
              {group.items.map((item) => <ReceiptItemRow item={item} key={item.productId} />)}
            </YStack>
          ) : null}
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
});

function ReceiptItemRow({ item }: { item: ReceiptMarketplaceGroup['items'][number] }) {
  return (
    <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} p="$3">
      <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
        <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: item.productImageUrl }} style={{ borderRadius: 12, height: 70, width: 70 }} />
        <YStack flex={1} gap="$1">
          <Text fontWeight="700">{item.productTitle}</Text>
          <Text color="$gray10">{item.productType} - Qty {item.quantity}</Text>
          <Text>{item.deliveryStatusSummary}</Text>
          {item.accessStatusSummary ? <Text color="$gray10">{item.accessStatusSummary}</Text> : null}
          {item.shippingStatusSummary ? <Text color="$gray10">{labelize(item.shippingStatusSummary)}</Text> : null}
        </YStack>
        <YStack ai="flex-end">
          <Text fontWeight="700"><CurrencyAmount amount={item.lineTotal} /></Text>
          <Text color="$gray10"><CurrencyAmount amount={item.unitPrice} /> each</Text>
        </YStack>
      </XStack>
    </YStack>
  );
}

function PaymentSummaryCard({ receipt }: { receipt: ReceiptResponse }) {
  const payment = receipt.paymentSummary;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Payment summary</Text>
        <Text fontSize="$8" fontWeight="700"><CurrencyAmount amount={payment.totalPaid} /></Text>
        <StatusPill label={labelize(payment.paymentStatus)} tone={payment.paymentStatus === 'PAID' ? 'success' : 'warning'} />
        <YStack bg="$blue4" br="$5" gap="$1" p="$3">
          <Text fontWeight="700">{payment.paymentProvider}</Text>
          <Text>{payment.paymentMethod} - Reference {payment.safePaymentReference}</Text>
        </YStack>
        <Paragraph color="$gray10">Safe payment reference only. Provider payloads, payer private data, tokens, and internal payment IDs are not shown.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

function FeeBreakdownCard({ receipt }: { receipt: ReceiptResponse }) {
  const fee = receipt.feeBreakdown;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Fee, tax, and discount breakdown</Text>
        <MoneyLine label="Subtotal" value={fee.subtotal} />
        <MoneyLine label="Tax" value={fee.tax} />
        <MoneyLine label="Shipping" value={fee.shipping} />
        <MoneyLine label="Coupon discount" value={-fee.couponDiscount} />
        <MoneyLine label="Marketplace fee" value={fee.marketplaceFee} />
        <YStack h={1} bg="$borderColor" />
        <MoneyLine emphasis label="Total paid" value={fee.totalPaid} />
        {fee.refundAmount > 0 ? <MoneyLine label="Refund amount" value={-fee.refundAmount} /> : null}
        {fee.refundAmount > 0 ? <MoneyLine emphasis label="Net paid after refund" value={fee.netPaidAfterRefund} /> : null}
        <Paragraph color="$gray10">Seller commission, seller payout, reserve, internal margin, and settlement details are not shown.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

function MoneyLine({ emphasis, label, value }: { emphasis?: boolean; label: string; value: number }) {
  return (
    <XStack ai="center" jc="space-between" gap="$3">
      <Text color={emphasis ? '$color' : '$gray10'} fontWeight={emphasis ? '900' : '600'}>{label}</Text>
      <Text fontSize={emphasis ? '$6' : undefined} fontWeight="700"><CurrencyAmount amount={value} /></Text>
    </XStack>
  );
}

function DigitalAccessCard({ onNavigate, receipt }: { onNavigate: (route: AppRoute) => void; receipt: ReceiptResponse }) {
  const access = receipt.digitalAccessSummary;
  if (!access) {
    return null;
  }
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Digital access status</Text>
        <Paragraph>{access.message}</Paragraph>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={labelize(access.accessStatus)} tone="info" />
          <StatusPill label={`Code reveal: ${access.codeRevealAvailable ? 'Available' : 'Not available'}`} tone={access.codeRevealAvailable ? 'success' : 'warning'} />
          <StatusPill label={`Download: ${access.downloadAvailable ? 'Available' : 'Not available'}`} tone={access.downloadAvailable ? 'success' : 'warning'} />
        </XStack>
        <Paragraph color="$gray10">Digital code values, raw download URLs, signed URLs, reveal location, device ID, and risk score are not shown.</Paragraph>
        <Button theme="blue" onPress={() => onNavigate('library')}>Go to Library</Button>
      </YStack>
    </PremiumCard>
  );
}

function AddressSummaryCard({ receipt }: { receipt: ReceiptResponse }) {
  const address = receipt.addressSummary;
  if (!address) {
    return null;
  }
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Address summary</Text>
        {address.billingSummaryAvailable && address.billingDisplayText ? <Text>{address.billingDisplayText}</Text> : <Text color="$gray10">Billing summary unavailable from provider.</Text>}
        {address.shippingSummaryAvailable && address.shippingDisplayText ? <Text>{address.shippingDisplayText}</Text> : null}
        <Paragraph color="$gray10">Receipt uses summary address only for MVP and avoids full address unless policy requires it.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

const RefundHistoryCard = memo(function RefundHistoryCard({ index, item }: { index: number; item: ReceiptRefundHistoryItem }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

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
      <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} mb="$2" p="$3">
        <XStack ai="flex-start" gap="$3">
          <YStack ai="center" bg="$green4" br="$10" h={38} jc="center" w={38}>
            <Ionicons color={colors.success} name="return-down-back-outline" size={20} />
          </YStack>
          <YStack flex={1} gap="$1">
            <Text fontWeight="700">{labelize(item.refundStatus)} - <CurrencyAmount amount={item.refundAmount} /></Text>
            <Text>{item.refundReasonSummary}</Text>
            <Text color="$gray10">{formatDate(item.refundDate)} - {item.safeProviderRefundReference}</Text>
          </YStack>
        </XStack>
      </YStack>
    </Animated.View>
  );
});

function LegalNoteCard({ receipt }: { receipt: ReceiptResponse }) {
  return (
    <PremiumCard p="$4">
      <YStack gap="$2">
        <Text color="$blue10" fontWeight="700">Legal note</Text>
        <Paragraph>{receipt.legalNote}</Paragraph>
        <Paragraph color="$gray10">This receipt does not expose digital codes, seller payout details, or internal marketplace settlement information.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

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

function labelize(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { currency, style: 'currency' }).format(value);
}
