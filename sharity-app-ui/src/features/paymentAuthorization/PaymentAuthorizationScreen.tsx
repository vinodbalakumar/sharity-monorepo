import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { placeholderImageUrl } from '../../utils/mockImages';
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
    try { setResponse(await getPaymentAuthorization()); }
    catch { setResponse(null); }
    const stored = appStorage.getString('paymentAuthorizationProvider');
    if (stored) appState$.paymentAuthorization.selectedProvider.set(stored);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function authorize() {
    appState$.paymentAuthorization.authorizationStatus.set('REDIRECTING');
    try {
      const result = await startPayPalAuthorization(); setMessage(result.message);
      // The provider/backend status determines authorization, never the click.
      await load();
    } catch { setMessage('Unable to start payment authorization. Please return to checkout.'); }
  }

  async function retry() {
    appState$.paymentAuthorization.retryLoading.set(true);
    try { const result = await retryAuthorization(); setMessage(result.message); }
    catch { setMessage('Unable to retry payment authorization. Please try again later.'); }
    finally { appState$.paymentAuthorization.retryLoading.set(false); }
  }

  if (loading) return <InteriorShell onNavigate={onNavigate} title="Payment Authorization" subtitle="Please wait..." scrollable={false}><CenteredCard title="Preparing secure payment authorization..." /></InteriorShell>;
  if (!response) return <InteriorShell onNavigate={onNavigate} title="Error" subtitle="Authorization unavailable" scrollable={false}><CenteredCard title="Payment authorization unavailable." /></InteriorShell>;

  return (
    <InteriorShell onNavigate={onNavigate} title="Payment Authorization" subtitle="Authorize payment securely" scrollable={true}>
      <YStack gap="$5" maxWidth={1220} mx="auto" width="100%">
        <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <Notice response={response} />
              <PremiumCard p="$5">
                <YStack gap="$4">
                  <Text fontSize="$6" fontWeight="700">Seller Acceptance Status</Text>
                  <SellerList data={response.sellerOrderAuthorizationStatuses} estimatedItemSize={210} keyExtractor={(item) => item.sellerOrderId} renderItem={({ item, index }) => <SellerOrderRow index={index} order={item} />} />
                </YStack>
              </PremiumCard>
              <PremiumCard p="$5">
                <YStack gap="$4">
                  <Text fontSize="$6" fontWeight="700">Payment Timeline</Text>
                  <TimelineList data={response.paymentTimeline} estimatedItemSize={108} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <TimelineRow event={item} index={index} />} />
                </YStack>
              </PremiumCard>
            </YStack>
            <YStack gap="$4" width={390} $md={{ width: '100%' }}>
              <ProviderPanel selectedProvider={selectedProvider} response={response} onAuthorize={authorize} />
              <PricingSummary response={response} />
              <DigitalDelivery response={response} />
              <FailedAuthorization onRetry={retry} onReturnCart={() => onNavigate('cart')} />
              {message ? <PremiumCard p="$4"><Paragraph color="$blue10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
      </YStack>
    </InteriorShell>
  );
}

