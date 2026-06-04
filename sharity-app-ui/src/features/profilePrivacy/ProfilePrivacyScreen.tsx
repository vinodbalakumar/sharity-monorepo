import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H1, H2, Input, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { getProfilePrivacySettings, requestDataExport, saveProfilePrivacySettings } from './profilePrivacyMockApi';
import type { BlockedUserItem, ProfilePrivacySettingsResponse, VerificationBadgeItem } from './profilePrivacyTypes';

type ProfilePrivacyScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const sections = ['Identity', 'Buyer', 'Seller', 'Privacy', 'Messages', 'Blocked', 'Badges', 'Data'] as const;

const BadgeFlashList = FlashList as unknown as (props: {
  data: VerificationBadgeItem[];
  estimatedItemSize: number;
  keyExtractor: (item: VerificationBadgeItem) => string;
  renderItem: (info: { index: number; item: VerificationBadgeItem }) => ReactElement;
}) => ReactElement;

const BlockedFlashList = FlashList as unknown as (props: {
  data: BlockedUserItem[];
  estimatedItemSize: number;
  keyExtractor: (item: BlockedUserItem) => string;
  renderItem: (info: { index: number; item: BlockedUserItem }) => ReactElement;
}) => ReactElement;

export function ProfilePrivacyScreen({ onNavigate }: ProfilePrivacyScreenProps) {
  const selectedSection = useSelector(appState$.profilePrivacy.selectedSection) as typeof sections[number];
  const deleteConfirmation = useSelector(appState$.profilePrivacy.deleteConfirmation);
  const realNameWarningOpen = useSelector(appState$.profilePrivacy.realNameWarningOpen);
  const [settings, setSettings] = useState<ProfilePrivacySettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setSettings(await getProfilePrivacySettings());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = appStorage.getString('profilePrivacySelectedSection') as typeof sections[number] | null;
    if (stored && sections.includes(stored)) {
      appState$.profilePrivacy.selectedSection.set(stored);
    }
    loadSettings();
  }, [loadSettings]);

  async function save() {
    appState$.profilePrivacy.saveStatus.set('SAVING');
    const response = await saveProfilePrivacySettings();
    appState$.profilePrivacy.saveStatus.set('SAVED');
    setMessage(response.message);
  }

  const visibleBadges = useMemo(() => settings?.verificationBadges ?? [], [settings?.verificationBadges]);

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1220} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack gap="$2" flex={1}>
              <Text color="$blue10" fontWeight="800">Privacy-first account settings</Text>
              <H1>Profile & Privacy</H1>
              <Paragraph color="$gray10">Control how your buyer and seller identity appears on Sharity.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button icon={<Ionicons name="arrow-back" size={18} />} onPress={() => onNavigate('home')}>Back</Button>
              <Button icon={<Ionicons name="save-outline" size={18} />} theme="purple" onPress={save}>Save Profile</Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger><Button icon={<Ionicons name="ellipsis-horizontal" size={18} />}>More</Button></DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item key="photo" onSelect={() => setMessage('Photo upload mock flow ready.')}>Upload/Change Photo</DropdownMenu.Item>
                  <DropdownMenu.Item key="messages" onSelect={() => appState$.profilePrivacy.selectedSection.set('Messages')}>Manage Message Privacy</DropdownMenu.Item>
                  <DropdownMenu.Item key="blocked" onSelect={() => appState$.profilePrivacy.selectedSection.set('Blocked')}>Manage Blocked Users</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </XStack>
          </XStack>

          {loading ? <CenteredState title="Loading profile and privacy settings..." /> : null}
          {error ? <CenteredState title="Profile not found." actionLabel="Reload" onAction={loadSettings} /> : null}

          {settings ? (
            <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
              <YStack gap="$4" width={286} $md={{ width: '100%' }}>
                <IdentityCard settings={settings} />
                <PremiumCard p="$3">
                  <YStack gap="$2">
                    {sections.map((section) => (
                      <Button
                        key={section}
                        justifyContent="flex-start"
                        theme={selectedSection === section ? 'purple' : undefined}
                        onPress={() => {
                          appState$.profilePrivacy.selectedSection.set(section);
                          appStorage.setString('profilePrivacySelectedSection', section);
                        }}
                      >
                        {section}
                      </Button>
                    ))}
                  </YStack>
                </PremiumCard>
              </YStack>

              <YStack flex={1} gap="$4" minWidth={0}>
                {selectedSection === 'Identity' ? <IdentitySection settings={settings} /> : null}
                {selectedSection === 'Buyer' ? <BuyerSection settings={settings} /> : null}
                {selectedSection === 'Seller' ? <SellerSection settings={settings} /> : null}
                {selectedSection === 'Privacy' ? <PrivacySection settings={settings} /> : null}
                {selectedSection === 'Messages' ? <MessageSection settings={settings} /> : null}
                {selectedSection === 'Blocked' ? (
                  <ListSection title="Blocked Users">
                    <BlockedFlashList
                      data={settings.blockedUsersSummary.users}
                      estimatedItemSize={128}
                      keyExtractor={(item) => item.blockedUserId}
                      renderItem={({ item, index }) => <BlockedRow blockedUser={item} index={index} />}
                    />
                  </ListSection>
                ) : null}
                {selectedSection === 'Badges' ? (
                  <ListSection title="Trust & Verification Badges">
                    <BadgeFlashList
                      data={visibleBadges}
                      estimatedItemSize={100}
                      keyExtractor={(item) => item.badgeType}
                      renderItem={({ item, index }) => <BadgeRow badge={item} index={index} />}
                    />
                  </ListSection>
                ) : null}
                {selectedSection === 'Data' ? <DataSection deleteConfirmation={deleteConfirmation} onRequestExport={async () => { const response = await requestDataExport(); setMessage(response.message); }} settings={settings} /> : null}
                {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
              </YStack>
            </XStack>
          ) : null}
        </YStack>
      </ScrollView>
      {realNameWarningOpen ? <RealNameWarning /> : null}
    </YStack>
  );
}

