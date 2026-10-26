import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, Input, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { getParentOrderRefundSummary, getRefundEstimate, getRefundReasons, getRefundTimeline, submitRefund, uploadRefundEvidence } from './sellerOrderRefundMockApi';
import type {
  ParentOrderRefundSummaryResponse,
  RefundBreakdown,
  RefundEvidenceItem,
  RefundReasonOption,
  RefundTimelineEvent,
  SellerOrderItemRefundEligibility,
  SellerOrderRefundSummary
} from './sellerOrderRefundTypes';

type Props = {
  onNavigate: (route: AppRoute) => void;
  onOpenRefundStatus?: (refundRequestId: string, orderId?: string) => void;
  orderId?: string | null;
};

type ListComponent<T> = (props: { data: T[]; estimatedItemSize: number; keyExtractor: (item: T) => string; renderItem: (info: { item: T; index: number }) => ReactElement }) => ReactElement;
const SellerOrderList = FlashList as unknown as ListComponent<SellerOrderRefundSummary>;
const ItemList = FlashList as unknown as ListComponent<SellerOrderItemRefundEligibility>;
const ReasonList = FlashList as unknown as ListComponent<RefundReasonOption>;
const EvidenceList = FlashList as unknown as ListComponent<RefundEvidenceItem>;
const TimelineList = FlashList as unknown as ListComponent<RefundTimelineEvent>;
const BreakdownList = FlashList as unknown as ListComponent<{ id: string; label: string; value: string }>;

export function SellerOrderRefundScreen({ onNavigate, onOpenRefundStatus, orderId }: Props) {
  const selectedSellerOrderId = useSelector(appState$.sellerOrderRefund.selectedSellerOrderId);
  const selectedItemId = useSelector(appState$.sellerOrderRefund.selectedItemId);
  const selectedReasonCode = useSelector(appState$.sellerOrderRefund.selectedReasonCode);
  const requestedAmount = useSelector(appState$.sellerOrderRefund.requestedAmount);
  const submitLoading = useSelector(appState$.sellerOrderRefund.submitLoading);
  const [summary, setSummary] = useState<ParentOrderRefundSummaryResponse | null>(null);
  const [reasons, setReasons] = useState<RefundReasonOption[]>([]);
  const [evidence, setEvidence] = useState<RefundEvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<RefundTimelineEvent[]>([]);
  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof getRefundEstimate>> | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setSummary(await getParentOrderRefundSummary());
    setReasons(await getRefundReasons());
    setEstimate(await getRefundEstimate());
    setTimeline(await getRefundTimeline());
    const stored = appStorage.getString('refundLastReason');
    if (stored) appState$.sellerOrderRefund.selectedReasonCode.set(stored);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedSellerOrder = useMemo(
    () => summary?.sellerOrderRefundSummaries.find((item) => item.sellerOrderId === selectedSellerOrderId) ?? summary?.sellerOrderRefundSummaries[0],
    [selectedSellerOrderId, summary]
  );
  const selectedItem = useMemo(
    () => selectedSellerOrder?.items.find((item) => item.sellerOrderItemId === selectedItemId) ?? selectedSellerOrder?.items[0],
    [selectedItemId, selectedSellerOrder]
  );
  const selectedReason = reasons.find((reason) => reason.reasonCode === selectedReasonCode) ?? reasons[0];

  async function handleEvidenceUpload() {
    const item = await uploadRefundEvidence();
    setEvidence((current) => [item, ...current]);
    setMessage('Evidence uploaded. Raw storage URLs and raw contents are not stored locally.');
  }

  async function handleSubmit() {
    appState$.sellerOrderRefund.submitLoading.set(true);
    const result = await submitRefund();
    appState$.sellerOrderRefund.submitLoading.set(false);
    setMessage(result.message);
    onOpenRefundStatus?.(result.refundRequestId, summary?.parentOrderId ?? orderId ?? undefined);
  }

  if (!summary || !estimate || !selectedSellerOrder || !selectedItem || !selectedReason) {
    return <YStack bg="$background" f={1} p="$5"><Centered title="Loading Request Refund..." /></YStack>;
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="Request Refund" subtitle="Choose the seller order or item you need help with. Parent order context is display-only unless backend rules allow a broader action" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack gap="$4" width={380} $md={{ width: '100%' }}>
              <ParentSummary summary={summary} />
              <Panel title="Select Seller Order">
                <SellerOrderList data={summary.sellerOrderRefundSummaries} estimatedItemSize={144} keyExtractor={(item) => item.sellerOrderId} renderItem={({ item, index }) => <SellerOrderRow index={index} selected={item.sellerOrderId === selectedSellerOrder.sellerOrderId} sellerOrder={item} />} />
              </Panel>
              <Panel title="Select Item">
                <ItemList data={selectedSellerOrder.items} estimatedItemSize={144} keyExtractor={(item) => item.sellerOrderItemId} renderItem={({ item, index }) => <ItemRow index={index} item={item} selected={item.sellerOrderItemId === selectedItem.sellerOrderItemId} />} />
              </Panel>
            </YStack>

            <YStack flex={1} gap="$4" minWidth={0}>
              <DigitalContext item={selectedItem} />
              <Panel title="Choose Refund Reason">
                <ReasonList data={reasons} estimatedItemSize={108} keyExtractor={(item) => item.reasonCode} renderItem={({ item, index }) => <ReasonRow index={index} reason={item} selected={item.reasonCode === selectedReason.reasonCode} />} />
              </Panel>
              <Panel title="Refund Amount">
                <YStack gap="$3">
                  <Input bg="$background" borderColor="$borderColor" value={requestedAmount} onChangeText={(value) => appState$.sellerOrderRefund.requestedAmount.set(value)} />
                  <Paragraph color="$gray10">Suggested ${estimate.suggestedRefundAmount.toFixed(2)}. Max ${estimate.maxRefundAmount.toFixed(2)}. Backend validates final amount.</Paragraph>
                  {estimate.messages.map((item) => <Paragraph key={item} color="$orange10">{item}</Paragraph>)}
                </YStack>
              </Panel>
              <EvidencePanel evidence={evidence} onUpload={handleEvidenceUpload} />
              <PhysicalReturnPlaceholder />
            </YStack>

            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Breakdown breakdown={estimate.refundBreakdown} />
              <Panel title="Seller Response Deadline">
                <YStack gap="$3">
                  <Badge label={estimate.sellerResponseRequired ? 'Seller response required' : 'Seller response skipped'} tone="warning" />
                  <Paragraph color="$gray10">Deadline: {new Date(estimate.sellerResponseDeadlinePreview).toLocaleString()}</Paragraph>
                  <Paragraph color="$gray10">If the seller does not respond, Sharity may review this request.</Paragraph>
                </YStack>
              </Panel>
              <Panel title="Refund Timeline">
                <TimelineList data={timeline} estimatedItemSize={112} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <TimelineRow event={item} index={index} />} />
              </Panel>
              <Button disabled={submitLoading} theme="blue" onPress={handleSubmit}>{submitLoading ? 'Submitting...' : 'Submit Refund Request'}</Button>
              <Button>Escalate to Sharity Review</Button>
              <Button>Cancel Refund Request</Button>
              {message ? <PremiumCard p="$4"><Paragraph color="$blue10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
        </XStack>
      </YStack>
    </InteriorShell>
  );
}

