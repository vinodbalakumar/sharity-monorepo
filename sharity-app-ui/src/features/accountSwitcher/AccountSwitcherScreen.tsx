import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { getAccountSwitcherSummary, switchAccountMode } from './accountSwitcherMockApi';
import type { AccountMode, AccountSwitcherResponse, MarketplaceModuleAvailability } from './accountSwitcherTypes';

type Props = { onNavigate: (route: AppRoute) => void };
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const ModuleList = FlashList as unknown as (props: { data: MarketplaceModuleAvailability[]; estimatedItemSize: number; keyExtractor: (item: MarketplaceModuleAvailability) => string; renderItem: (info: { item: MarketplaceModuleAvailability; index: number }) => ReactElement }) => ReactElement;

export function AccountSwitcherScreen({ onNavigate }: Props) {
  const currentMode = useSelector(appState$.accountSwitcher.currentMode) as AccountMode;
  const selectedMarketplace = useSelector(appState$.accountSwitcher.selectedMarketplace);
  const [summary, setSummary] = useState<AccountSwitcherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const storedMode = (appStorage.getString('accountSwitcherLastMode') as AccountMode | null) ?? currentMode;
    const storedMarketplace = appStorage.getString('accountSwitcherLastMarketplace') ?? selectedMarketplace;
    const response = await getAccountSwitcherSummary(storedMode, storedMarketplace);
    setSummary(response);
    appState$.accountSwitcher.currentMode.set(response.currentMode);
    appState$.accountSwitcher.selectedMarketplace.set(response.currentMarketplace);
    setLoading(false);
  }, [currentMode, selectedMarketplace]);

  useEffect(() => {
    load();
  }, [load]);

  async function switchMode(mode: AccountMode, marketplace = selectedMarketplace) {
    appState$.accountSwitcher.switchLoading.set(true);
    const response = await switchAccountMode(mode, marketplace);
    appState$.accountSwitcher.currentMode.set(response.currentMode);
    appState$.accountSwitcher.selectedMarketplace.set(response.currentMarketplace);
    appStorage.setString('accountSwitcherLastMode', response.currentMode);
    appStorage.setString('accountSwitcherLastMarketplace', response.currentMarketplace);
    setMessage(response.message);
    setSummary(await getAccountSwitcherSummary(response.currentMode, response.currentMarketplace));
    appState$.accountSwitcher.switchLoading.set(false);
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="Account Switcher" subtitle="Switch between buying, selling, and available marketplaces" scrollable={true}>
      <YStack gap="$5" maxWidth={1180} mx="auto" width="100%">
        {loading ? <CenteredState title="Loading account switcher..." /> : null}
          {summary ? (
            <>
              <CurrentSummary summary={summary} />
              <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
                <YStack gap="$4" width={360} $md={{ width: '100%' }}>
                  <IdentityCard title="Buyer Mode" alias={summary.buyerIdentity.buyerAlias} imageUrl={summary.buyerIdentity.avatarUrl} status={summary.buyerIdentity.buyerStatus} description="Shop digital products, electronics, and enabled marketplaces." onAction={() => switchMode('BUYER')} action="Switch to Buyer" />
                  <IdentityCard title="Seller Mode" alias={summary.sellerIdentity.sellerAlias} imageUrl={summary.sellerIdentity.storeLogoUrl} status={summary.sellerIdentity.onboardingStatus} description={`Store: ${summary.sellerIdentity.storeName}. Verification: ${summary.sellerIdentity.verificationStatus}. Payout: ${summary.sellerIdentity.payoutSetupStatus}.`} onAction={() => summary.sellerModeEligibility.eligible ? switchMode('SELLER') : setMessage('Seller onboarding is required before switching.')} action={summary.sellerModeEligibility.eligible ? 'Switch to Seller' : 'Start Seller Onboarding'} />
                  {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
                </YStack>
                <YStack flex={1} gap="$4" minWidth={0}>
                  <PremiumCard p="$5">
                    <YStack gap="$4">
                      <XStack ai="center" jc="space-between" gap="$3">
                        <Text fontSize="$6" fontWeight="900">Marketplace Modules</Text>
                        <Button onPress={() => setMessage('Marketplace preferences saved in mock state.')}>Manage Preferences</Button>
                      </XStack>
                      <ModuleList
                        data={summary.marketplaceModules}
                        estimatedItemSize={148}
                        keyExtractor={(item) => item.marketplaceCode}
                        renderItem={({ item, index }) => <MarketplaceRow index={index} module={item} onSelect={() => item.buyerAvailable ? switchMode(currentMode, item.marketplaceCode) : setMessage(item.reasonMessage ?? 'Marketplace unavailable.')} />}
                      />
                    </YStack>
                  </PremiumCard>
                  <UnavailableReasons modules={summary.marketplaceModules} />
                </YStack>
              </XStack>
            </>
          ) : null}
      </YStack>
    </InteriorShell>
  );
}