function IdentityCard({ settings }: { settings: ProfilePrivacySettingsResponse }) {
  return (
    <PremiumCard p="$4">
      <YStack ai="center" gap="$3">
        <Image source={settings.profile.profilePhotoUrl} placeholder={blurhash} style={{ width: 88, height: 88, borderRadius: 44 }} />
        <Text fontSize="$6" fontWeight="900">{settings.profile.displayName}</Text>
        <Badge label="Real name hidden publicly" tone="success" />
        <Text color="$gray10" ta="center">Buyer alias: {settings.buyerProfile.buyerAlias}</Text>
        <Text color="$gray10" ta="center">Seller alias: {settings.sellerProfile.sellerAlias}</Text>
        <Text color="$gray10" ta="center">Store: {settings.sellerProfile.storeName}</Text>
      </YStack>
    </PremiumCard>
  );
}

function IdentitySection({ settings }: { settings: ProfilePrivacySettingsResponse }) {
  return (
    <Section title="Profile Identity">
      <XStack $sm={{ flexDirection: 'column' }} gap="$3">
        <Field label="Display name" value={settings.profile.displayName} />
        <Field label="Country/region" value={`${settings.profile.country}, ${settings.profile.region}`} />
      </XStack>
      <XStack $sm={{ flexDirection: 'column' }} gap="$3">
        <Field label="Preferred language" value={settings.profile.preferredLanguage} />
        <Field label="Time zone" value={settings.profile.timeZone} />
      </XStack>
      <InfoCard title="Compliance-only fields" text="Date of birth, gender, legal identity, phone, email, and verification documents stay private unless required by law or platform policy." tone="info" />
    </Section>
  );
}

function BuyerSection({ settings }: { settings: ProfilePrivacySettingsResponse }) {
  return <Section title="Buyer Profile"><Field label="Buyer alias" value={settings.buyerProfile.buyerAlias} /><ToggleRows rows={['Show buyer alias instead of real name', 'Hide profile photo', 'Hide country/region', 'Hide purchase history', 'Hide online status', 'Hide last active']} /></Section>;
}

function SellerSection({ settings }: { settings: ProfilePrivacySettingsResponse }) {
  return <Section title="Seller Profile"><Field label="Seller alias" value={settings.sellerProfile.sellerAlias} /><Field label="Store name" value={settings.sellerProfile.storeName} /><Field label="Store description" value={settings.sellerProfile.storeDescription} /><ToggleRows rows={['Show seller alias/store name instead of real name', 'Hide seller sales count', 'Hide seller rating details', 'Seller profile visible within Sharity']} /></Section>;
}

function PrivacySection({ settings }: { settings: ProfilePrivacySettingsResponse }) {
  return (
    <Section title="Privacy Controls">
      <ToggleRows rows={['Hide real name from buyers/sellers', 'Show buyer alias instead of real name', 'Show seller alias/store name instead of real name', 'Hide country/region from public profile', 'Hide purchase history', 'Control profile visibility']} />
      <Button icon={<Ionicons name="warning-outline" size={18} />} theme="red" onPress={() => appState$.profilePrivacy.realNameWarningOpen.set(true)}>Request Real Name Public Visibility</Button>
      <InfoCard title="Digital Product Privacy" text={settings.digitalPrivacy.message} tone="info" />
    </Section>
  );
}

function MessageSection({ settings }: { settings: ProfilePrivacySettingsResponse }) {
  return <Section title="Message Privacy"><ToggleRows rows={['Allow messages only for orders/refunds/disputes', 'Pre-purchase questions later', 'Hide online status', 'Hide last active', `Blocked users: ${settings.messagePrivacy.blockedUserCount}`, 'Report user enabled']} /></Section>;
}