function ParentSummary({ summary }: { summary: ParentOrderRefundSummaryResponse }) {
  return <Panel title="Parent Order Summary"><YStack gap="$2"><Text fontWeight="700">{summary.parentOrderReference}</Text><Paragraph color="$gray10">{summary.totalSellerOrders} seller orders / {summary.totalItems} items / {summary.orderStatus}</Paragraph><Paragraph color="$gray10">Payment: {summary.paymentStatus}</Paragraph></YStack></Panel>;
}

function DigitalContext({ item }: { item: SellerOrderItemRefundEligibility }) {
  const context = item.digitalAccessContext;
  return <Panel title="Digital Access & Eligibility"><YStack gap="$2"><Badge label={item.eligibilityStatus} tone={item.adminReviewRequired ? 'warning' : 'success'} /><Paragraph color="$gray10">{context.buyerSafeMessage}</Paragraph><Paragraph color="$gray10">Code assigned: {context.codeAssigned ? 'Yes' : 'No'} / Code revealed: {context.codeRevealed ? 'Yes' : 'No'} / File downloaded: {context.fileDownloaded ? 'Yes' : 'No'}</Paragraph><Paragraph color="$gray10">Manual delivery: {context.manualDeliveryStatus} / Access: {context.accessGrantedStatus}</Paragraph><Paragraph color="$gray10">Actual codes and raw download URLs are never shown here.</Paragraph></YStack></Panel>;
}

function EvidencePanel({ evidence, onUpload }: { evidence: RefundEvidenceItem[]; onUpload: () => void }) {
  return <Panel title="Evidence Upload"><YStack gap="$3"><Button onPress={onUpload}>Upload Evidence</Button><Paragraph color="$gray10">Evidence visibility is backend-policy controlled and may be shared with seller/admin review.</Paragraph><EvidenceList data={evidence} estimatedItemSize={96} keyExtractor={(item) => item.evidenceId} renderItem={({ item, index }) => <EvidenceRow evidence={item} index={index} />} /></YStack></Panel>;
}

