import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H1, H2, Paragraph, Progress, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { connectPayPal, getSellerVerificationDashboard, requestAdminReview, uploadSellerDocument } from './sellerVerificationMockApi';
import type { SellerAccountLimitItem, SellerDocumentRequirement, SellerMarketplaceEligibilityItem, SellerPayoutBlockingReason, SellerVerificationChecklistItem, SellerVerificationDashboardResponse, SellerVerificationTimelineEvent } from './sellerVerificationTypes';

type Props = { onNavigate: (route: AppRoute) => void };
type ListComponent<T> = (props: { data: T[]; estimatedItemSize: number; keyExtractor: (item: T) => string; renderItem: (info: { item: T; index: number }) => ReactElement }) => ReactElement;
const ChecklistList = FlashList as unknown as ListComponent<SellerVerificationChecklistItem>;
const BlockerList = FlashList as unknown as ListComponent<SellerPayoutBlockingReason>;
const MarketList = FlashList as unknown as ListComponent<SellerMarketplaceEligibilityItem>;
const LimitList = FlashList as unknown as ListComponent<SellerAccountLimitItem>;
const DocList = FlashList as unknown as ListComponent<SellerDocumentRequirement>;
const TimelineList = FlashList as unknown as ListComponent<SellerVerificationTimelineEvent>;
const tabs = ['Checklist', 'Payout', 'Marketplace', 'Limits', 'Documents', 'Timeline'] as const;

export function SellerVerificationScreen({ onNavigate }: Props) {
  const selectedTab = useSelector(appState$.sellerVerification.selectedTab) as typeof tabs[number];
  const [dashboard, setDashboard] = useState<SellerVerificationDashboardResponse | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setDashboard(await getSellerVerificationDashboard());
    const stored = appStorage.getString('sellerVerificationLastTab') as typeof tabs[number] | null;
    if (stored && tabs.includes(stored)) appState$.sellerVerification.selectedTab.set(stored);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function action(kind: 'paypal' | 'document' | 'review') {
    const result = kind === 'paypal' ? await connectPayPal() : kind === 'document' ? await uploadSellerDocument() : await requestAdminReview();
    setMessage(result.message);
  }

  if (!dashboard) return <YStack bg="$background" f={1} p="$5"><Centered title="Loading verification and payout eligibility..." /></YStack>;

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1240} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack flex={1} gap="$2">
              <Text color="$blue10" fontWeight="800">{dashboard.storeName} / {dashboard.sellerAlias}</Text>
              <H1>Verification & Payout Eligibility</H1>
              <Paragraph color="$gray10">Complete seller-safe verification steps to unlock selling, marketplace access, payout eligibility, limits, and badges.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2"><Button onPress={() => onNavigate('home')}>Back to Seller Center</Button><Button theme="purple" onPress={() => action('paypal')}>Connect PayPal</Button><DropdownMenu.Root><DropdownMenu.Trigger><Button>More</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="policy">Accept Policies</DropdownMenu.Item><DropdownMenu.Item key="doc" onSelect={() => action('document')}>Upload Documents</DropdownMenu.Item><DropdownMenu.Item key="review" onSelect={() => action('review')}>Request Admin Review</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></XStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.sellerVerification.selectedTab.set(tab); appStorage.setString('sellerVerificationLastTab', tab); }}>{tab}</Button>)}</XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Checklist' ? <Panel title="Verification Checklist"><ChecklistList data={dashboard.verificationChecklist} estimatedItemSize={110} keyExtractor={(item) => item.verificationType} renderItem={({ item, index }) => <ChecklistRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Payout' ? <Panel title="Payout Blockers"><BlockerList data={dashboard.payoutEligibility.blockingReasons} estimatedItemSize={112} keyExtractor={(item) => item.reasonCode} renderItem={({ item, index }) => <BlockerRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Marketplace' ? <Panel title="Marketplace / Category Eligibility"><MarketList data={dashboard.marketplaceEligibility} estimatedItemSize={132} keyExtractor={(item) => item.marketplaceCode} renderItem={({ item, index }) => <MarketRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Limits' ? <Panel title="Seller-Safe Account Limits"><LimitList data={dashboard.accountLimits} estimatedItemSize={112} keyExtractor={(item) => item.limitType} renderItem={({ item, index }) => <LimitRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Documents' ? <Panel title="Document Requirements"><DocList data={dashboard.documentRequirements} estimatedItemSize={124} keyExtractor={(item) => item.requirementId} renderItem={({ item, index }) => <DocRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Timeline' ? <Panel title="Verification Timeline"><TimelineList data={dashboard.timeline} estimatedItemSize={112} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <TimelineRow item={item} index={index} />} /></Panel> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Readiness"><Text fontSize="$10" fontWeight="900">{dashboard.overallReadiness.setupProgressPercent}%</Text><Progress value={dashboard.overallReadiness.setupProgressPercent} /><Badge label={dashboard.overallReadiness.payoutEligibilityStatus} tone="warning" /><Paragraph color="$gray10">{dashboard.payoutEligibility.userSafeMessage}</Paragraph></Panel>
              <Panel title="PayPal First Payout"><Badge label={dashboard.payoutEligibility.payoutProviderStatus} tone="warning" /><Paragraph color="$gray10">Stripe Connect is later/coming soon. Provider tokens and payloads are never stored locally.</Paragraph></Panel>
              <Panel title="Seller Badge Preview">{dashboard.sellerBadges.map((badge) => <Row key={badge.badgeType} title={badge.label} meta={badge.description} badge={badge.status} tone={badge.status === 'ACTIVE' ? 'success' : 'info'} />)}</Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

