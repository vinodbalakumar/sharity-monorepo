import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, Input, Paragraph, Text, XStack, YStack } from 'tamagui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { placeholderImageUrl } from '../../utils/mockImages';
import { getAuditLog, getCoupons, getFeeWaivers, getFreeProductRules, getPricingRules, runSimulation } from './pricingPromotionsMockApi';
const tabs = ['Rules', 'Coupons', 'Fee Waivers', 'Free Products', 'Simulator', 'Audit', 'Seller View'];
const RuleList = FlashList;
const CouponList = FlashList;
const WaiverList = FlashList;
const FreeRuleList = FlashList;
const AuditList = FlashList;
export function PricingPromotionsScreen({ onNavigate }) {
    const selectedTab = useSelector(appState$.pricingPromotions.selectedTab);
    const [rules, setRules] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [waivers, setWaivers] = useState([]);
    const [freeRules, setFreeRules] = useState([]);
    const [simulation, setSimulation] = useState(null);
    const [audit, setAudit] = useState([]);
    const load = useCallback(async () => {
        setRules(await getPricingRules());
        setCoupons(await getCoupons());
        setWaivers(await getFeeWaivers());
        setFreeRules(await getFreeProductRules());
        setSimulation(await runSimulation());
        setAudit(await getAuditLog());
        const stored = appStorage.getString('pricingPromotionsLastTab');
        if (stored && tabs.includes(stored))
            appState$.pricingPromotions.selectedTab.set(stored);
    }, []);
    useEffect(() => { load(); }, [load]);
    return (<InteriorShell onNavigate={onNavigate} title="Pricing, Fees & Promotions" subtitle="Configure buyer fees, seller commissions, coupons, fee waivers, free product rules, simulations, snapshots, and audit logs" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.pricingPromotions.selectedTab.set(tab); appStorage.setString('pricingPromotionsLastTab', tab); }}>{tab}</Button>)}</XStack>
          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Rules' ? <Panel title="Pricing Rules"><RuleList data={rules} estimatedItemSize={132} keyExtractor={(item) => item.ruleId} renderItem={({ item, index }) => <RuleRow index={index} rule={item}/>}/></Panel> : null}
              {selectedTab === 'Coupons' ? <Panel title="Coupon Manager"><CouponList data={coupons} estimatedItemSize={118} keyExtractor={(item) => item.couponId} renderItem={({ item, index }) => <CouponRow coupon={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Fee Waivers' ? <Panel title="Fee Waiver Sellers"><WaiverList data={waivers} estimatedItemSize={118} keyExtractor={(item) => item.feeWaiverId} renderItem={({ item, index }) => <WaiverRow index={index} waiver={item}/>}/></Panel> : null}
              {selectedTab === 'Free Products' ? <Panel title="Free / Promotional Product Rules"><FreeRuleList data={freeRules} estimatedItemSize={130} keyExtractor={(item) => item.ruleId} renderItem={({ item, index }) => <FreeRuleRow freeRule={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Simulator' && simulation ? <Simulator simulation={simulation}/> : null}
              {selectedTab === 'Audit' ? <Panel title="Audit Log"><AuditList data={audit} estimatedItemSize={120} keyExtractor={(item) => item.auditId} renderItem={({ item, index }) => <AuditRow auditItem={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Seller View' && simulation ? <SellerSafeView simulation={simulation}/> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Summary</Text><Badge label={`${rules.filter((rule) => rule.status === 'ACTIVE').length} active rules`} tone="success"/><Badge label={`${rules.filter((rule) => rule.status === 'DRAFT').length} draft rules`} tone="warning"/><Badge label="1 conflict warning" tone="critical"/><Paragraph color="$gray10">Buyer-safe pricing is used in cart and payment screens. Seller commission is never shown to buyers.</Paragraph></YStack></PremiumCard>
              <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Rule Editor</Text><Input bg="$background" borderColor="$borderColor" value="Buyer service fee fixed + percentage"/><Button theme="purple">Save Rule</Button><Button>Simulate Pricing</Button></YStack></PremiumCard>
            </YStack>
          </XStack>
        </YStack>
    </InteriorShell>);
}
function Panel({ title, children }) { return <PremiumCard p="$5"><YStack gap="$4"><Text fontSize="$6" fontWeight="900">{title}</Text>{children}</YStack></PremiumCard>; }
const RuleRow = memo(function RuleRow({ rule, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={rule.ruleName} meta={`${rule.ruleType} • ${rule.scope} • ${rule.marketplaceCode}/${rule.categoryCode}/${rule.countryCode}`} badge={`${rule.feeModel} v${rule.version}`} tone={rule.status === 'ACTIVE' ? 'success' : 'warning'}/></Animated.View>; });
function CouponRow({ coupon, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={coupon.couponCode} meta={`${coupon.couponType} • ${coupon.fundingSource} • Stackable: ${coupon.stackable ? 'Yes' : 'No'}`} badge={coupon.status} tone="success"/></Animated.View>; }
function WaiverRow({ waiver, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={waiver.storeName} meta={`${waiver.waiverType} • ${waiver.reason}`} badge={`${waiver.waiverPercentage}% waiver`} tone="info"/></Animated.View>; }
function FreeRuleRow({ freeRule, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={`${freeRule.productType} allowed`} meta={`${freeRule.marketplaceCode}/${freeRule.categoryCode}/${freeRule.countryCode} • Anti-abuse: ${freeRule.antiAbuseLevel}`} badge={freeRule.status} tone="success"/></Animated.View>; }
function AuditRow({ auditItem, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={auditItem.action} meta={`${auditItem.actorName} • ${auditItem.entityType} ${auditItem.entityId} • ${auditItem.reason}`} badge={`v${auditItem.version}`} tone="info"/></Animated.View>; }
function Row({ title, meta, badge, tone }) {
    return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={placeholderImageUrl('gift_cards')} style={{ width: 44, height: 44, borderRadius: 10 }}/><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone}/></XStack>;
}
function Simulator({ simulation }) {
    return <Panel title="Rule Simulator"><YStack gap="$3"><Badge label="Conflict warning" tone="critical"/><Paragraph color="$gray10">{simulation.conflictWarnings[0]}</Paragraph><Price label="Buyer item price" value={simulation.buyerDisplay.itemPrice}/><Price label="Seller discount" value={-simulation.buyerDisplay.sellerDiscount}/><Price label="Platform discount" value={-simulation.buyerDisplay.platformDiscount}/><Price label="Buyer service fee" value={simulation.buyerDisplay.buyerServiceFee}/><Price label="Buyer total" value={simulation.buyerDisplay.total} strong/><Paragraph color="$gray10">Admin breakdown: {simulation.adminBreakdown.couponFundingAllocation}</Paragraph></YStack></Panel>;
}
function SellerSafeView({ simulation }) {
    const seller = simulation.sellerDisplay;
    return <Panel title="Seller-Safe Pricing View"><YStack gap="$3"><Price label="Seller coupon impact" value={seller.sellerCouponImpact}/><Price label="Estimated seller receives" value={seller.estimatedSellerReceives} strong/><Badge label={seller.feeWaiverStatus} tone="success"/><Paragraph color="$gray10">{seller.sellerSafeCommissionSummary}</Paragraph><Paragraph color="$gray10">{seller.platformCouponImpactOnSellerPayout}</Paragraph><Paragraph color="$gray10">{seller.payoutHoldReserveImpact}</Paragraph></YStack></Panel>;
}
function Price({ label, value, strong }) { return <XStack jc="space-between"><Text color={strong ? '$color' : '$gray10'} fontWeight={strong ? '900' : '600'}>{label}</Text><Text fontWeight={strong ? '900' : '600'}>{money(value)}</Text></XStack>; }
function Badge({ label, tone }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props}/>; }
function money(value) { const sign = value < 0 ? '-' : ''; return `${sign}$${Math.abs(value).toFixed(2)}`; }
function useEntrance(index) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