function Breakdown({ breakdown }: { breakdown: RefundBreakdown }) {
  const rows = [
    { id: 'item', label: 'Item refund', value: money(breakdown.itemRefund) },
    { id: 'seller-coupon', label: 'Seller coupon impact', value: money(breakdown.sellerCouponImpact) },
    { id: 'platform-coupon', label: 'Platform coupon impact', value: money(breakdown.platformCouponImpact) },
    { id: 'fee', label: 'Buyer service fee', value: breakdown.buyerServiceFeeRefundable ? money(breakdown.buyerServiceFeeRefundAmount) : 'Not refundable' },
    { id: 'credit', label: 'Sharity Credit return', value: breakdown.sharityCreditReturnBehavior },
    { id: 'total', label: 'Estimated refund', value: money(breakdown.totalEstimatedRefund) }
  ];
  return <Panel title="Refund Breakdown"><BreakdownList data={rows} estimatedItemSize={64} keyExtractor={(item) => item.id} renderItem={({ item }) => <XStack jc="space-between" gap="$3" py="$2"><Text color="$gray10" fontWeight="700">{item.label}</Text><Text fontWeight="700">{item.value}</Text></XStack>} /></Panel>;
}

function PhysicalReturnPlaceholder() {
  return <Panel title="Physical / Electronics Return"><YStack gap="$2"><Paragraph color="$gray10">Live physical return reviews follow the marketplace delivery, inspection, and dispute rules for the selected order.</Paragraph></YStack></Panel>;
}

const SellerOrderRow = memo(function SellerOrderRow({ sellerOrder, selected, index }: { sellerOrder: SellerOrderRefundSummary; selected: boolean; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor={selected ? '$purple8' : '$borderColor'} borderTopWidth={1} gap="$3" py="$3"><Image source={sellerOrder.productThumbnails[0]} style={{ width: 48, height: 48, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="700">{sellerOrder.sellerOrderReference}</Text><Paragraph color="$gray10">{sellerOrder.storeName} / {sellerOrder.digitalDeliveryStatus}</Paragraph></YStack><Button theme={selected ? 'purple' : undefined} onPress={() => appState$.sellerOrderRefund.selectedSellerOrderId.set(sellerOrder.sellerOrderId)}>{selected ? 'Selected' : 'Select'}</Button></XStack></Animated.View>;
});

function ItemRow({ item, selected, index }: { item: SellerOrderItemRefundEligibility; selected: boolean; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor={selected ? '$purple8' : '$borderColor'} borderTopWidth={1} gap="$3" py="$3"><Image source={item.productImageUrl} style={{ width: 48, height: 48, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="700">{item.productTitle}</Text><Paragraph color="$gray10">{item.deliveryType} / Max {money(item.maxRefundAmount)}</Paragraph></YStack><Button theme={selected ? 'purple' : undefined} onPress={() => { appState$.sellerOrderRefund.selectedItemId.set(item.sellerOrderItemId); appState$.sellerOrderRefund.requestedAmount.set(item.maxRefundAmount.toFixed(2)); }}>{selected ? 'Selected' : 'Select'}</Button></XStack></Animated.View>;
}

function ReasonRow({ reason, selected, index }: { reason: RefundReasonOption; selected: boolean; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor={selected ? '$purple8' : '$borderColor'} borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="700">{reason.label}</Text><Paragraph color="$gray10">{reason.description} Evidence: {reason.evidenceRecommended}</Paragraph></YStack><Button theme={selected ? 'purple' : undefined} onPress={() => { appState$.sellerOrderRefund.selectedReasonCode.set(reason.reasonCode); appStorage.setString('refundLastReason', reason.reasonCode); }}>{selected ? 'Chosen' : 'Choose'}</Button></XStack></Animated.View>;
}

function EvidenceRow({ evidence, index }: { evidence: RefundEvidenceItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={evidence.previewUrl} style={{ width: 44, height: 44, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="700">{evidence.fileName}</Text><Paragraph color="$gray10">{evidence.uploadStatus} / {evidence.visibilityPolicy}</Paragraph></YStack><Badge label="Uploaded" tone="success" /></XStack></Animated.View>;
}

function TimelineRow({ event, index }: { event: RefundTimelineEvent; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={event.title} meta={`${event.actorType} / ${event.message}`} badge={event.status} tone={event.status === 'PENDING' ? 'warning' : 'info'} /></Animated.View>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><Text fontSize="$6" fontWeight="700">{title}</Text>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="700">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} /></XStack>; }
function Centered({ title }: { title: string }) { return <PremiumCard p="$6"><Text fontSize="$6" fontWeight="700" ta="center">{title}</Text></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="700" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function money(value: number) { const sign = value < 0 ? '-' : ''; return `${sign}$${Math.abs(value).toFixed(2)}`; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 35, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
