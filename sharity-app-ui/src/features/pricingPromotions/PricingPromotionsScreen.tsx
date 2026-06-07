import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H1, H2, Input, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { placeholderImageUrl } from '../../utils/mockImages';
import { getAuditLog, getCoupons, getFeeWaivers, getFreeProductRules, getPricingRules, runSimulation } from './pricingPromotionsMockApi';
import type { CouponRule, FeeWaiverSellerRule, FreeProductRule, PricingAuditLogItem, PricingRule, PricingSimulationResponse } from './pricingPromotionsTypes';

type Props = { onNavigate: (route: AppRoute) => void };
const tabs = ['Rules', 'Coupons', 'Fee Waivers', 'Free Products', 'Simulator', 'Audit', 'Seller View'] as const;
const RuleList = FlashList as unknown as (props: { data: PricingRule[]; estimatedItemSize: number; keyExtractor: (item: PricingRule) => string; renderItem: (info: { item: PricingRule; index: number }) => ReactElement }) => ReactElement;
const CouponList = FlashList as unknown as (props: { data: CouponRule[]; estimatedItemSize: number; keyExtractor: (item: CouponRule) => string; renderItem: (info: { item: CouponRule; index: number }) => ReactElement }) => ReactElement;
const WaiverList = FlashList as unknown as (props: { data: FeeWaiverSellerRule[]; estimatedItemSize: number; keyExtractor: (item: FeeWaiverSellerRule) => string; renderItem: (info: { item: FeeWaiverSellerRule; index: number }) => ReactElement }) => ReactElement;
const FreeRuleList = FlashList as unknown as (props: { data: FreeProductRule[]; estimatedItemSize: number; keyExtractor: (item: FreeProductRule) => string; renderItem: (info: { item: FreeProductRule; index: number }) => ReactElement }) => ReactElement;
const AuditList = FlashList as unknown as (props: { data: PricingAuditLogItem[]; estimatedItemSize: number; keyExtractor: (item: PricingAuditLogItem) => string; renderItem: (info: { item: PricingAuditLogItem; index: number }) => ReactElement }) => ReactElement;