function CurrentSummary({ summary }: { summary: AccountSwitcherResponse }) {
  const identity = summary.currentMode === 'BUYER' ? `Buyer alias: ${summary.buyerIdentity.buyerAlias}` : `Store: ${summary.sellerIdentity.storeName}`;
  return <PremiumCard p="$5"><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$4"><Badge label={`Current mode: ${summary.currentMode}`} tone="success" /><Badge label={`Marketplace: ${summary.currentMarketplace}`} tone="info" /><Text color="$gray10">{summary.buyerIdentity.country} • {identity}</Text></XStack></PremiumCard>;
}

function IdentityCard({ title, alias, imageUrl, status, description, action, onAction }: { title: string; alias: string; imageUrl?: string; status: string; description: string; action: string; onAction: () => void }) {
  return <PremiumCard p="$5"><YStack gap="$4"><XStack ai="center" gap="$3"><Image source={imageUrl} placeholder={blurhash} style={{ width: 58, height: 58, borderRadius: 16 }} /><YStack flex={1}><Text fontSize="$6" fontWeight="900">{title}</Text><Text color="$gray10">{alias}</Text></YStack><Badge label={status} tone={status === 'COMPLETE' || status === 'ACTIVE' ? 'success' : 'warning'} /></XStack><Paragraph color="$gray10">{description}</Paragraph><Button theme="purple" onPress={onAction}>{action}</Button></YStack></PremiumCard>;
}

const MarketplaceRow = memo(function MarketplaceRow({ module, index, onSelect }: { module: MarketplaceModuleAvailability; index: number; onSelect: () => void }) {
  const style = useEntrance(index);
  const available = module.status === 'ENABLED';
  return <Animated.View style={style}><PremiumCard mb="$3" p="$4"><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3"><Image source={module.iconUrl} placeholder={blurhash} style={{ width: 54, height: 54, borderRadius: 12 }} /><YStack flex={1} gap="$1"><Text fontWeight="900">{module.marketplaceName}</Text><Paragraph color="$gray10">{module.reasonMessage ?? 'Enabled in USA by country/admin configuration.'}</Paragraph><XStack flexWrap="wrap" gap="$2"><Badge label={`Buyer ${module.buyerEnabledByUser ? 'On' : 'Off'}`} tone={module.buyerAvailable ? 'success' : 'critical'} /><Badge label={`Seller ${module.sellerEnabledByUser ? 'On' : 'Off'}`} tone={module.sellerAvailable ? 'success' : 'warning'} /><Badge label={module.status} tone={available ? 'success' : module.status.includes('COUNTRY') || module.status.includes('ADMIN') ? 'critical' : 'warning'} /></XStack></YStack><Button disabled={!module.buyerAvailable} onPress={onSelect}>{available ? 'Select' : module.requiredAction ?? 'Unavailable'}</Button></XStack></PremiumCard></Animated.View>;
});

function UnavailableReasons({ modules }: { modules: MarketplaceModuleAvailability[] }) {
  const unavailable = modules.filter((module) => module.status !== 'ENABLED');
  return <PremiumCard p="$5"><YStack gap="$3"><Text fontSize="$6" fontWeight="900">Required Actions</Text>{unavailable.map((module) => <XStack key={module.marketplaceCode} ai="center" jc="space-between" gap="$3"><YStack flex={1}><Text fontWeight="900">{module.marketplaceName}</Text><Paragraph color="$gray10">{module.reasonMessage ?? module.status}</Paragraph></YStack><Badge label={module.requiredAction ?? module.status} tone="warning" /></XStack>)}</YStack></PremiumCard>;
}

function CenteredState({ title }: { title: string }) {
  return <PremiumCard p="$6"><YStack ai="center" gap="$3"><Text fontSize="$6" fontWeight="900" ta="center">{title}</Text></YStack></PremiumCard>;
}

function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) {
  const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3';
  const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10';
  return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>;
}

function PremiumCard(props: ComponentProps<typeof Card>) {
  return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />;
}

function useEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 }));
  }, [index, opacity, translateY]);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}
