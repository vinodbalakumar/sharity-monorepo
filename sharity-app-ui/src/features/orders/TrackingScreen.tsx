import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H1, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { colors } from '../../theme';
import { InteriorShell } from '../../components/appShell';
import type { AppRoute } from '../../types/navigation';
import { getOrderTracking, reportDeliveryIssue } from './trackingMockApi';
import type { TrackingDetailsResponse, TrackingTimelineEvent } from './trackingTypes';

type TrackingScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenRefundReturn?: (orderId: string) => void;
  orderId: string | null;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const TimelineFlashList = FlashList as unknown as (props: {
  data: TrackingTimelineEvent[];
  estimatedItemSize: number;
  keyExtractor: (item: TrackingTimelineEvent) => string;
  renderItem: (info: { index: number; item: TrackingTimelineEvent }) => ReactElement;
}) => ReactElement;

export function TrackingScreen({ onNavigate, onOpenRefundReturn, orderId }: TrackingScreenProps) {
  const [tracking, setTracking] = useState<TrackingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const loadTracking = useCallback(async () => {
    if (!orderId) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const response = await getOrderTracking(orderId);
    setTracking(response);
    setError(!response);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  async function submitDeliveryIssue() {
    if (!tracking) {
      return;
    }
    const issue = await reportDeliveryIssue(tracking.tracking.orderId, {
      issueType: tracking.shipmentSummary.status === 'DELIVERED' ? 'NOT_DELIVERED' : 'CARRIER_DELAY',
      message: 'Buyer reported a delivery issue from tracking screen.'
    });
    setMessage(`Delivery issue submitted: ${issue.issueId}`);
  }

  if (loading) {
    return <CenteredState message="Loading tracking..." />;
  }

  if (error || !tracking) {
    return (
      <CenteredState
        actionLabel="Back to Order Details"
        message="We'll show tracking updates once your item ships."
        onAction={() => onNavigate('orderDetails')}
        secondaryActionLabel="Contact Seller"
        onSecondaryAction={() => setMessage('Safe seller contact opens through Sharity Messages.')}
      />
    );
  }

  const canRequestRefund = tracking.availableActions.canRequestRefundReturn && tracking.refundReturnEligibility.canRequestRefundReturn;

  return (
    <InteriorShell onNavigate={onNavigate} title="Track Package" subtitle={`Order ${tracking.tracking.orderReference}`} scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <ShipmentHero tracking={tracking} />
              <ProductSummary tracking={tracking} />
              <CarrierCard tracking={tracking} />
              <SectionTitle title="Tracking Timeline" />
              <TimelineFlashList
                data={tracking.timeline}
                estimatedItemSize={112}
                keyExtractor={(event) => event.eventId}
                renderItem={({ item, index }) => <TimelineEventCard event={item} index={index} />}
              />
            </YStack>

            <YStack gap="$4" width={380} $sm={{ width: '100%' }}>
              <MaskedAddressCard tracking={tracking} />
              <RefundEligibilityCard tracking={tracking} />
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="700">Actions</Text>
                  <Button onPress={() => setMessage(tracking.sellerContactContext.message)}>Contact Seller</Button>
                  <Button onPress={submitDeliveryIssue}>Report Delivery Issue</Button>
                  <Button
                    disabled={!canRequestRefund}
                    theme={canRequestRefund ? 'purple' : undefined}
                    onPress={() => {
                      if (!canRequestRefund) {
                        setMessage(tracking.refundReturnEligibility.reason);
                        return;
                      }
                      if (onOpenRefundReturn) {
                        onOpenRefundReturn(tracking.tracking.orderId);
                        return;
                      }
                      setMessage('Refund / Return Request screen will open in STORY-016.');
                    }}
                  >
                    Request Refund / Return
                  </Button>
                  <Button onPress={() => onNavigate('orderDetails')}>Back to Order Details</Button>
                </YStack>
              </PremiumCard>
            </YStack>
          </XStack>
        </YStack>
      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
    </InteriorShell>
  );
}

function ShipmentHero({ tracking }: { tracking: TrackingDetailsResponse }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

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
            <YStack gap="$2">
              <XStack ai="center" gap="$3">
                <YStack ai="center" bg="$blue4" br="$10" h={52} jc="center" w={52}>
                  <Ionicons color={colors.info} name="cube-outline" size={26} />
                </YStack>
                <YStack>
                  <Text fontSize="$7" fontWeight="700">{tracking.shipmentSummary.headline}</Text>
                  <Paragraph color="$gray10">{tracking.shipmentSummary.message}</Paragraph>
                </YStack>
              </XStack>
            </YStack>
            <StatusPill label={labelize(tracking.shipmentSummary.status)} tone={statusTone(tracking.shipmentSummary.status)} />
          </XStack>
          <XStack flexWrap="wrap" gap="$2">
            {tracking.shipmentSummary.shippedAt ? <StatusPill label={`Shipped ${formatDate(tracking.shipmentSummary.shippedAt)}`} tone="info" /> : null}
            {tracking.shipmentSummary.estimatedDelivery ? <StatusPill label={`ETA ${formatDate(tracking.shipmentSummary.estimatedDelivery)}`} tone="warning" /> : null}
            {tracking.shipmentSummary.deliveredAt ? <StatusPill label={`Delivered ${formatDate(tracking.shipmentSummary.deliveredAt)}`} tone="success" /> : null}
            <StatusPill label={`Updated ${formatDate(tracking.shipmentSummary.lastUpdatedAt)}`} tone="info" />
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

function ProductSummary({ tracking }: { tracking: TrackingDetailsResponse }) {
  const order = tracking.tracking;
  return (
    <PremiumCard p="$4">
      <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
        <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: order.productImageUrl }} style={{ borderRadius: 14, height: 86, width: 86 }} />
        <YStack flex={1} gap="$1">
          <Text fontSize="$6" fontWeight="700">{order.productTitle}</Text>
          <Text color="$gray10">{order.productType} - Qty {order.quantity} - Seller: {order.sellerDisplayName}</Text>
          <Text color="$gray10">Ordered {formatDate(order.orderDate)}</Text>
        </YStack>
        <Text fontSize="$6" fontWeight="700">{formatMoney(order.totalAmount)}</Text>
      </XStack>
    </PremiumCard>
  );
}

function CarrierCard({ tracking }: { tracking: TrackingDetailsResponse }) {
  const carrier = tracking.carrierSummary;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Carrier details</Text>
        {carrier ? (
          <YStack gap="$2">
            <XStack flexWrap="wrap" gap="$2">
              <StatusPill label={carrier.carrierName} tone="info" />
              <StatusPill label={carrier.serviceLevel} tone="info" />
              <StatusPill label={carrier.trackingMaskedReference} tone="warning" />
            </XStack>
            <Paragraph>{carrier.carrierStatusText}</Paragraph>
          </YStack>
        ) : (
          <Paragraph>Carrier details will appear after the seller ships your item.</Paragraph>
        )}
      </YStack>
    </PremiumCard>
  );
}