const ChecklistRow = memo(function ChecklistRow({ item, index }: { item: SellerVerificationChecklistItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.label} meta={`${item.required ? 'Required' : 'Optional'} / ${item.userSafeMessage}`} badge={item.status} tone={toneFor(item.status)} /></Animated.View>; });
function BlockerRow({ item, index }: { item: SellerPayoutBlockingReason; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={`${item.userSafeMessage} / Action: ${item.requiredAction}`} badge={item.blocking ? 'Blocking' : 'Warning'} tone={item.blocking ? 'critical' : 'warning'} /></Animated.View>; }
function MarketRow({ item, index }: { item: SellerMarketplaceEligibilityItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={item.marketplaceIconUrl} style={{ width: 44, height: 44, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="900">{item.marketplaceName}</Text><Paragraph color="$gray10">{item.userSafeReason}</Paragraph></YStack><Badge label={item.status} tone={item.sellerEligible ? 'success' : 'warning'} /></XStack></Animated.View>; }
function LimitRow({ item, index }: { item: SellerAccountLimitItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.label} meta={`${item.currentValue}${item.currency ? ` ${item.currency}` : ''} / ${item.unlockGuidance}`} badge={item.relatedMarketplaceCode} tone="info" /></Animated.View>; }
function DocRow({ item, index }: { item: SellerDocumentRequirement; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.documentType} meta={`${item.reason} / ${item.uploadStatus} / ${item.reviewStatus}`} badge={item.required ? 'Required' : 'Optional'} tone={item.required ? 'warning' : 'info'} /></Animated.View>; }
function TimelineRow({ item, index }: { item: SellerVerificationTimelineEvent; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={item.userSafeMessage} badge={item.status} tone={toneFor(item.status)} /></Animated.View>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} /></XStack>; }
function Centered({ title }: { title: string }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function toneFor(status: string) { return status.includes('COMPLETE') || status === 'ACTIVE' ? 'success' : status.includes('REQUIRED') || status.includes('PENDING') || status.includes('ACTION') ? 'warning' : status.includes('REJECTED') || status.includes('SUSPENDED') ? 'critical' : 'info'; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 35, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
