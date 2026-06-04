import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H1, H2, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { getMarketplaceConfigDashboard, saveMarketplaceConfig } from './marketplaceConfigMockApi';
import type { CountryMarketplaceConfigSummary, MarketplaceConfigAuditLogItem, MarketplaceConfigDashboard, MarketplaceConfigDetail } from './marketplaceConfigTypes';

type Props = { onNavigate: (route: AppRoute) => void };
type ListComponent<T> = (props: { data: T[]; estimatedItemSize: number; keyExtractor: (item: T) => string; renderItem: (info: { item: T; index: number }) => ReactElement }) => ReactElement;
const CountryList = FlashList as unknown as ListComponent<CountryMarketplaceConfigSummary>;
const ConfigList = FlashList as unknown as ListComponent<MarketplaceConfigDetail>;
const AuditList = FlashList as unknown as ListComponent<MarketplaceConfigAuditLogItem>;
const tabs = ['Countries', 'Marketplaces', 'Eligibility', 'Feature Flags', 'Simulator', 'Audit'] as const;

export function MarketplaceConfigScreen({ onNavigate }: Props) {
  const selectedTab = useSelector(appState$.marketplaceConfig.selectedTab) as typeof tabs[number];
  const selectedCountry = useSelector(appState$.marketplaceConfig.selectedCountry);
  const [dashboard, setDashboard] = useState<MarketplaceConfigDashboard | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setDashboard(await getMarketplaceConfigDashboard());
    const stored = appStorage.getString('marketplaceConfigLastTab') as typeof tabs[number] | null;
    if (stored && tabs.includes(stored)) appState$.marketplaceConfig.selectedTab.set(stored);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    appState$.marketplaceConfig.saveStatus.set('SAVING');
    const result = await saveMarketplaceConfig();
    appState$.marketplaceConfig.saveStatus.set(result.status);
    setMessage(result.message);
  }

  if (!dashboard) return <YStack bg="$background" f={1} p="$5"><Centered title="Loading country and marketplace settings..." /></YStack>;

  const configs = dashboard.configs.filter((item) => item.countryCode === selectedCountry);

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1240} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack flex={1} gap="$2">
              <Text color="$blue10" fontWeight="800">Global marketplace control center</Text>
              <H1>Country & Marketplace Settings</H1>
              <Paragraph color="$gray10">Configure country availability, buyer/seller access, eligibility, feature flags, display order, simulation, and audit snapshots.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button onPress={() => onNavigate('home')}>Back</Button>
              <Button theme="purple" onPress={handleSave}>Save Config</Button>
              <DropdownMenu.Root><DropdownMenu.Trigger><Button>More</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="create">Create Marketplace Config</DropdownMenu.Item><DropdownMenu.Item key="simulate">Simulate Availability</DropdownMenu.Item><DropdownMenu.Item key="audit">View Audit Log</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root>
            </XStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.marketplaceConfig.selectedTab.set(tab); appStorage.setString('marketplaceConfigLastTab', tab); }}>{tab}</Button>)}</XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Countries' ? <Panel title="Country Configuration"><CountryList data={dashboard.countries} estimatedItemSize={132} keyExtractor={(item) => item.countryCode} renderItem={({ item, index }) => <CountryRow country={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Marketplaces' ? <Panel title={`${selectedCountry} Marketplace Configuration`}><ConfigList data={configs} estimatedItemSize={146} keyExtractor={(item) => item.configId} renderItem={({ item, index }) => <ConfigRow config={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Eligibility' ? <Panel title="Buyer / Seller Eligibility">{configs.map((config) => <Row key={config.configId} title={config.marketplaceName} meta={`Seller: ${config.sellerEligibility.userSafeMessage} Buyer: ${config.buyerEligibility.userSafeMessage}`} badge={config.status} tone={toneFor(config.status)} />)}</Panel> : null}
              {selectedTab === 'Feature Flags' ? <Panel title="Feature Flags">{configs.map((config) => <Row key={config.configId} title={config.marketplaceName} meta={Object.entries(config.featureFlags).filter(([, enabled]) => enabled).map(([key]) => key).join(', ')} badge={`${config.version}`} tone="info" />)}</Panel> : null}
              {selectedTab === 'Simulator' ? <Simulator dashboard={dashboard} /> : null}
              {selectedTab === 'Audit' ? <Panel title="Marketplace Config Audit Log"><AuditList data={dashboard.auditLog} estimatedItemSize={120} keyExtractor={(item) => item.auditId} renderItem={({ item, index }) => <AuditRow audit={item} index={index} />} /></Panel> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Selected Country"><Badge label={selectedCountry} tone="info" /><Paragraph color="$gray10">Registration and later country changes must follow this config. Existing orders keep original snapshots.</Paragraph></Panel>
              <Panel title="Status Summary"><Badge label={`${configs.filter((item) => item.status === 'ENABLED').length} enabled`} tone="success" /><Badge label={`${configs.filter((item) => item.status === 'COMING_SOON').length} coming soon`} tone="warning" /><Badge label={`${configs.filter((item) => item.status === 'DISABLED').length} disabled`} tone="critical" /></Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

const CountryRow = memo(function CountryRow({ country, index }: { country: CountryMarketplaceConfigSummary; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><Row title={`${country.countryName} (${country.countryCode})`} meta={`Currency ${country.defaultCurrency} / default ${country.defaultMarketplaceCode} / v${country.version}`} badge={country.status} tone={country.status === 'PUBLISHED' ? 'success' : 'warning'} action={() => appState$.marketplaceConfig.selectedCountry.set(country.countryCode)} /></Animated.View>;
});

function ConfigRow({ config, index }: { config: MarketplaceConfigDetail; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={config.marketplaceIconUrl} style={{ width: 48, height: 48, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="900">{config.marketplaceName}</Text><Paragraph color="$gray10">Buyer {config.buyerAvailability.buyerStatus} / Seller {config.sellerAvailability.sellerStatus} / order {config.displayOrder}</Paragraph></YStack><Badge label={config.status} tone={toneFor(config.status)} /></XStack></Animated.View>;
}

function Simulator({ dashboard }: { dashboard: MarketplaceConfigDashboard }) {
  const simulation = dashboard.simulation;
  return <Panel title="Availability Simulator"><YStack gap="$3"><Badge label={simulation.allowed ? 'Allowed' : 'Blocked'} tone={simulation.allowed ? 'success' : 'critical'} /><Paragraph color="$gray10">{simulation.userSafeMessage}</Paragraph><Paragraph color="$gray10">Missing: {simulation.missingRequirements.join(', ')}</Paragraph><Paragraph color="$gray10">Flags: {simulation.featureFlagsEnabled.join(', ')}</Paragraph><Paragraph color="$orange10">{simulation.warnings.join(' ')}</Paragraph></YStack></Panel>;
}

function AuditRow({ audit, index }: { audit: MarketplaceConfigAuditLogItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={audit.action} meta={`${audit.actorName} / ${audit.countryCode} ${audit.marketplaceCode} / ${audit.reason}`} badge={`v${audit.version}`} tone="info" /></Animated.View>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone, action }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success'; action?: () => void }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} />{action ? <Button onPress={action}>Select</Button> : null}</XStack>; }
function Centered({ title }: { title: string }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function toneFor(status: string) { return status === 'ENABLED' ? 'success' : status === 'DISABLED' || status === 'SUSPENDED' ? 'critical' : status === 'COMING_SOON' || status.includes('REQUIRES') || status === 'PILOT_BETA' ? 'warning' : 'info'; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 35, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
