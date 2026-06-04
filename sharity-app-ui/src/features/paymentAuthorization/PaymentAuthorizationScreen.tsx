import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H1, H2, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { getPaymentAuthorization, retryAuthorization, startPayPalAuthorization } from './paymentAuthorizationMockApi';
import type { PaymentAuthorizationScreenResponse, PaymentTimelineEvent, SellerOrderAuthorizationStatus } from './paymentAuthorizationTypes';

type Props = { onNavigate: (route: AppRoute) => void };
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const SellerList = FlashList as unknown as (props: { data: SellerOrderAuthorizationStatus[]; estimatedItemSize: number; keyExtractor: (item: SellerOrderAuthorizationStatus) => string; renderItem: (info: { item: SellerOrderAuthorizationStatus; index: number }) => ReactElement }) => ReactElement;
const TimelineList = FlashList as unknown as (props: { data: PaymentTimelineEvent[]; estimatedItemSize: number; keyExtractor: (item: PaymentTimelineEvent) => string; renderItem: (info: { item: PaymentTimelineEvent; index: number }) => ReactElement }) => ReactElement;

export function PaymentAuthorizationScreen({ onNavigate }: Props) {
  const selectedProvider = useSelector(appState$.paymentAuthorization.selectedProvider);
  const [response, setResponse] = useState<PaymentAuthorizationScreenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setResponse(await getPaymentAuthorization());
    const stored = appStorage.getString('paymentAuthorizationProvider');
    if (stored) appState$.paymentAuthorization.selectedProvider.set(stored);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function authorize() {
    appState$.paymentAuthorization.authorizationStatus.set('REDIRECTING');
    const result = await startPayPalAuthorization();
    setMessage(result.message);
    appState$.paymentAuthorization.authorizationStatus.set('AUTHORIZED');
    await load();
  }

  async function retry() {
    appState$.paymentAuthorization.retryLoading.set(true);
    const result = await retryAuthorization();
    setMessage(result.message);
    appState$.paymentAuthorization.retryLoading.set(false);
  }

  if (loading) return <YStack bg="$background" f={1} p="$5"><CenteredState title="Preparing secure payment authorization..." /></YStack>;
  if (!response) return <YStack bg="$background" f={1} p="$5"><CenteredState title="Payment authorization unavailable." /></YStack>;

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1220} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack flex={1} gap="$2">
              <Text color="$blue10" fontWeight="800">Secure PayPal-first authorization</Text>
              <H1>Payment Authorization</H1>
              <Paragraph color="$gray10">Authorize payment securely. Some seller orders may require acceptance before capture.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button icon={<Ionicons name="arrow-back" size={18} />} onPress={() => onNavigate('cart')}>Back to Cart</Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger><Button icon={<Ionicons name="ellipsis-horizontal" size={18} />}>More</Button></DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item key="support" onSelect={() => setMessage('Support mock flow ready.')}>Contact Support</DropdownMenu.Item>
                  <DropdownMenu.Item key="orders" onSelect={() => onNavigate('orders')}>View Order Status</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </XStack>
          </XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <Notice response={response} />
              <PremiumCard p="$5">
                <YStack gap="$4">
                  <H2>Seller Acceptance Status</H2>
                  <SellerList data={response.sellerOrderAuthorizationStatuses} estimatedItemSize={210} keyExtractor={(item) => item.sellerOrderId} renderItem={({ item, index }) => <SellerOrderRow index={index} order={item} />} />
                </YStack>
              </PremiumCard>
              <PremiumCard p="$5">
                <YStack gap="$4">
                  <H2>Payment Timeline</H2>
                  <TimelineList data={response.paymentTimeline} estimatedItemSize={108} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <TimelineRow event={item} index={index} />} />
                </YStack>
              </PremiumCard>
            </YStack>
            <YStack gap="$4" width={390} $md={{ width: '100%' }}>
              <ProviderPanel selectedProvider={selectedProvider} response={response} onAuthorize={authorize} />
              <PricingSummary response={response} />
              <DigitalDelivery response={response} />
              <FailedAuthorization onRetry={retry} onReturnCart={() => onNavigate('cart')} />
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function ProviderPanel({ response, selectedProvider, onAuthorize }: { response: PaymentAuthorizationScreenResponse; selectedProvider: string; onAuthorize: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$3"><H2>Payment Provider</H2>{response.paymentProviderOptions.map((provider) => <XStack key={provider.providerCode} ai="center" gap="$3"><Image source="marketplace/placeholders/gift_cards.png" placeholder={blurhash} style={{ width: 38, height: 38, borderRadius: 8 }} /><YStack flex={1}><Text fontWeight="900">{provider.providerName}</Text><Text color="$gray10">{provider.message}</Text></YStack><Badge label={provider.enabled ? (provider.providerCode === selectedProvider ? 'Selected' : 'Available') : 'Coming Later'} tone={provider.enabled ? 'success' : 'warning'} /></XStack>)}<Button theme="purple" onPress={onAuthorize}>Authorize with PayPal</Button><Button disabled>Authorize with Stripe Later</Button></YStack></PremiumCard>;
}

function Notice({ response }: { response: PaymentAuthorizationScreenResponse }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Badge label="Authorization-first notice" tone="info" /><Paragraph color="$gray10">{response.authorizationNotice}</Paragraph><Paragraph color="$gray10">{response.sellerAcceptanceSummary.message}</Paragraph></YStack></PremiumCard>;
}

const SellerOrderRow = memo(function SellerOrderRow({ order, index }: { order: SellerOrderAuthorizationStatus; index: number }) {
  const style = useEntrance(index);
  const tone = order.acceptanceStatus === 'ACCEPTED' ? 'success' : order.acceptanceStatus === 'REJECTED' ? 'critical' : 'warning';
  return <Animated.View style={style}><PremiumCard mb="$3" p="$4"><YStack gap="$3"><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3"><YStack flex={1}><Text fontWeight="900">{order.storeName}</Text><Paragraph color="$gray10">{order.sellerOrderReference} • {order.sellerAlias} • {order.productTypeSummary}</Paragraph></YStack><Badge label={order.acceptanceStatus} tone={tone} /></XStack><XStack flexWrap="wrap" gap="$2"><Badge label={`Authorized ${money(order.amountAuthorized)}`} tone="info" /><Badge label={`Captured ${money(order.amountCaptured)}`} tone="success" /><Badge label={`Released ${money(order.amountReleased)}`} tone={order.amountReleased > 0 ? 'critical' : 'info'} /><Badge label={order.digitalDeliveryStatus} tone={order.digitalDeliveryStatus.includes('READY') ? 'success' : 'warning'} /></XStack><Paragraph color="$gray10">{order.nextStep}</Paragraph></YStack></PremiumCard></Animated.View>;
});

function TimelineRow({ event, index }: { event: PaymentTimelineEvent; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Badge label={event.status} tone={event.status === 'CRITICAL' ? 'critical' : event.status === 'WARNING' ? 'warning' : event.status === 'SUCCESS' ? 'success' : 'info'} /><YStack flex={1}><Text fontWeight="900">{event.title}</Text><Paragraph color="$gray10">{event.description}</Paragraph></YStack></XStack></Animated.View>;
}

function PricingSummary({ response }: { response: PaymentAuthorizationScreenResponse }) {
  const p = response.pricingSummary;
  return <PremiumCard p="$5"><YStack gap="$3"><H2>Final Pricing</H2><Price label="Items total" value={p.itemsTotal} /><Price label="Seller discounts" value={-p.sellerDiscounts} /><Price label="Platform discounts" value={-p.platformDiscounts} /><Price label="Buyer service fee" value={p.buyerServiceFee} /><Price label="Total authorized" value={p.totalAuthorizationAmount} strong /><Price label="Captured" value={p.totalCapturedAmount} /><Price label="Released" value={p.totalReleasedAmount} /><Paragraph color="$gray10">Buyer-safe totals only. Seller commission, fee waiver rules, and provider payloads are hidden.</Paragraph></YStack></PremiumCard>;
}

function DigitalDelivery({ response }: { response: PaymentAuthorizationScreenResponse }) {
  return <PremiumCard p="$5"><YStack gap="$2"><H2>Digital Delivery</H2><Badge label={response.digitalDeliveryEligibility.status} tone={response.digitalDeliveryEligibility.eligible ? 'success' : 'warning'} /><Paragraph color="$gray10">{response.digitalDeliveryEligibility.message}</Paragraph></YStack></PremiumCard>;
}

function FailedAuthorization({ onRetry, onReturnCart }: { onRetry: () => void; onReturnCart: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$3"><H2>Retry Options</H2><Button onPress={onRetry} theme="purple">Retry Payment</Button><Button disabled>Choose Another Provider Later</Button><Button onPress={onReturnCart}>Return to Cart</Button></YStack></PremiumCard>;
}

function Price({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{money(value)}</Text></XStack>;
}

function CenteredState({ title }: { title: string }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function money(value: number) { const sign = value < 0 ? '-' : ''; return `${sign}$${Math.abs(value).toFixed(2)}`; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