export function PricingPromotionsScreen({ onNavigate }: Props) {
  const selectedTab = useSelector(appState$.pricingPromotions.selectedTab) as typeof tabs[number];
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [coupons, setCoupons] = useState<CouponRule[]>([]);
  const [waivers, setWaivers] = useState<FeeWaiverSellerRule[]>([]);
  const [freeRules, setFreeRules] = useState<FreeProductRule[]>([]);
  const [simulation, setSimulation] = useState<PricingSimulationResponse | null>(null);
  const [audit, setAudit] = useState<PricingAuditLogItem[]>([]);

  const load = useCallback(async () => {
    setRules(await getPricingRules());
    setCoupons(await getCoupons());
    setWaivers(await getFeeWaivers());
    setFreeRules(await getFreeProductRules());
    setSimulation(await runSimulation());
    setAudit(await getAuditLog());
    const stored = appStorage.getString('pricingPromotionsLastTab') as typeof tabs[number] | null;
    if (stored && tabs.includes(stored)) appState$.pricingPromotions.selectedTab.set(stored);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1240} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack flex={1} gap="$2">
              <Text color="$blue10" fontWeight="800">Admin pricing control center</Text>
              <H1>Pricing, Fees & Promotions</H1>
              <Paragraph color="$gray10">Configure buyer fees, seller commissions, coupons, fee waivers, free product rules, simulations, snapshots, and audit logs.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2"><Button onPress={() => onNavigate('home')}>Back</Button><Button theme="purple">Create Pricing Rule</Button><DropdownMenu.Root><DropdownMenu.Trigger><Button>More</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="coupon">Create Coupon</DropdownMenu.Item><DropdownMenu.Item key="audit">View Audit Log</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></XStack>
          </XStack>
          <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.pricingPromotions.selectedTab.set(tab); appStorage.setString('pricingPromotionsLastTab', tab); }}>{tab}</Button>)}</XStack>
          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Rules' ? <Panel title="Pricing Rules"><RuleList data={rules} estimatedItemSize={132} keyExtractor={(item) => item.ruleId} renderItem={({ item, index }) => <RuleRow index={index} rule={item} />} /></Panel> : null}
              {selectedTab === 'Coupons' ? <Panel title="Coupon Manager"><CouponList data={coupons} estimatedItemSize={118} keyExtractor={(item) => item.couponId} renderItem={({ item, index }) => <CouponRow coupon={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Fee Waivers' ? <Panel title="Fee Waiver Sellers"><WaiverList data={waivers} estimatedItemSize={118} keyExtractor={(item) => item.feeWaiverId} renderItem={({ item, index }) => <WaiverRow index={index} waiver={item} />} /></Panel> : null}
              {selectedTab === 'Free Products' ? <Panel title="Free / Promotional Product Rules"><FreeRuleList data={freeRules} estimatedItemSize={130} keyExtractor={(item) => item.ruleId} renderItem={({ item, index }) => <FreeRuleRow freeRule={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Simulator' && simulation ? <Simulator simulation={simulation} /> : null}
              {selectedTab === 'Audit' ? <Panel title="Audit Log"><AuditList data={audit} estimatedItemSize={120} keyExtractor={(item) => item.auditId} renderItem={({ item, index }) => <AuditRow auditItem={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Seller View' && simulation ? <SellerSafeView simulation={simulation} /> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <PremiumCard p="$5"><YStack gap="$3"><H2>Summary</H2><Badge label={`${rules.filter((rule) => rule.status === 'ACTIVE').length} active rules`} tone="success" /><Badge label={`${rules.filter((rule) => rule.status === 'DRAFT').length} draft rules`} tone="warning" /><Badge label="1 conflict warning" tone="critical" /><Paragraph color="$gray10">Buyer-safe pricing is used in cart and payment screens. Seller commission is never shown to buyers.</Paragraph></YStack></PremiumCard>
              <PremiumCard p="$5"><YStack gap="$3"><H2>Rule Editor</H2><Input bg="$background" borderColor="$borderColor" value="Buyer service fee fixed + percentage" /><Button theme="purple">Save Rule</Button><Button>Simulate Pricing</Button></YStack></PremiumCard>
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
const RuleRow = memo(function RuleRow({ rule, index }: { rule: PricingRule; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={rule.ruleName} meta={`${rule.ruleType} • ${rule.scope} • ${rule.marketplaceCode}/${rule.categoryCode}/${rule.countryCode}`} badge={`${rule.feeModel} v${rule.version}`} tone={rule.status === 'ACTIVE' ? 'success' : 'warning'} /></Animated.View>; });
function CouponRow({ coupon, index }: { coupon: CouponRule; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={coupon.couponCode} meta={`${coupon.couponType} • ${coupon.fundingSource} • Stackable: ${coupon.stackable ? 'Yes' : 'No'}`} badge={coupon.status} tone="success" /></Animated.View>; }
function WaiverRow({ waiver, index }: { waiver: FeeWaiverSellerRule; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={waiver.storeName} meta={`${waiver.waiverType} • ${waiver.reason}`} badge={`${waiver.waiverPercentage}% waiver`} tone="info" /></Animated.View>; }
function FreeRuleRow({ freeRule, index }: { freeRule: FreeProductRule; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={`${freeRule.productType} allowed`} meta={`${freeRule.marketplaceCode}/${freeRule.categoryCode}/${freeRule.countryCode} • Anti-abuse: ${freeRule.antiAbuseLevel}`} badge={freeRule.status} tone="success" /></Animated.View>; }
function AuditRow({ auditItem, index }: { auditItem: PricingAuditLogItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={auditItem.action} meta={`${auditItem.actorName} • ${auditItem.entityType} ${auditItem.entityId} • ${auditItem.reason}`} badge={`v${auditItem.version}`} tone="info" /></Animated.View>; }

function Row({ title, meta, badge, tone }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success' }) {
  return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={placeholderImageUrl('gift_cards')} style={{ width: 44, height: 44, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} /></XStack>;
}

function Simulator({ simulation }: { simulation: PricingSimulationResponse }) {
  return <Panel title="Rule Simulator"><YStack gap="$3"><Badge label="Conflict warning" tone="critical" /><Paragraph color="$gray10">{simulation.conflictWarnings[0]}</Paragraph><Price label="Buyer item price" value={simulation.buyerDisplay.itemPrice} /><Price label="Seller discount" value={-simulation.buyerDisplay.sellerDiscount} /><Price label="Platform discount" value={-simulation.buyerDisplay.platformDiscount} /><Price label="Buyer service fee" value={simulation.buyerDisplay.buyerServiceFee} /><Price label="Buyer total" value={simulation.buyerDisplay.total} strong /><Paragraph color="$gray10">Admin breakdown: {simulation.adminBreakdown.couponFundingAllocation}</Paragraph></YStack></Panel>;
}

function SellerSafeView({ simulation }: { simulation: PricingSimulationResponse }) {
  const seller = simulation.sellerDisplay;
  return <Panel title="Seller-Safe Pricing View"><YStack gap="$3"><Price label="Seller coupon impact" value={seller.sellerCouponImpact} /><Price label="Estimated seller receives" value={seller.estimatedSellerReceives} strong /><Badge label={seller.feeWaiverStatus} tone="success" /><Paragraph color="$gray10">{seller.sellerSafeCommissionSummary}</Paragraph><Paragraph color="$gray10">{seller.platformCouponImpactOnSellerPayout}</Paragraph><Paragraph color="$gray10">{seller.payoutHoldReserveImpact}</Paragraph></YStack></Panel>;
}

function Price({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{money(value)}</Text></XStack>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function money(value: number) { const sign = value < 0 ? '-' : ''; return `${sign}$${Math.abs(value).toFixed(2)}`; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
