import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Button, Card, H2, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import {
  contactPaymentSupport,
  getCheckoutRecoverySummary,
  getPaymentAttemptStatus,
  retryPayment
} from './paymentMockApi';
import type { CheckoutRecoverySummaryResponse, PaymentAttemptStatusResponse, PaymentFailureStatus, RecoveryOrderGroup } from './paymentTypes';

type PaymentFailedScreenProps = {
  onNavigate: (route: AppRoute) => void;
  status?: PaymentFailureStatus;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const RecoveryFlashList = FlashList as unknown as (props: {
  data: RecoveryOrderGroup[];
  estimatedItemSize: number;
  keyExtractor: (item: RecoveryOrderGroup) => string;
  renderItem: (info: { item: RecoveryOrderGroup }) => ReactElement;
}) => ReactElement;

export function PaymentFailedScreen({ onNavigate, status = 'PAYMENT_CANCELLED' }: PaymentFailedScreenProps) {
  const [attempt, setAttempt] = useState<PaymentAttemptStatusResponse | null>(null);
  const [recovery, setRecovery] = useState<CheckoutRecoverySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  const pulse = useSharedValue(1);

  const loadAttempt = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const attemptData = await getPaymentAttemptStatus(status);
      const recoveryData = await getCheckoutRecoverySummary(attemptData.checkoutId);
      setAttempt(attemptData);
      setRecovery(recoveryData);
      appState$.payment.status.set(attemptData.status);
      appState$.payment.lastAttemptReference.set(attemptData.safeAttemptReference);
      appStorage.setString('lastFailedPaymentAttempt', attemptData.safeAttemptReference);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadAttempt();
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true);
  }, [loadAttempt, pulse]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  const statusCopy = useMemo(() => statusContentFor(attempt?.status ?? status), [attempt?.status, status]);
  const hasDigital = recovery?.groups.some((group) => group.items.some((item) => !item.shippingRequired)) ?? false;

  async function tryAgain() {
    if (!attempt) {
      return;
    }
    appState$.payment.retryLoading.set(true);
    const retry = await retryPayment(attempt.checkoutId);
    appStorage.setString('checkoutRecoveryId', attempt.checkoutId);
    appState$.payment.lastAttemptReference.set(retry.paymentAttemptId);
    appState$.payment.retryLoading.set(false);
    setMessage(`Mock ${retry.provider} retry session created. Return to checkout to continue.`);
  }

  async function support() {
    if (!attempt) {
      return;
    }
    const ticket = await contactPaymentSupport(attempt.paymentAttemptId, attempt.checkoutId);
    setMessage(`Support ticket ${ticket.ticketId} created.`);
  }

  if (loading) {
    return (
      <ScreenShell>
        <CenteredCard>
          <Paragraph>Checking payment status...</Paragraph>
        </CenteredCard>
      </ScreenShell>
    );
  }

  if (error || !attempt || !recovery) {
    return (
      <ScreenShell>
        <CenteredCard>
          <H2>We couldn't load your payment attempt details.</H2>
          <Button theme="purple" onPress={() => onNavigate('cart')}>Go to Cart</Button>
          <Button onPress={support}>Contact Support</Button>
        </CenteredCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1180} mx="auto" p="$5" width="100%">
          <PremiumCard p="$6" theme={statusCopy.tone}>
            <YStack ai="center" gap="$4">
              <Animated.View style={iconStyle}>
                <YStack ai="center" bg="$orange4" br="$10" h={86} jc="center" w={86}>
                  <Ionicons color="orange" name="alert" size={42} />
                </YStack>
              </Animated.View>
              <H2 ta="center">{statusCopy.title}</H2>
              <Paragraph ta="center">{statusCopy.message}</Paragraph>
              <XStack flexWrap="wrap" gap="$3" jc="center">
                <StatusPill label={`Payment method: ${attempt.provider}`} tone="info" />
                <StatusPill label={`Attempt reference: ${attempt.safeAttemptReference}`} tone="warning" />
                <StatusPill label={`Time: ${formatDate(attempt.attemptedAt)}`} tone="info" />
              </XStack>
            </YStack>
          </PremiumCard>

          {hasDigital ? (
          <PremiumCard p="$5">
              <XStack ai="flex-start" gap="$3">
                <Ionicons color="orange" name="lock-closed-outline" size={22} />
                <Paragraph>Digital codes, downloads, subscriptions, and access are not available until payment succeeds.</Paragraph>
              </XStack>
            </PremiumCard>
          ) : null}

          <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <Text fontSize="$7" fontWeight="800">Checkout items, not confirmed order</Text>
              <RecoveryFlashList
                data={recovery.groups}
                estimatedItemSize={240}
                keyExtractor={(item) => `${item.marketplaceCode}-${item.sellerId}`}
                renderItem={({ item }) => <RecoveryGroupCard group={item} />}
              />
              <CommonReasonsCard />
            </YStack>
            <PremiumCard p="$5" width={370} $sm={{ width: '100%' }}>
              <YStack gap="$3">
                <Text fontSize="$6" fontWeight="800">Recover checkout</Text>
                <Button theme="purple" onPress={tryAgain}>{statusCopy.primaryAction}</Button>
                <Button onPress={() => onNavigate('checkout')}>Return to Checkout</Button>
                <Button onPress={() => onNavigate('checkout')}>Change Payment Method</Button>
                <Button onPress={() => onNavigate('cart')}>Go to Cart</Button>
                <Button onPress={support}>Contact Support</Button>
                <Button onPress={() => onNavigate('marketplaces')}>Continue Shopping</Button>
                <Paragraph color="$gray10">Cart is preserved. Checkout must refresh prices, stock, coupons, and product availability before retry.</Paragraph>
                <Text fontWeight="800">Total attempted: {formatMoney(recovery.summary.totalPayable)}</Text>
              </YStack>
            </PremiumCard>
          </XStack>
        </YStack>
      </ScrollView>
      {message ? (
        <YStack b="$4" l="$4" position="absolute" r="$4">
          <PremiumCard p="$4">
            <XStack ai="center" jc="space-between" gap="$3">
              <Paragraph>{message}</Paragraph>
              <Button size="$2" onPress={() => setMessage('')}>Dismiss</Button>
            </XStack>
          </PremiumCard>
        </YStack>
      ) : null}
    </ScreenShell>
  );
}