function DataSection({ settings, deleteConfirmation, onRequestExport }: { settings: ProfilePrivacySettingsResponse; deleteConfirmation: string; onRequestExport: () => void }) {
  return (
    <Section title="Data Export & Delete Account">
      <InfoCard title="Data export" text={`Status: ${settings.dataExportStatus.status}. Secure download route: ${settings.dataExportStatus.secureDownloadRoute}`} tone="info" />
      <Button icon={<Ionicons name="download-outline" size={18} />} theme="purple" onPress={onRequestExport}>Download My Data</Button>
      <InfoCard title="Delete account blocked" text={`${settings.deleteAccountEligibility.legalRetentionNotice} Blocking reasons: ${settings.deleteAccountEligibility.blockingReasons.join(', ')}.`} tone="critical" />
      <Input
        aria-label="Delete account confirmation"
        bg="$background"
        borderColor="$borderColor"
        onChangeText={(value) => appState$.profilePrivacy.deleteConfirmation.set(value)}
        placeholder="DELETE MY ACCOUNT"
        value={deleteConfirmation}
      />
      <Button disabled={deleteConfirmation !== 'DELETE MY ACCOUNT'} theme="red">Delete Account</Button>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>;
}

function ListSection({ title, children }: { title: string; children: ReactNode }) {
  return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <YStack flex={1} gap="$2"><Text color="$gray10" fontWeight="800">{label}</Text><Input bg="$background" borderColor="$borderColor" value={value} /></YStack>;
}

function ToggleRows({ rows }: { rows: string[] }) {
  return <YStack gap="$2">{rows.map((row) => <XStack key={row} ai="center" jc="space-between" gap="$3"><Text flex={1}>{row}</Text><Badge label={row.includes('later') ? 'Later' : 'On'} tone={row.includes('later') ? 'warning' : 'success'} /></XStack>)}</YStack>;
}

const BadgeRow = memo(function BadgeRow({ badge, index }: { badge: VerificationBadgeItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><PremiumCard mb="$3" p="$4"><XStack ai="center" gap="$3"><Ionicons color={badge.sellerSafeOnly ? colors.warning : colors.success} name={badge.sellerSafeOnly ? 'lock-closed' : 'checkmark-circle'} size={24} /><YStack flex={1}><Text fontWeight="900">{badge.label}</Text><Paragraph color="$gray10">{badge.description}</Paragraph></YStack><Badge label={badge.status} tone={badge.sellerSafeOnly ? 'warning' : 'success'} /></XStack></PremiumCard></Animated.View>;
});

const BlockedRow = memo(function BlockedRow({ blockedUser, index }: { blockedUser: BlockedUserItem; index: number }) {
  const style = useEntrance(index);
  return <Animated.View style={style}><PremiumCard mb="$3" p="$4"><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3"><YStack flex={1}><Text fontWeight="900">{blockedUser.displayAlias}</Text><Paragraph color="$gray10">{blockedUser.role} • {blockedUser.blockedReason} • {blockedUser.relatedEntityReference}</Paragraph></YStack><Button>Unblock</Button></XStack></PremiumCard></Animated.View>;
});

function RealNameWarning() {
  return (
    <YStack bg="$backgroundStrong" borderColor="$red8" borderWidth={1} bottom={24} br="$6" gap="$3" left={24} p="$4" position="absolute" right={24}>
      <Text color="$red10" fontWeight="900">Your real name is hidden by default.</Text>
      <Paragraph>Showing it publicly may reveal your identity to buyers and sellers. This mock flow requires explicit confirmation before backend approval.</Paragraph>
      <XStack gap="$2" jc="flex-end">
        <Button onPress={() => appState$.profilePrivacy.realNameWarningOpen.set(false)}>Keep Hidden</Button>
        <Button theme="red" onPress={() => appState$.profilePrivacy.realNameWarningOpen.set(false)}>I Understand</Button>
      </XStack>
    </YStack>
  );
}

function CenteredState({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return <PremiumCard p="$6"><YStack ai="center" gap="$3"><H2 ta="center">{title}</H2>{actionLabel ? <Button theme="purple" onPress={onAction}>{actionLabel}</Button> : null}</YStack></PremiumCard>;
}

function InfoCard({ title, text, tone }: { title: string; text: string; tone: 'info' | 'critical' }) {
  return <YStack bg={tone === 'critical' ? '$red3' : '$blue3'} br="$5" gap="$2" p="$4"><Text color={tone === 'critical' ? '$red10' : '$blue10'} fontWeight="900">{title}</Text><Paragraph color="$gray11">{text}</Paragraph></YStack>;
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
