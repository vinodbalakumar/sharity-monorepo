import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { placeholderImageUrl } from '../../utils/mockImages';
import { getPaymentAuthorization, retryAuthorization, startPayPalAuthorization } from './paymentAuthorizationMockApi';
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const SellerList = FlashList;
const TimelineList = FlashList;
export function PaymentAuthorizationScreen({ onNavigate }) {
    const selectedProvider = useSelector(appState$.paymentAuthorization.selectedProvider);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setResponse(await getPaymentAuthorization());
        const stored = appStorage.getString('paymentAuthorizationProvider');
        if (stored)
            appState$.paymentAuthorization.selectedProvider.set(stored);
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
    if (loading)
        return <InteriorShell onNavigate={onNavigate} title="Payment Authorization" subtitle="Please wait..." scrollable={false}><CenteredCard title="Preparing secure payment authorization..."/></InteriorShell>;
    if (!response)
        return <InteriorShell onNavigate={onNavigate} title="Error" subtitle="Authorization unavailable" scrollable={false}><CenteredCard title="Payment authorization unavailable."/></InteriorShell>;
    return (<InteriorShell onNavigate={onNavigate} title="Payment Authorization" subtitle="Authorize payment securely" scrollable={true}>
      <YStack gap="$5" maxWidth={1220} mx="auto" width="100%">
        <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <Notice response={response}/>
              <PremiumCard p="$5">
                <YStack gap="$4">
                  <Text fontSize="$6" fontWeight="900">Seller Acceptance Status</Text>
                  <SellerList data={response.sellerOrderAuthorizationStatuses} estimatedItemSize={210} keyExtractor={(item) => item.sellerOrderId} renderItem={({ item, index }) => <SellerOrderRow index={index} order={item}/>}/>
                </YStack>
              </PremiumCard>
              <PremiumCard p="$5">
                <YStack gap="$4">
                  <Text fontSize="$6" fontWeight="900">Payment Timeline</Text>
                  <TimelineList data={response.paymentTimeline} estimatedItemSize={108} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <TimelineRow event={item} index={index}/>}/>
                </YStack>
              </PremiumCard>
            </YStack>
            <YStack gap="$4" width={390} $md={{ width: '100%' }}>
              <ProviderPanel selectedProvider={selectedProvider} response={response} onAuthorize={authorize}/>
              <PricingSummary response={response}/>
              <DigitalDelivery response={response}/>
              <FailedAuthorization onRetry={retry} onReturnCart={() => onNavigate('cart')}/>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
      </YStack>
    </InteriorShell>);
}
function ProviderPanel({ response, selectedProvider, onAuthorize }) {
    return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Payment Provider</Text>{response.paymentProviderOptions.map((provider) => <XStack key={provider.providerCode} ai="center" gap="$3"><Image source={placeholderImageUrl('gift_cards')} placeholder={blurhash} style={{ width: 38, height: 38, borderRadius: 8 }}/><YStack flex={1}><Text fontWeight="900">{provider.providerName}</Text><Text color="$gray10">{provider.message}</Text></YStack><Badge label={provider.enabled ? (provider.providerCode === selectedProvider ? 'Selected' : 'Available') : 'Coming Later'} tone={provider.enabled ? 'success' : 'warning'}/></XStack>)}<Button theme="purple" onPress={onAuthorize}>Authorize with PayPal</Button><Button disabled>Authorize with Stripe Later</Button></YStack></PremiumCard>;
}
function Notice({ response }) {
    return <PremiumCard p="$5"><YStack gap="$3"><Badge label="Authorization-first notice" tone="info"/><Paragraph color="$gray10">{response.authorizationNotice}</Paragraph><Paragraph color="$gray10">{response.sellerAcceptanceSummary.message}</Paragraph></YStack></PremiumCard>;
}
const SellerOrderRow = memo(function SellerOrderRow({ order, index }) {
    const style = useEntrance(index);
    const tone = order.acceptanceStatus === 'ACCEPTED' ? 'success' : order.acceptanceStatus === 'REJECTED' ? 'critical' : 'warning';
    return <Animated.View style={style}><PremiumCard mb="$3" p="$4"><YStack gap="$3"><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3"><YStack flex={1}><Text fontWeight="900">{order.storeName}</Text><Paragraph color="$gray10">{order.sellerOrderReference} • {order.sellerAlias} • {order.productTypeSummary}</Paragraph></YStack><Badge label={order.acceptanceStatus} tone={tone}/></XStack><XStack flexWrap="wrap" gap="$2"><Badge label={`Authorized ${money(order.amountAuthorized)}`} tone="info"/><Badge label={`Captured ${money(order.amountCaptured)}`} tone="success"/><Badge label={`Released ${money(order.amountReleased)}`} tone={order.amountReleased > 0 ? 'critical' : 'info'}/><Badge label={order.digitalDeliveryStatus} tone={order.digitalDeliveryStatus.includes('READY') ? 'success' : 'warning'}/></XStack><Paragraph color="$gray10">{order.nextStep}</Paragraph></YStack></PremiumCard></Animated.View>;
});
function TimelineRow({ event, index }) {
    const style = useEntrance(index);
    return <Animated.View style={style}><XStack borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Badge label={event.status} tone={event.status === 'CRITICAL' ? 'critical' : event.status === 'WARNING' ? 'warning' : event.status === 'SUCCESS' ? 'success' : 'info'}/><YStack flex={1}><Text fontWeight="900">{event.title}</Text><Paragraph color="$gray10">{event.description}</Paragraph></YStack></XStack></Animated.View>;
}
function PricingSummary({ response }) {
    const p = response.pricingSummary;
    return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Final Pricing</Text><Price label="Items total" value={p.itemsTotal}/><Price label="Seller discounts" value={-p.sellerDiscounts}/><Price label="Platform discounts" value={-p.platformDiscounts}/><Price label="Buyer service fee" value={p.buyerServiceFee}/><Price label="Total authorized" value={p.totalAuthorizationAmount} strong/><Price label="Captured" value={p.totalCapturedAmount}/><Price label="Released" value={p.totalReleasedAmount}/><Paragraph color="$gray10">Buyer-safe totals only. Seller commission, fee waiver rules, and provider payloads are hidden.</Paragraph></YStack></PremiumCard>;
}
function DigitalDelivery({ response }) {
    return <PremiumCard p="$5"><YStack gap="$2"><Text fontSize="$6" fontWeight="900">Digital Delivery</Text><Badge label={response.digitalDeliveryEligibility.status} tone={response.digitalDeliveryEligibility.eligible ? 'success' : 'warning'}/><Paragraph color="$gray10">{response.digitalDeliveryEligibility.message}</Paragraph></YStack></PremiumCard>;
}
function FailedAuthorization({ onRetry, onReturnCart }) {
    return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Retry Options</Text><Button onPress={onRetry} theme="purple">Retry Payment</Button><Button disabled>Choose Another Provider Later</Button><Button onPress={onReturnCart}>Return to Cart</Button></YStack></PremiumCard>;
}
function Price({ label, value, strong }) {
    return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{money(value)}</Text></XStack>;
}
function CenteredCard({ title }) { return <PremiumCard p="$6"><Text fontSize="$6" fontWeight="900" ta="center">{title}</Text></PremiumCard>; }
function Badge({ label, tone }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props}/>; }
function money(value) { const sign = value < 0 ? '-' : ''; return `${sign}$${Math.abs(value).toFixed(2)}`; }
function useEntrance(index) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