function RecoveryGroupCard({ group }: { group: RecoveryOrderGroup }) {
  return (
    <PremiumCard mb="$4" p="$5">
      <YStack gap="$4">
        <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
          <YStack>
            <Text fontSize="$6" fontWeight="800">{group.marketplaceName}</Text>
            <Paragraph>Seller: {group.sellerDisplayName}</Paragraph>
          </YStack>
          <XStack flexWrap="wrap" gap="$2">
            <StatusPill label={group.sellerVerified ? 'Verified Seller' : 'Seller Review'} tone="info" />
            <StatusPill label={group.shippingRequired ? 'Shipping required' : 'No shipping'} tone={group.shippingRequired ? 'warning' : 'info'} />
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
      </YStack>
    </PremiumCard>
  );
}

function CommonReasonsCard() {
  const reasons = [
    'Payment was cancelled before completion.',
    'Payment was declined by the provider.',
    'The payment session expired.',
    'PayPal authorization failed.',
    'Network connection was interrupted.',
    'Product price or availability changed.',
    'The provider was temporarily unavailable.'
  ];

  return (
    <PremiumCard p="$5">
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="800">Why this may have happened</Text>
        {reasons.map((reason) => (
          <Paragraph key={reason}>- {reason}</Paragraph>
        ))}
      </YStack>
    </PremiumCard>
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

function StatusPill({ label, tone }: { label: string; tone: 'info' | 'warning' }) {
  const theme = tone === 'warning' ? 'orange' : 'blue';
  return (
    <YStack bg={`$${theme}4`} br="$10" px="$3" py="$2">
      <Text color={`$${theme}11`} fontSize="$2" fontWeight="800">{label}</Text>
    </YStack>
  );
}

function statusContentFor(status: PaymentFailureStatus) {
  const content: Record<PaymentFailureStatus, { message: string; primaryAction: string; title: string; tone: 'orange' | 'red' }> = {
    PAYMENT_CANCELLED: {
      message: 'Your payment was cancelled. You can return to checkout and try again.',
      primaryAction: 'Return to Checkout',
      title: 'Payment Cancelled',
      tone: 'orange'
    },
    PAYMENT_DECLINED: {
      message: 'Your payment was declined. Please try again or choose another payment method.',
      primaryAction: 'Change Payment Method',
      title: 'Payment Declined',
      tone: 'orange'
    },
    PAYMENT_FAILED: {
      message: "We couldn't complete your payment. Please try again or choose another payment method.",
      primaryAction: 'Try Payment Again',
      title: "Payment Couldn't Be Completed",
      tone: 'red'
    },
    PAYMENT_PROVIDER_ERROR: {
      message: 'The payment provider could not process this request. Please try again or contact support.',
      primaryAction: 'Try Payment Again',
      title: 'Payment Provider Unavailable',
      tone: 'orange'
    },
    PAYMENT_SESSION_EXPIRED: {
      message: 'Your payment session expired. Please return to checkout and try again.',
      primaryAction: 'Return to Checkout',
      title: 'Payment Session Expired',
      tone: 'orange'
    },
    PAYMENT_UNKNOWN: {
      message: 'We could not confirm your payment status. Please check your orders or contact support.',
      primaryAction: 'Go to Orders',
      title: 'Payment Status Unknown',
      tone: 'orange'
    }
  };
  return content[status];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}