function MaskedAddressCard({ tracking }: { tracking: TrackingDetailsResponse }) {
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Delivery area</Text>
        <Text fontSize="$6" fontWeight="700">{tracking.maskedAddress.displayText}</Text>
        <Paragraph color="$gray10">Only a masked delivery area is shown here. Full address details are not exposed on tracking.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

function RefundEligibilityCard({ tracking }: { tracking: TrackingDetailsResponse }) {
  const eligibility = tracking.refundReturnEligibility;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Refund / return eligibility</Text>
        <StatusPill label={eligibility.canRequestRefundReturn ? 'Eligible' : 'Not available yet'} tone={eligibility.canRequestRefundReturn ? 'success' : 'warning'} />
        <Paragraph>{eligibility.reason}</Paragraph>
        {eligibility.deadline ? <Text color="$gray10">Review window until {formatDate(eligibility.deadline)}</Text> : null}
      </YStack>
    </PremiumCard>
  );
}

const TimelineEventCard = memo(function TimelineEventCard({ event, index }: { event: TrackingTimelineEvent; index: number }) {
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

  const tone = timelineTone(event.status);

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$3" p="$4">
        <XStack ai="flex-start" gap="$3">
          <YStack ai="center" bg={toneBg(tone)} br="$10" h={40} jc="center" w={40}>
            <Ionicons color={toneColor(tone)} name={timelineIcon(event.status)} size={20} />
          </YStack>
          <YStack flex={1} gap="$1">
            <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$2">
              <Text fontWeight="700">{event.title}</Text>
              <StatusPill label={labelize(event.status)} tone={tone} />
            </XStack>
            <Text>{event.description}</Text>
            <Text color="$gray10" fontSize="$2">{event.occurredAt ? formatDate(event.occurredAt) : 'Waiting for carrier update'}</Text>
          </YStack>
        </XStack>
      </PremiumCard>
    </Animated.View>
  );
});

function SectionTitle({ title }: { title: string }) {
  return <Text fontSize="$6" fontWeight="700">{title}</Text>;
}

function CenteredState({
  actionLabel,
  message,
  onAction,
  onSecondaryAction,
  secondaryActionLabel
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}) {
  return (
    <YStack bg="$background" f={1}>
      <YStack ai="center" f={1} jc="center" p="$5">
        <PremiumCard maxWidth={560} p="$6" width="100%">
          <YStack ai="center" gap="$4">
            <Text fontSize="$6" fontWeight="700" ta="center">{message}</Text>
            <XStack flexWrap="wrap" gap="$2" jc="center">
              {actionLabel && onAction ? <Button theme="blue" onPress={onAction}>{actionLabel}</Button> : null}
              {secondaryActionLabel && onSecondaryAction ? <Button onPress={onSecondaryAction}>{secondaryActionLabel}</Button> : null}
            </XStack>
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

function timelineTone(status: TrackingTimelineEvent['status']): 'error' | 'info' | 'success' | 'warning' {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'CURRENT') {
    return 'info';
  }
  if (status === 'ISSUE') {
    return 'error';
  }
  return 'warning';
}

function statusTone(status: string): 'error' | 'info' | 'success' | 'warning' {
  if (['DELIVERED', 'RETURN_DELIVERED'].includes(status)) {
    return 'success';
  }
  if (['DELIVERY_FAILED'].includes(status)) {
    return 'error';
  }
  if (['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(status)) {
    return 'info';
  }
  return 'warning';
}

function toneBg(tone: 'error' | 'info' | 'success' | 'warning') {
  if (tone === 'success') {
    return '$green4';
  }
  if (tone === 'warning') {
    return '$orange4';
  }
  if (tone === 'error') {
    return '$red4';
  }
  return '$blue4';
}

function toneColor(tone: 'error' | 'info' | 'success' | 'warning') {
  if (tone === 'success') {
    return colors.success;
  }
  if (tone === 'warning') {
    return colors.warning;
  }
  if (tone === 'error') {
    return colors.error;
  }
  return colors.info;
}

function timelineIcon(status: TrackingTimelineEvent['status']) {
  if (status === 'COMPLETED') {
    return 'checkmark';
  }
  if (status === 'CURRENT') {
    return 'navigate-outline';
  }
  if (status === 'ISSUE') {
    return 'alert-outline';
  }
  return 'time-outline';
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
