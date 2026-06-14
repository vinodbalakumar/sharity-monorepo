import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H2, Paragraph, Text, XStack, YStack } from 'tamagui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { acceptAllRequired, acceptPolicy, getPoliciesDashboard, getPolicyChanges, getPolicyDetail } from './policiesMockApi';
const GroupList = FlashList;
const PolicyList = FlashList;
const BlockedList = FlashList;
const ChangeList = FlashList;
const HistoryList = FlashList;
const AdminList = FlashList;
const tabs = ['Required', 'Groups', 'Detail', 'What Changed', 'History', 'Admin Preview'];
export function PoliciesScreen({ onNavigate }) {
    const selectedTab = useSelector(appState$.policies.selectedTab);
    const selectedPolicyId = useSelector(appState$.policies.selectedPolicyId);
    const [dashboard, setDashboard] = useState(null);
    const [detail, setDetail] = useState(null);
    const [changes, setChanges] = useState(null);
    const [message, setMessage] = useState('');
    const load = useCallback(async () => {
        const nextDashboard = await getPoliciesDashboard();
        setDashboard(nextDashboard);
        setDetail(await getPolicyDetail(selectedPolicyId));
        setChanges(await getPolicyChanges(selectedPolicyId));
        const stored = appStorage.getString('policiesLastTab');
        if (stored && tabs.includes(stored))
            appState$.policies.selectedTab.set(stored);
    }, [selectedPolicyId]);
    useEffect(() => { load(); }, [load]);
    async function handleAccept(policy) {
        appState$.policies.acceptLoading.set(true);
        const result = await acceptPolicy(policy.policyId, policy.currentVersion);
        appState$.policies.acceptLoading.set(false);
        setMessage(result.message);
    }
    async function handleAcceptAll() {
        appState$.policies.acceptLoading.set(true);
        const result = await acceptAllRequired();
        appState$.policies.acceptLoading.set(false);
        appState$.policies.acceptedCount.set(result.acceptedPolicies.length);
        setMessage(result.message);
    }
    if (!dashboard || !detail || !changes)
        return <YStack bg="$background" f={1} p="$5"><Centered title="Loading policies and terms..."/></YStack>;
    return (<InteriorShell onNavigate={onNavigate} title="Policies & Terms" subtitle="Review and accept policies" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        {dashboard.blockingSummary.blocked ? <PremiumCard p="$4"><YStack gap="$2"><Badge label="Action required" tone="warning"/><Paragraph color="$orange10">{dashboard.blockingSummary.userSafeMessage}</Paragraph></YStack></PremiumCard> : null}
        <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.policies.selectedTab.set(tab); appStorage.setString('policiesLastTab', tab); }}>{tab}</Button>)}</XStack>

        <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Required' ? <Panel title="Required Policies"><PolicyList data={dashboard.requiredPolicies} estimatedItemSize={132} keyExtractor={(item) => item.policyId} renderItem={({ item, index }) => <PolicyRow item={item} index={index} onAccept={() => handleAccept(item)}/>}/></Panel> : null}
              {selectedTab === 'Groups' ? <Panel title="Policy Groups"><GroupList data={dashboard.policyGroups} estimatedItemSize={112} keyExtractor={(item) => item.groupCode} renderItem={({ item, index }) => <GroupRow item={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Detail' ? <PolicyDetail detail={detail}/> : null}
              {selectedTab === 'What Changed' ? <Panel title="What Changed"><ChangeList data={changes.changeSummaryItems} estimatedItemSize={96} keyExtractor={(item) => item.title} renderItem={({ item, index }) => <ChangeRow item={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'History' ? <Panel title="Acceptance History"><HistoryList data={dashboard.acceptanceHistorySummary} estimatedItemSize={116} keyExtractor={(item) => item.acceptanceId} renderItem={({ item, index }) => <HistoryRow item={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Admin Preview' ? <Panel title="Published Policy Versions"><AdminList data={dashboard.adminPreviewVersions} estimatedItemSize={124} keyExtractor={(item) => `${item.policyId}-${item.version}`} renderItem={({ item, index }) => <AdminRow item={item} index={index}/>}/></Panel> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Blocking Summary"><BlockedList data={dashboard.blockingSummary.blockedActions} estimatedItemSize={116} keyExtractor={(item) => item.actionCode} renderItem={({ item, index }) => <BlockedRow item={item} index={index}/>}/></Panel>
              <Panel title="Policy Snapshot Rules"><Paragraph color="$gray10">Digital product terms are accepted per checkout/order and stored with immutable checkout/order snapshots.</Paragraph><Paragraph color="$gray10">Raw IP/device metadata, admin notes, compliance notes, hidden enforcement logic, and acceptance tokens are not stored locally.</Paragraph></Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
        </YStack>
    </InteriorShell>);
}
const PolicyRow = memo(function PolicyRow({ item, index, onAccept }) { const style = useEntrance(index); return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="900">{item.policyName}</Text><Paragraph color="$gray10">Current {item.currentVersion} / accepted {item.acceptedVersion ?? 'none'} / {item.requiredContexts.join(', ')}</Paragraph></YStack><Badge label={item.acceptanceStatus} tone={toneFor(item.acceptanceStatus)}/><Button onPress={() => { appState$.policies.selectedPolicyId.set(item.policyId); onAccept(); }}>{item.reacceptanceRequired ? 'Re-accept' : 'Accept'}</Button></XStack></Animated.View>; });
function GroupRow({ item, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.groupName} meta={`${item.acceptedCount} accepted / ${item.requiredCount} required / ${item.reacceptRequiredCount} updates`} badge={item.blocking ? 'Blocking' : 'Clear'} tone={item.blocking ? 'warning' : 'success'}/></Animated.View>; }
function PolicyDetail({ detail }) { return <Panel title={detail.policyName}><YStack gap="$3"><Badge label={detail.acceptanceStatus} tone={toneFor(detail.acceptanceStatus)}/><Paragraph color="$gray10">Version {detail.currentVersion} / Effective {new Date(detail.effectiveAt).toLocaleDateString()}</Paragraph><Paragraph color="$gray10">{detail.summary}</Paragraph><Paragraph>{detail.content}</Paragraph><Paragraph color="$blue10">{detail.whatChangedSummary}</Paragraph></YStack></Panel>; }
function ChangeRow({ item, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={`${item.description} / ${item.affectedContext}`} badge={item.severity} tone="warning"/></Animated.View>; }
function HistoryRow({ item, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.policyName} meta={`${item.role} / ${item.context} / accepted ${item.acceptedVersion}`} badge={item.reacceptanceNeeded ? 'Update' : 'Current'} tone={item.reacceptanceNeeded ? 'warning' : 'success'}/></Animated.View>; }
function AdminRow({ item, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.policyName} meta={`${item.policyType} / ${item.appliesToRoles.join(', ')} / ${item.appliesToContexts.join(', ')}`} badge={item.version} tone={item.reacceptanceRequired ? 'warning' : 'info'}/></Animated.View>; }
function BlockedRow({ item, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.actionLabel} meta={item.userSafeMessage} badge={item.blocked ? 'Blocked' : 'Clear'} tone={item.blocked ? 'critical' : 'success'}/></Animated.View>; }
function Panel({ title, children }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone}/></XStack>; }
function Centered({ title }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props}/>; }
function toneFor(status) { return status === 'ACCEPTED' ? 'success' : status.includes('REACCEPT') || status.includes('REQUIRED') ? 'warning' : status.includes('NOT') ? 'critical' : 'info'; }
function useEntrance(index) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 35, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
