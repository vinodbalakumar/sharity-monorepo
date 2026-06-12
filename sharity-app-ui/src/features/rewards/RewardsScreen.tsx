import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H2, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppButton } from '../../components/ui';
import { InteriorShell } from '../../components/appShell/InteriorShell';
import { AuthenticationRequiredError } from '../../services/sessionService';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { applyCredit, claimGiveaway, getRewardsDashboard, removeCredit } from './rewardsMockApi';
import type {
  CreditAllocationItem,
  CreditHistoryItem,
  RewardAbuseReviewItem,
  RewardCampaignConfig,
  RewardCampaignSummary,
  RewardsAuditLogItem,
  RewardsDashboardResponse
} from './rewardsTypes';

type Props = { onNavigate: (route: AppRoute) => void };
const tabs = ['Buyer', 'Seller Impact', 'Admin Campaigns', 'Histories', 'Abuse Review', 'Simulator', 'Audit'] as const;
const HistoryList = FlashList as unknown as ListComponent<CreditHistoryItem>;
const CampaignList = FlashList as unknown as ListComponent<RewardCampaignSummary>;
const AdminCampaignList = FlashList as unknown as ListComponent<RewardCampaignConfig>;
const AllocationList = FlashList as unknown as ListComponent<CreditAllocationItem>;
const AuditList = FlashList as unknown as ListComponent<RewardsAuditLogItem>;
const AbuseList = FlashList as unknown as ListComponent<RewardAbuseReviewItem>;

type ListComponent<T> = (props: {
  data: T[];
  estimatedItemSize: number;
  keyExtractor: (item: T) => string;
  renderItem: (info: { item: T; index: number }) => ReactElement;
}) => ReactElement;

export function RewardsScreen({ onNavigate }: Props) {
  const selectedTab = useSelector(appState$.rewards.selectedTab) as typeof tabs[number];
  const creditApplied = useSelector(appState$.rewards.creditApplied);
  const [dashboard, setDashboard] = useState<RewardsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setDashboard(await getRewardsDashboard());
    const stored = appStorage.getString('rewardsLastTab') as typeof tabs[number] | null;
    if (stored && tabs.includes(stored)) appState$.rewards.selectedTab.set(stored);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleClaim(campaignId: string) {
    const result = await claimGiveaway(campaignId);
    setMessage(result.message);
  }

  async function handleApplyCredit() {
    const result = await applyCredit();
    appState$.rewards.creditApplied.set(true);
    setMessage(result.message);
  }

  async function handleRemoveCredit() {
    const result = await removeCredit();
    appState$.rewards.creditApplied.set(false);
    setMessage(result.message);
  }

  if (loading) {
    return <YStack bg="$background" f={1} p="$5"><Centered title="Loading Sharity Credit & Rewards..." /></YStack>;
  }

  if (error) {
    return (
      <YStack bg="$background" f={1} p="$5">
        <Centered
          title={error}
          actionLabel="Retry"
          onAction={load}
          secondaryActionLabel="Sign In"
          onSecondaryAction={() => onNavigate('welcome')}
        />
      </YStack>
    );
  }

  if (!dashboard) {
    return <YStack bg="$background" f={1} p="$5"><Centered title="Rewards data is currently unavailable." actionLabel="Retry" onAction={load} /></YStack>;
  }

  return (
    <InteriorShell activeLabel="Rewards" onNavigate={onNavigate} scrollable={false} subtitle="Credit, rewards, giveaways, multi-seller allocation, seller-safe impact, and admin campaign placeholders." title="Sharity Credit & Rewards">
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1220} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="center" jc="space-between" gap="$3">
            <Text color="$blue10" fontSize="$2" fontWeight="800">Later-phase rewards architecture</Text>
            <XStack flexWrap="wrap" gap="$2">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger><Button>Actions</Button></DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item key="apply" onSelect={handleApplyCredit}>Apply Credit</DropdownMenu.Item>
                  <DropdownMenu.Item key="remove" onSelect={handleRemoveCredit}>Remove Credit</DropdownMenu.Item>
                  <DropdownMenu.Item key="manual">Issue Manual Credit</DropdownMenu.Item>
                  <DropdownMenu.Item key="simulate">Simulate Campaign</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </XStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$2">
            {tabs.map((tab) => (
              <Button
                key={tab}
                theme={selectedTab === tab ? 'purple' : undefined}
                onPress={() => {
                  appState$.rewards.selectedTab.set(tab);
                  appStorage.setString('rewardsLastTab', tab);
                }}
              >
                {tab}
              </Button>
            ))}
          </XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Buyer' ? <BuyerView dashboard={dashboard} onApplyCredit={handleApplyCredit} onClaim={handleClaim} /> : null}
              {selectedTab === 'Seller Impact' ? <SellerImpact dashboard={dashboard} /> : null}
              {selectedTab === 'Admin Campaigns' ? <AdminCampaignPanel campaigns={dashboard.campaigns} /> : null}
              {selectedTab === 'Histories' ? <Histories dashboard={dashboard} /> : null}
              {selectedTab === 'Abuse Review' ? <AbuseReview reviews={dashboard.abuseQueue} /> : null}
              {selectedTab === 'Simulator' ? <Simulator dashboard={dashboard} /> : null}
              {selectedTab === 'Audit' ? <AuditPanel audit={dashboard.auditLog} /> : null}
            </YStack>

            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <PremiumCard p="$5">
                <YStack gap="$3">
                  <H2>Checkout Placeholder</H2>
                  <Badge label={creditApplied ? 'Credit applied' : 'Credit ready'} tone={creditApplied ? 'success' : 'info'} />
                  <Price label="Items total" value={50} />
                  <Price label="Platform coupon" value={-5} />
                  <Price label="Sharity Credit" value={creditApplied ? -10 : 0} />
                  <Price label="Buyer service fee" value={2} />
                  <Price label="Total payable" value={creditApplied ? 37 : 47} strong />
                  <Paragraph color="$gray10">Credit allocation across seller orders is backend-controlled and traceable.</Paragraph>
                </YStack>
              </PremiumCard>
              <Panel title="Credit Allocation">
                <AllocationList
                  data={dashboard.creditAllocation.items}
                  estimatedItemSize={104}
                  keyExtractor={(item) => item.sellerOrderId}
                  renderItem={({ item, index }) => <AllocationRow allocation={item} index={index} />}
                />
              </Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </InteriorShell>
  );
}

