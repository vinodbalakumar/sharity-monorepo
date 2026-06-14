import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { getMarketplaceConfigDashboard, saveMarketplaceConfig } from './marketplaceConfigMockApi';
const CountryList = FlashList;
const ConfigList = FlashList;
const AuditList = FlashList;
const tabs = ['Countries', 'Marketplaces', 'Eligibility', 'Feature Flags', 'Simulator', 'Audit'];
export function MarketplaceConfigScreen({ onNavigate }) {
    const selectedTab = useSelector(appState$.marketplaceConfig.selectedTab);
    const selectedCountry = useSelector(appState$.marketplaceConfig.selectedCountry);
    const [dashboard, setDashboard] = useState(null);
    const [message, setMessage] = useState('');
    const load = useCallback(async () => {
        setDashboard(await getMarketplaceConfigDashboard());
        const stored = appStorage.getString('marketplaceConfigLastTab');
        if (stored && tabs.includes(stored))
            appState$.marketplaceConfig.selectedTab.set(stored);
    }, []);
    useEffect(() => { load(); }, [load]);
    async function handleSave() {
        appState$.marketplaceConfig.saveStatus.set('SAVING');
        const result = await saveMarketplaceConfig();
        appState$.marketplaceConfig.saveStatus.set(result.status);
        setMessage(result.message);
    }
    if (!dashboard)
        return <InteriorShell onNavigate={onNavigate} title="Marketplace Settings" subtitle="Please wait..." scrollable={false}><Centered title="Loading country and marketplace settings..."/></InteriorShell>;
    const configs = dashboard.configs.filter((item) => item.countryCode === selectedCountry);
    return (<InteriorShell onNavigate={onNavigate} title="Country & Marketplace Settings" subtitle="Configure country availability, buyer/seller access, eligibility, and feature flags" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.marketplaceConfig.selectedTab.set(tab); appStorage.setString('marketplaceConfigLastTab', tab); }}>{tab}</Button>)}</XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Countries' ? <Panel title="Country Configuration"><CountryList data={dashboard.countries} estimatedItemSize={132} keyExtractor={(item) => item.countryCode} renderItem={({ item, index }) => <CountryRow country={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Marketplaces' ? <Panel title={`${selectedCountry} Marketplace Configuration`}><ConfigList data={configs} estimatedItemSize={146} keyExtractor={(item) => item.configId} renderItem={({ item, index }) => <ConfigRow config={item} index={index}/>}/></Panel> : null}
              {selectedTab === 'Eligibility' ? <Panel title="Buyer / Seller Eligibility">{configs.map((config) => <Row key={config.configId} title={config.marketplaceName} meta={`Seller: ${config.sellerEligibility.userSafeMessage} Buyer: ${config.buyerEligibility.userSafeMessage}`} badge={config.status} tone={toneFor(config.status)}/>)}</Panel> : null}
              {selectedTab === 'Feature Flags' ? <Panel title="Feature Flags">{configs.map((config) => <Row key={config.configId} title={config.marketplaceName} meta={Object.entries(config.featureFlags).filter(([, enabled]) => enabled).map(([key]) => key).join(', ')} badge={`${config.version}`} tone="info"/>)}</Panel> : null}
              {selectedTab === 'Simulator' ? <Simulator dashboard={dashboard}/> : null}
              {selectedTab === 'Audit' ? <Panel title="Marketplace Config Audit Log"><AuditList data={dashboard.auditLog} estimatedItemSize={120} keyExtractor={(item) => item.auditId} renderItem={({ item, index }) => <AuditRow audit={item} index={index}/>}/></Panel> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Selected Country"><Badge label={selectedCountry} tone="info"/><Paragraph color="$gray10">Registration and later country changes must follow this config. Existing orders keep original snapshots.</Paragraph></Panel>
              <Panel title="Status Summary"><Badge label={`${configs.filter((item) => item.status === 'ENABLED').length} enabled`} tone="success"/><Badge label={`${configs.filter((item) => item.status === 'COMING_SOON').length} coming soon`} tone="warning"/><Badge label={`${configs.filter((item) => item.status === 'DISABLED').length} disabled`} tone="critical"/></Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
      </YStack>
    </InteriorShell>);
}
const CountryRow = memo(function CountryRow({ country, index }) {
    const style = useEntrance(index);
    return <Animated.View style={style}><Row title={`${country.countryName} (${country.countryCode})`} meta={`Currency ${country.defaultCurrency} / default ${country.defaultMarketplaceCode} / v${country.version}`} badge={country.status} tone={country.status === 'PUBLISHED' ? 'success' : 'warning'} action={() => appState$.marketplaceConfig.selectedCountry.set(country.countryCode)}/></Animated.View>;
});
function ConfigRow({ config, index }) {
    const style = useEntrance(index);
    return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={config.marketplaceIconUrl} style={{ width: 48, height: 48, borderRadius: 10 }}/><YStack flex={1}><Text fontWeight="900">{config.marketplaceName}</Text><Paragraph color="$gray10">Buyer {config.buyerAvailability.buyerStatus} / Seller {config.sellerAvailability.sellerStatus} / order {config.displayOrder}</Paragraph></YStack><Badge label={config.status} tone={toneFor(config.status)}/></XStack></Animated.View>;
}
function Simulator({ dashboard }) {
    const simulation = dashboard.simulation;
    return <Panel title="Availability Simulator"><YStack gap="$3"><Badge label={simulation.allowed ? 'Allowed' : 'Blocked'} tone={simulation.allowed ? 'success' : 'critical'}/><Paragraph color="$gray10">{simulation.userSafeMessage}</Paragraph><Paragraph color="$gray10">Missing: {simulation.missingRequirements.join(', ')}</Paragraph><Paragraph color="$gray10">Flags: {simulation.featureFlagsEnabled.join(', ')}</Paragraph><Paragraph color="$orange10">{simulation.warnings.join(' ')}</Paragraph></YStack></Panel>;
}
function AuditRow({ audit, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={audit.action} meta={`${audit.actorName} / ${audit.countryCode} ${audit.marketplaceCode} / ${audit.reason}`} badge={`v${audit.version}`} tone="info"/></Animated.View>; }
function Panel({ title, children }) { return <PremiumCard p="$5"><YStack gap="$4"><Text fontSize="$6" fontWeight="900">{title}</Text>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone, action }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone}/>{action ? <Button onPress={action}>Select</Button> : null}</XStack>; }
function Centered({ title }) { return <PremiumCard p="$6"><Text fontSize="$6" fontWeight="900" ta="center">{title}</Text></PremiumCard>; }
function Badge({ label, tone }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props}/>; }
function toneFor(status) { return status === 'ENABLED' ? 'success' : status === 'DISABLED' || status === 'SUSPENDED' ? 'critical' : status === 'COMING_SOON' || status.includes('REQUIRES') || status === 'PILOT_BETA' ? 'warning' : 'info'; }
function useEntrance(index) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 35, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