function ProviderPanel({ response, selectedProvider, onAuthorize }: { response: PaymentAuthorizationScreenResponse; selectedProvider: string; onAuthorize: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="700">Payment Provider</Text>{response.paymentProviderOptions.map((provider) => <XStack key={provider.providerCode} ai="center" gap="$3"><Image source={placeholderImageUrl('gift_cards')} placeholder={blurhash} style={{ width: 38, height: 38, borderRadius: 8 }} /><YStack flex={1}><Text fontWeight="700">{provider.providerName}</Text><Text color="$gray10">{provider.message}</Text></YStack><Badge label={provider.enabled ? (provider.providerCode === selectedProvider ? 'Selected' : 'Available') : 'Coming Later'} tone={provider.enabled ? 'success' : 'warning'} /></XStack>)}<Button theme="blue" onPress={onAuthorize}>Authorize with PayPal</Button><Button disabled>Authorize with Stripe Later</Button></YStack></PremiumCard>;
}

function Notice({ response }: { response: PaymentAuthorizationScreenResponse }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Badge label="Authorization-first notice" tone="info" /><Paragraph color="$gray10">{response.authorizationNotice}</Paragraph><Paragraph color="$gray10">{response.sellerAcceptanceSummary.message}</Paragraph></YStack></PremiumCard>;
}

const SellerOrderRow = memo(function SellerOrderRow({ order, index }: { order: SellerOrderAuthorizationStatus; index: number }) {
  const style = useEntrance(index);
  const tone = order.acceptanceStatus === 'ACCEPTED' ? 'success' : order.acceptanceStatus === 'REJECTED' ? 'critical' : 'warning';
  return <Animated.View style={style}><PremiumCard mb="$3" p="$4"><YStack gap="$3"><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3"><YStack flex={1}><Text fontWeight="700">{order.storeName}</Text><Paragraph color="$gray10">{order.sellerOrderReference} • {order.sellerAlias} • {order.productTypeSummary}</Paragraph></YStack><Badge label={order.acceptanceStatus} tone={tone} /></XStack><XStack flexWrap="wrap" gap="$2"><Badge label={`Authorized ${money(order.amountAuthorized)}`} tone="info" /><Badge label={`Captured ${money(order.amountCaptured)}`} tone="success" /><Badge label={`Released ${money(order.amountReleased)}`} tone={order.amountReleased > 0 ? 'critical' : 'info'} /><Badge label={order.digitalDeliveryStatus} tone={order.digitalDeliveryStatus.includes('READY') ? 'success' : 'warning'} /></XStack><Paragraph color="$gray10">{order.nextStep}</Paragraph></YStack></PremiumCard></Animated.View>;
});

function TimelineRow({ event, index }: { event: PaymentTimelineEvent; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Badge label={event.status} tone={event.status === 'CRITICAL' ? 'critical' : event.status === 'WARNING' ? 'warning' : event.status === 'SUCCESS' ? 'success' : 'info'} /><YStack flex={1}><Text fontWeight="700">{event.title}</Text><Paragraph color="$gray10">{event.description}</Paragraph></YStack></XStack></Animated.View>;
}

function PricingSummary({ response }: { response: PaymentAuthorizationScreenResponse }) {
  const p = response.pricingSummary;
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="700">Final Pricing</Text><Price label="Items total" value={p.itemsTotal} /><Price label="Seller discounts" value={-p.sellerDiscounts} /><Price label="Platform discounts" value={-p.platformDiscounts} /><Price label="Buyer service fee" value={p.buyerServiceFee} /><Price label="Total authorized" value={p.totalAuthorizationAmount} strong /><Price label="Captured" value={p.totalCapturedAmount} /><Price label="Released" value={p.totalReleasedAmount} /><Paragraph color="$gray10">Buyer-safe totals only. Seller commission, fee waiver rules, and provider payloads are hidden.</Paragraph></YStack></PremiumCard>;
}

function DigitalDelivery({ response }: { response: PaymentAuthorizationScreenResponse }) {
  return <PremiumCard p="$5"><YStack gap="$2"><Text fontSize="$6" fontWeight="700">Digital Delivery</Text><Badge label={response.digitalDeliveryEligibility.status} tone={response.digitalDeliveryEligibility.eligible ? 'success' : 'warning'} /><Paragraph color="$gray10">{response.digitalDeliveryEligibility.message}</Paragraph></YStack></PremiumCard>;
}

function FailedAuthorization({ onRetry, onReturnCart }: { onRetry: () => void; onReturnCart: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="700">Retry Options</Text><Button onPress={onRetry} theme="blue">Retry Payment</Button><Button disabled>Choose Another Provider Later</Button><Button onPress={onReturnCart}>Return to Cart</Button></YStack></PremiumCard>;
}

function Price({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{money(value)}</Text></XStack>;
}

function CenteredCard({ title }: { title: string }) { return <PremiumCard p="$6"><Text fontSize="$6" fontWeight="700" ta="center">{title}</Text></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="700" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function money(value: number) { const sign = value < 0 ? '-' : ''; return `${sign}$${Math.abs(value).toFixed(2)}`; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