function BuyerView({ dashboard, onApplyCredit, onClaim }: { dashboard: RewardsDashboardResponse; onApplyCredit: () => void; onClaim: (campaignId: string) => void }) {
  return (
    <YStack gap="$4">
      <PremiumCard p="$5">
        <YStack gap="$3">
          <H2>Available Sharity Credit</H2>
          <Text color="$green10" fontSize="$10" fontWeight="900">${dashboard.creditBalance.availableBalance.toFixed(2)}</Text>
          <Badge label={`$${dashboard.creditBalance.expiringSoonAmount.toFixed(2)} expires ${dashboard.creditBalance.expiryDate}`} tone="warning" />
          <AppButton variant="primary" onPress={onApplyCredit}>Apply Credit</AppButton>
          {dashboard.creditBalance.typeBreakdown.map((item) => (
            <Paragraph key={item.creditType} color="$gray10">{item.creditType}: ${item.amount.toFixed(2)}. {item.refundBehavior}</Paragraph>
          ))}
        </YStack>
      </PremiumCard>
      <CampaignPanel actionLoading={actionLoading} campaigns={dashboard.availableRewards} onClaim={onClaim} />
      <Panel title="Credit History">
        <HistoryList data={dashboard.creditHistory} estimatedItemSize={108} keyExtractor={(item) => item.historyId} renderItem={({ item, index }) => <HistoryRow history={item} index={index} />} />
      </Panel>
    </YStack>
  );
}

function CampaignPanel({ campaigns, onClaim }: { campaigns: RewardCampaignSummary[]; onClaim: (campaignId: string) => void }) {
  return <Panel title="Rewards & Giveaways"><CampaignList data={campaigns} estimatedItemSize={138} keyExtractor={(item) => item.campaignId} renderItem={({ item, index }) => <CampaignRow campaign={item} index={index} onClaim={() => onClaim(item.campaignId)} />} /></Panel>;
}

function AdminCampaignPanel({ campaigns }: { campaigns: RewardCampaignConfig[] }) {
  return (
    <Panel title="Admin Campaign Configuration">
      <YStack gap="$3">
        <Paragraph color="$gray10">Campaign builder placeholder covers type, funding, amount, dates, scope, eligibility, refund behavior, seller payout impact, anti-abuse settings, and audit.</Paragraph>
        <AppButton variant="primary">Create Campaign</AppButton>
        <AdminCampaignList data={campaigns} estimatedItemSize={138} keyExtractor={(item) => item.campaignId} renderItem={({ item, index }) => <AdminCampaignRow campaign={item} index={index} />} />
      </YStack>
    </Panel>
  );
}

function Histories({ dashboard }: { dashboard: RewardsDashboardResponse }) {
  return (
    <YStack gap="$4">
      <Panel title="Credit Issuance History"><HistoryList data={dashboard.creditIssuance} estimatedItemSize={108} keyExtractor={(item) => item.historyId} renderItem={({ item, index }) => <HistoryRow history={item} index={index} />} /></Panel>
      <Panel title="Credit Redemption History"><HistoryList data={dashboard.creditRedemption} estimatedItemSize={108} keyExtractor={(item) => item.historyId} renderItem={({ item, index }) => <HistoryRow history={item} index={index} />} /></Panel>
      <CampaignPanel campaigns={dashboard.giveawayClaims} onClaim={() => undefined} />
    </YStack>
  );
}

