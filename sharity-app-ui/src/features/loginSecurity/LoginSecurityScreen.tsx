import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, Input, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { startGoogleLink } from '../../services/userApi';
import { getLoginSecurityScreenData, reportSuspiciousActivity, revokeDevice, signOutEverywhere } from './loginSecurityMockApi';
import type { AdminSecurityReviewQueueItem, DeviceSessionItem, LoginMethodItem, LoginSecurityScreenData, RecoveryOptionItem, SecurityAlertItem, SecurityEventHistoryItem, SecuritySeverity } from './loginSecurityTypes';

type Props = { onNavigate: (route: AppRoute) => void };
type ListComponent<T> = (props: { data: T[]; estimatedItemSize: number; keyExtractor: (item: T) => string; renderItem: (info: { item: T; index: number }) => ReactElement }) => ReactElement;
const MethodList = FlashList as unknown as ListComponent<LoginMethodItem>;
const DeviceList = FlashList as unknown as ListComponent<DeviceSessionItem>;
const AlertList = FlashList as unknown as ListComponent<SecurityAlertItem>;
const EventList = FlashList as unknown as ListComponent<SecurityEventHistoryItem>;
const RecoveryList = FlashList as unknown as ListComponent<RecoveryOptionItem>;
const AdminList = FlashList as unknown as ListComponent<AdminSecurityReviewQueueItem>;
const tabs = ['Overview', 'Login Methods', 'Devices', 'Alerts', 'Recovery', 'Report', 'Admin Review'] as const;
const filters = ['All', 'Logins', 'Password', 'Linked accounts', 'Devices', 'Payout security', 'Digital reveal security', 'Profile/country changes', 'Suspicious activity'];