function SellerImpact({ dashboard }: { dashboard: RewardsDashboardResponse }) {
  const impact = dashboard.sellerPromotionImpact;
  return (
    <Panel title="Seller-Safe Promotion Impact">
      <Price label="Estimated seller receives" value={impact.estimatedSellerReceives} strong />
      <Badge label={impact.sellerPayoutAffected ? 'Payout affected' : 'Payout unchanged'} tone={impact.sellerPayoutAffected ? 'warning' : 'success'} />
      <Paragraph color="$gray10">{impact.sellerSafePromoImpact}</Paragraph>
      <Paragraph color="$gray10">{impact.platformFundedNote}</Paragraph>
      <Paragraph color="$gray10">{impact.payoutHoldReserveImpact}</Paragraph>
    </Panel>
  );
}

function AbuseReview({ reviews }: { reviews: RewardAbuseReviewItem[] }) {
  return <Panel title="Abuse Review Queue"><AbuseList data={reviews} estimatedItemSize={116} keyExtractor={(item) => item.reviewId} renderItem={({ item, index }) => <AbuseRow review={item} index={index} />} /></Panel>;
}

function Simulator({ dashboard }: { dashboard: RewardsDashboardResponse }) {
  const simulation = dashboard.simulation;
  return (
    <Panel title="Campaign Simulator">
      <YStack gap="$3">
        <Badge label={simulation.eligible ? 'Eligible' : 'Not eligible'} tone={simulation.eligible ? 'success' : 'critical'} />
        <Price label="Buyer credit applied" value={simulation.buyerCreditApplied} />
        <Price label="Buyer total after credit" value={simulation.buyerTotalAfterCredit} strong />
        <Paragraph color="$gray10">{simulation.sellerPayoutImpact}</Paragraph>
        <Paragraph color="$gray10">{simulation.antiAbuseResult}</Paragraph>
        <Paragraph color="$gray10">Warnings: {simulation.conflictWarnings.join(', ')}</Paragraph>
      </YStack>
    </Panel>
  );
}

function AuditPanel({ audit }: { audit: RewardsAuditLogItem[] }) {
  return <Panel title="Rewards Audit Log"><AuditList data={audit} estimatedItemSize={116} keyExtractor={(item) => item.auditId} renderItem={({ item, index }) => <AuditRow audit={item} index={index} />} /></Panel>;
}

const CampaignRow = memo(function CampaignRow({ campaign, index, onClaim }: { campaign: RewardCampaignSummary; index: number; onClaim: () => void }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={campaign.imageUrl} style={{ width: 54, height: 54, borderRadius: 12 }} /><YStack flex={1}><Text fontWeight="900">{campaign.campaignName}</Text><Paragraph color="$gray10">{campaign.creditRewardType} / {campaign.fundingSource} / {campaign.antiAbuseSummary}</Paragraph></YStack><AppButton variant="secondary" onPress={onClaim}>{campaign.creditRewardType === 'GIVEAWAY_REWARD' ? 'Claim Giveaway' : 'View'}</AppButton></XStack></Animated.View>;
});

const AdminCampaignRow = memo(function AdminCampaignRow({ campaign, index }: { campaign: RewardCampaignConfig; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={campaign.campaignName} meta={`${campaign.creditRewardType} / ${campaign.fundingSource} / ${campaign.marketplaceScope}-${campaign.countryScope} / ${campaign.refundBehavior}`} badge={campaign.status} tone="success" /></Animated.View>;
});

function HistoryRow({ history, index }: { history: CreditHistoryItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={history.type} meta={`${history.status} / ${history.termsSummary}`} badge={`${history.amount >= 0 ? '+' : ''}$${history.amount.toFixed(2)}`} tone={history.amount >= 0 ? 'success' : 'info'} /></Animated.View>;
}

function AllocationRow({ allocation, index }: { allocation: CreditAllocationItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={allocation.sellerOrderId} meta={`${allocation.fundingSource} / ${allocation.refundBehavior}`} badge={`$${allocation.allocatedCreditAmount.toFixed(2)}`} tone={allocation.sellerPayoutAffected ? 'warning' : 'success'} /></Animated.View>;
}

function AbuseRow({ review, index }: { review: RewardAbuseReviewItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={review.campaignName} meta={`${review.reviewReason} / ${review.adminSafeExplanation}`} badge={review.status} tone="warning" /></Animated.View>;
}

function AuditRow({ audit, index }: { audit: RewardsAuditLogItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={audit.action} meta={`${audit.actorName} / ${audit.entityType} ${audit.entityId} / ${audit.reason}`} badge="AUDITED" tone="info" /></Animated.View>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} /></XStack>; }
function Price({ label, value, strong }: { label: string; value: number; strong?: boolean }) { const sign = value < 0 ? '-' : ''; return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{sign}${Math.abs(value).toFixed(2)}</Text></XStack>; }
function Centered({ title }: { title: string }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