export function LoginSecurityScreen({ onNavigate }: Props) {
  const selectedTab = useSelector(appState$.loginSecurity.selectedTab) as typeof tabs[number];
  const selectedFilter = useSelector(appState$.loginSecurity.selectedFilter);
  const [data, setData] = useState<LoginSecurityScreenData | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setData(await getLoginSecurityScreenData());
    const storedTab = appStorage.getString('loginSecurityLastTab') as typeof tabs[number] | null;
    const storedFilter = appStorage.getString('loginSecurityLastFilter');
    if (storedTab && tabs.includes(storedTab)) appState$.loginSecurity.selectedTab.set(storedTab);
    if (storedFilter) appState$.loginSecurity.selectedFilter.set(storedFilter);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runAction(action: string, entityId?: string) {
    if (action === 'ADD_GOOGLE_LOGIN') {
      startGoogleLink();
      return;
    }
    if (action === 'ADD_APPLE_LOGIN') {
      setMessage('Apple login is currently unavailable.');
      return;
    }
    const result = action === 'REVOKE_DEVICE' && entityId
      ? await revokeDevice(entityId)
      : action === 'SIGN_OUT_EVERYWHERE'
        ? await signOutEverywhere()
        : action === 'REPORT_SUSPICIOUS_ACTIVITY'
          ? await reportSuspiciousActivity()
          : { message: 'Action is not available in this build.' };
    setMessage(result.message);
  }

  if (!data) return <InteriorShell onNavigate={onNavigate} title="Login & Security" subtitle="Please wait..." scrollable={false}><Centered title="Loading login and security settings..." /></InteriorShell>;

  const filterNeedle = selectedFilter.toLowerCase().split(' ')[0] ?? '';
  const filteredEvents = data.events.filter((event) => selectedFilter === 'All' || event.eventType.replaceAll('_', ' ').toLowerCase().includes(filterNeedle));

  return (
    <InteriorShell activeLabel="Profile" onNavigate={onNavigate} scrollable={true} subtitle="Manage login methods, active devices, security alerts, and recovery options" title="Login & Security">
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} gap="$3">
            <Metric label="Security status" value={data.dashboard.securityStatus.replace('_', ' ')} tone={data.dashboard.securityStatus === 'RISK_DETECTED' ? 'critical' : data.dashboard.securityStatus === 'ACTION_RECOMMENDED' ? 'warning' : 'success'} />
            <Metric label="Login methods" value={data.dashboard.loginMethods} tone="success" />
            <Metric label="Active sessions" value={data.dashboard.activeDeviceCount} tone="info" />
            <Metric label="Required actions" value={data.dashboard.requiredActionCount} tone="warning" />
          </XStack>

          <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.loginSecurity.selectedTab.set(tab); appStorage.setString('loginSecurityLastTab', tab); }}>{tab}</Button>)}</XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Overview' ? <Overview data={data} onAction={runAction} /> : null}
              {selectedTab === 'Login Methods' ? <Panel title="Login Methods"><MethodList data={data.loginMethods} estimatedItemSize={116} keyExtractor={(item) => item.methodId} renderItem={({ item, index }) => <MethodRow item={item} index={index} onAction={runAction} />} /></Panel> : null}
              {selectedTab === 'Devices' ? <Panel title="Login Devices / Active Sessions"><DeviceList data={data.devices} estimatedItemSize={128} keyExtractor={(item) => item.deviceSessionId} renderItem={({ item, index }) => <DeviceRow item={item} index={index} onAction={runAction} />} /></Panel> : null}
              {selectedTab === 'Alerts' ? <YStack gap="$4"><Panel title="Security Alerts"><AlertList data={data.alerts} estimatedItemSize={122} keyExtractor={(item) => item.alertId} renderItem={({ item, index }) => <AlertRow item={item} index={index} onAction={runAction} />} /></Panel><Panel title="Security Event History"><EventList data={filteredEvents} estimatedItemSize={116} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <EventRow item={item} index={index} />} /></Panel></YStack> : null}
              {selectedTab === 'Recovery' ? <Panel title="Account Recovery Options"><RecoveryList data={data.recoveryOptions} estimatedItemSize={108} keyExtractor={(item) => item.recoveryType} renderItem={({ item, index }) => <RecoveryRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Report' ? <ReportPanel onAction={runAction} /> : null}
              {selectedTab === 'Admin Review' ? <Panel title="Admin Security Review Placeholder"><AdminList data={data.adminQueue} estimatedItemSize={126} keyExtractor={(item) => item.reviewId} renderItem={({ item, index }) => <AdminRow item={item} index={index} />} /></Panel> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Event Filters"><XStack flexWrap="wrap" gap="$2">{filters.map((filter) => <Button key={filter} size="$3" theme={selectedFilter === filter ? 'purple' : undefined} onPress={() => { appState$.loginSecurity.selectedFilter.set(filter); appStorage.setString('loginSecurityLastFilter', filter); }}>{filter}</Button>)}</XStack></Panel>
              <Panel title="Security Tips"><Paragraph color="$gray10">Never share passwords, payment card details, digital codes, or support one-time links. Review devices regularly and sign out sessions you do not recognize.</Paragraph></Panel>
              <Panel title="Privacy Guardrails"><Paragraph color="$gray10">This UI uses approximate location only and never shows raw IP, exact GPS, OAuth tokens, device fingerprints, internal risk, or admin notes.</Paragraph></Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
      </YStack>
    </InteriorShell>
  );
}

function Overview({ data, onAction }: { data: LoginSecurityScreenData; onAction: (action: string, entityId?: string) => void }) {
  const currentDevice = data.devices.find((device) => device.currentDevice) ?? data.devices[0];
  return <YStack gap="$4"><Panel title="Security Overview"><Row title="Action recommended" meta={`${data.dashboard.loginMethods} methods active / ${data.dashboard.activeDeviceCount} sessions / ${data.dashboard.recoveryStatus}`} badge={data.dashboard.securityStatus} tone="warning" /></Panel>{currentDevice ? <Panel title="Current Device"><DeviceRow item={currentDevice} index={0} onAction={onAction} /></Panel> : null}<Panel title="High-Risk Actions"><XStack flexWrap="wrap" gap="$2"><Button onPress={() => onAction('CHANGE_PASSWORD')}>Change Password</Button><Button onPress={() => onAction('UNLINK_FINAL_METHOD')}>Try Final Method Removal</Button><Button theme="purple" onPress={() => onAction('SIGN_OUT_EVERYWHERE')}>Sign Out Everywhere</Button></XStack></Panel></YStack>;
}

const MethodRow = memo(function MethodRow({ item, index, onAction }: { item: LoginMethodItem; index: number; onAction: (action: string, entityId?: string) => void }) {
  const style = useEntrance(index);
  const source = item.methodType === 'GOOGLE' ? 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' : item.methodType === 'APPLE' ? 'https://developer.apple.com/assets/elements/icons/sign-in-with-apple/sign-in-with-apple.svg' : undefined;
  return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3">{source ? <Image source={source} style={{ width: 42, height: 42, borderRadius: 10 }} /> : <IconCircle name="key-outline" tone={item.status === 'ACTIVE' ? 'success' : 'info'} />}<YStack flex={1}><Text fontWeight="900">{item.label}</Text><Paragraph color="$gray10">{item.status} / {item.linkedEmail ?? 'No safe email shown'} / {item.primary ? 'Primary' : 'Secondary or later'}</Paragraph>{item.unlinkBlockedReason ? <Paragraph color="$red10">{item.unlinkBlockedReason}</Paragraph> : null}</YStack><Badge label={item.canUnlink ? 'Unlink eligible' : 'Protected'} tone={item.canUnlink ? 'success' : 'warning'} /><DropdownMenu.Root><DropdownMenu.Trigger><Button>Actions</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="change" onSelect={() => onAction(item.methodType === 'PASSWORD' ? 'CHANGE_PASSWORD' : `LINK_${item.methodType}`)}>Secure flow</DropdownMenu.Item><DropdownMenu.Item key="unlink" disabled={!item.canUnlink} onSelect={() => onAction('UNLINK_LOGIN_METHOD', item.methodId)}>Unlink Login Method</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></XStack></Animated.View>;
});

function DeviceRow({ item, index, onAction }: { item: DeviceSessionItem; index: number; onAction: (action: string, entityId?: string) => void }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={item.deviceName} meta={`${item.browserOrApp} / ${item.platform} / ${item.approximateLocation} / Last active ${new Date(item.lastActiveAt).toLocaleString()}`} badge={item.currentDevice ? 'Current device' : item.sessionStatus} tone={item.currentDevice ? 'success' : 'warning'} actionLabel={item.currentDevice ? 'Protected' : 'Revoke'} action={item.currentDevice ? undefined : () => onAction('REVOKE_DEVICE', item.deviceSessionId)} /></Animated.View>;
}
function AlertRow({ item, index, onAction }: { item: SecurityAlertItem; index: number; onAction: (action: string, entityId?: string) => void }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={`${item.alertType} / ${item.approximateLocation ?? 'No location'} / ${item.userSafeMessage}`} badge={item.notificationSent ? 'Email/push sent' : 'In-app only'} tone={toneFromSeverity(item.severity)} actionLabel={item.reportSuspiciousAvailable ? 'Report' : undefined} action={item.reportSuspiciousAvailable ? () => onAction('REPORT_SUSPICIOUS_ACTIVITY', item.alertId) : undefined} /></Animated.View>; }
function EventRow({ item, index }: { item: SecurityEventHistoryItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={`${item.eventType} / ${item.approximateLocation} / ${item.actionTaken}`} badge={item.status} tone={item.status === 'ACTION_REQUIRED' ? 'warning' : 'info'} /></Animated.View>; }
function RecoveryRow({ item, index }: { item: RecoveryOptionItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.label} meta={`${item.status} / verified: ${item.verified ? 'yes' : 'no'} / ${item.lastUpdatedAt ?? 'Not updated yet'}`} badge={item.availableActions[0] ?? 'Later'} tone={item.status === 'ACTIVE' ? 'success' : item.status === 'MISSING' ? 'warning' : 'info'} /></Animated.View>; }
function AdminRow({ item, index }: { item: AdminSecurityReviewQueueItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={`${item.userSafeIdentifier} / ${item.eventType}`} meta={`${item.assignedTo} / ${item.createdAt} / placeholder only`} badge={item.status} tone={toneFromSeverity(item.severity)} /></Animated.View>; }
function ReportPanel({ onAction }: { onAction: (action: string) => void }) { return <Panel title="Report Suspicious Activity"><YStack gap="$3"><DropdownMenu.Root><DropdownMenu.Trigger><Button>Reason: I do not recognize this login</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="login">I do not recognize this login</DropdownMenu.Item><DropdownMenu.Item key="password">I did not change my password</DropdownMenu.Item><DropdownMenu.Item key="payout">I did not change payout method</DropdownMenu.Item><DropdownMenu.Item key="other">Other suspicious account activity</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root><Input bg="$background" borderColor="$borderColor" value="Unknown device activity from approximate Denver region. Please review and sign out other devices." /><Button theme="purple" onPress={() => onAction('REPORT_SUSPICIOUS_ACTIVITY')}>Submit Suspicious Activity Report</Button></YStack></Panel>; }

function Panel({ title, children }: { title: string; children: ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><Text fontSize="$6" fontWeight="900">{title}</Text>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone, actionLabel, action }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success'; actionLabel?: string; action?: () => void }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1} minWidth={0}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} />{actionLabel && action ? <Button onPress={action}>{actionLabel}</Button> : null}</XStack>; }
function Metric({ label, value, tone }: { label: string; value: string | number; tone: 'info' | 'warning' | 'critical' | 'success' }) { return <PremiumCard flex={1} minWidth={160} p="$4"><Text color={toneColor(tone)} fontSize="$8" fontWeight="900">{value}</Text><Text color="$gray10">{label}</Text></PremiumCard>; }
function IconCircle({ name, tone }: { name: ComponentProps<typeof Ionicons>['name']; tone: 'info' | 'success' }) { return <YStack ai="center" bg={tone === 'success' ? '$green3' : '$blue3'} br="$6" h={42} jc="center" w={42}><Ionicons color={tone === 'success' ? colors.success : colors.info} name={name} size={22} /></YStack>; }
function Centered({ title }: { title: string }) { return <PremiumCard p="$6"><Text fontSize="$6" fontWeight="900" ta="center">{title}</Text></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { return <Text bg={toneBg(tone)} br="$6" color={toneColor(tone)} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function toneFromSeverity(severity: SecuritySeverity) { return severity === 'CRITICAL' ? 'critical' : severity === 'WARNING' ? 'warning' : severity === 'SUCCESS' ? 'success' : 'info'; }
function toneBg(tone: 'info' | 'warning' | 'critical' | 'success') { return tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; }
function toneColor(tone: 'info' | 'warning' | 'critical' | 'success') { return tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 30, withTiming(1, { duration: 210 })); translateY.value = withDelay(index * 30, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
