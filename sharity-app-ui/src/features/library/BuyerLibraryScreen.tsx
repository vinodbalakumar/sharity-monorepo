import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H1, Input, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import { InteriorShell } from '../../components/appShell';
import type { AppRoute } from '../../types/navigation';
import {
  endRevealSession,
  getBuyerLibrary,
  prepareCodeReveal,
  prepareSecureDownload,
  reportLibraryIssue,
  revealCode,
  startSecureDownload
} from './libraryMockApi';
import type { LibraryAccessStatus, LibraryFilter, LibraryItem, LibraryProductType, RevealCodeResponse, RevealPrepareResponse } from './libraryTypes';

type BuyerLibraryScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenCodeReveal?: (accessId: string) => void;
  onOpenSecureDownload?: (accessId: string) => void;
};

type RevealStep = 'closed' | 'warning' | 'locationConsent' | 'revealed' | 'locationDenied';

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const filters: LibraryFilter[] = ['All', 'Codes', 'Downloads', 'Subscriptions', 'Courses', 'Services', 'Access Ready', 'Pending Review', 'Refunded', 'Seller Delivery Pending'];

const LibraryFlashList = FlashList as unknown as (props: {
  data: LibraryItem[];
  estimatedItemSize: number;
  keyExtractor: (item: LibraryItem) => string;
  numColumns?: number;
  renderItem: (info: { index: number; item: LibraryItem }) => ReactElement;
}) => ReactElement;

export function BuyerLibraryScreen({ onNavigate, onOpenCodeReveal, onOpenSecureDownload }: BuyerLibraryScreenProps) {
  const selectedFilter = useSelector(appState$.library.selectedFilter) as LibraryFilter;
  const searchQuery = useSelector(appState$.library.searchQuery);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  const [revealStep, setRevealStep] = useState<RevealStep>('closed');
  const [revealPrepare, setRevealPrepare] = useState<RevealPrepareResponse | null>(null);
  const [revealedCode, setRevealedCode] = useState<RevealCodeResponse | null>(null);
  const [activeItem, setActiveItem] = useState<LibraryItem | null>(null);
  const [isSensitiveHidden, setIsSensitiveHidden] = useState(false);

  const loadLibrary = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const library = await getBuyerLibrary();
      setItems(library.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
    const storedFilter = appStorage.getString('librarySelectedFilter') as LibraryFilter | null;
    if (storedFilter && filters.includes(storedFilter)) {
      appState$.library.selectedFilter.set(storedFilter);
    }
  }, [loadLibrary]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setIsSensitiveHidden(true);
        setRevealedCode(null);
        setRevealStep('closed');
      }
    });
    return () => subscription.remove();
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = matchesLibraryFilter(item, selectedFilter);
      const haystack = [
        item.productTitle,
        item.sellerDisplayName,
        item.orderId,
        productTypeLabel(item.productType),
        statusLabel(item.accessStatus),
        item.licenseSummary
      ].join(' ').toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [items, searchQuery, selectedFilter]);

  const columns = Platform.OS === 'web' ? 3 : 1;

  async function openRevealFlow(item: LibraryItem) {
    if (onOpenCodeReveal) {
      onOpenCodeReveal(item.accessId);
      return;
    }
    setActiveItem(item);
    setIsSensitiveHidden(false);
    appState$.library.revealModalAccessId.set(item.accessId);
    appState$.library.revealLoadingAccessId.set(item.accessId);
    const prepare = await prepareCodeReveal(item.accessId);
    setRevealPrepare(prepare);
    setRevealStep('warning');
    appState$.library.revealLoadingAccessId.set('');
  }

  async function agreeToReveal() {
    if (!activeItem) {
      return;
    }
    setRevealStep('locationConsent');
  }

  async function revealWithConsent() {
    if (!activeItem) {
      return;
    }
    appState$.library.revealLoadingAccessId.set(activeItem.accessId);
    try {
      const code = await revealCode(activeItem.accessId, {
        appVersion: 'story-011-mock',
        approxCity: 'Phoenix',
        approxCountry: 'US',
        approxState: 'AZ',
        deviceId: 'mock-device-session',
        locationConsentStatus: 'ACCEPTED',
        platform: Platform.OS,
        sessionId: 'mock-session-001'
      });
      setRevealedCode(code);
      setRevealStep('revealed');
      setTimeout(() => {
        setRevealedCode(null);
        setIsSensitiveHidden(true);
        if (code.revealId) {
          endRevealSession(activeItem.accessId, code.revealId);
        }
      }, 60_000);
    } catch {
      setRevealStep('locationDenied');
    } finally {
      appState$.library.revealLoadingAccessId.set('');
    }
  }

  function denyLocationConsent() {
    setRevealedCode(null);
    setRevealStep('locationDenied');
  }

  function closeReveal() {
    if (activeItem && revealedCode) {
      endRevealSession(activeItem.accessId, revealedCode.revealId);
    }
    setRevealStep('closed');
    setRevealedCode(null);
    setRevealPrepare(null);
    setActiveItem(null);
    appState$.library.revealModalAccessId.set('');
  }

  async function downloadItem(item: LibraryItem) {
    if (onOpenSecureDownload) {
      onOpenSecureDownload(item.accessId);
      return;
    }
    appState$.library.downloadLoadingAccessId.set(item.accessId);
    await prepareSecureDownload(item.accessId);
    const download = await startSecureDownload(item.accessId);
    setMessage(`Secure download started. Signed URL expires at ${new Date(download.expiresAt).toLocaleTimeString()}.`);
    appState$.library.downloadLoadingAccessId.set('');
  }

  async function reportIssue(item: LibraryItem) {
    await reportLibraryIssue({ accessId: item.accessId, issueType: 'SELLER_ISSUE', message: 'Buyer reported a library issue from mock UI.' });
    setMessage('Issue reported. Support will review this digital access item.');
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="My Library" subtitle="Access your digital purchases" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <PremiumCard p="$4">
            <YStack gap="$4">
              <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
                <XStack ai="center" bg="$background" br="$6" borderColor="$borderColor" borderWidth={1} flex={1} gap="$2" px="$3" py="$2" width="100%">
                  <Ionicons color={colors.textSecondary} name="search" size={20} />
                  <Input
                    aria-label="Search your library"
                    bg="transparent"
                    borderWidth={0}
                    flex={1}
                    focusStyle={{ borderWidth: 0 }}
                    onChangeText={(value) => appState$.library.searchQuery.set(value)}
                    placeholder="Search your library"
                    value={searchQuery}
                  />
                </XStack>
                <StatusPill label="External camera capture cannot be fully prevented" tone="warning" />
              </XStack>
              <XStack flexWrap="wrap" gap="$2">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    size="$3"
                    theme={selectedFilter === filter ? 'purple' : undefined}
                    onPress={() => {
                      appState$.library.selectedFilter.set(filter);
                      appStorage.setString('librarySelectedFilter', filter);
                    }}
                  >
                    {filter}
                  </Button>
                ))}
              </XStack>
            </YStack>
          </PremiumCard>

          {loading ? <LoadingState /> : null}
          {error ? <ErrorState onRetry={loadLibrary} /> : null}
          {!loading && !error && filteredItems.length === 0 ? <EmptyState onNavigate={onNavigate} /> : null}
          {!loading && !error && filteredItems.length > 0 ? (
            <LibraryFlashList
              data={filteredItems}
              estimatedItemSize={360}
              keyExtractor={(item) => item.accessId}
              numColumns={columns}
              renderItem={({ item, index }) => (
                <LibraryItemCard
                  index={index}
                  item={item}
                  onDownload={downloadItem}
                  onReportIssue={reportIssue}
                  onReveal={openRevealFlow}
                />
              )}
            />
          ) : null}
        </YStack>
      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
      {revealStep !== 'closed' ? (
        <RevealOverlay
          hidden={isSensitiveHidden}
          item={activeItem}
          prepare={revealPrepare}
          revealed={revealedCode}
          step={revealStep}
          onAgree={agreeToReveal}
          onClose={closeReveal}
          onDeny={denyLocationConsent}
          onReveal={revealWithConsent}
        />
      ) : null}
    </InteriorShell>
  );
}

const LibraryItemCard = memo(function LibraryItemCard({
  index,
  item,
  onDownload,
  onReportIssue,
  onReveal
}: {
  index: number;
  item: LibraryItem;
  onDownload: (item: LibraryItem) => void;
  onReportIssue: (item: LibraryItem) => void;
  onReveal: (item: LibraryItem) => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const revealLoadingAccessId = useSelector(appState$.library.revealLoadingAccessId);
  const downloadLoadingAccessId = useSelector(appState$.library.downloadLoadingAccessId);

  useEffect(() => {
    opacity.value = withDelay(index * 40, withTiming(1, { duration: 240 }));
    translateY.value = withDelay(index * 40, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const disabled = isDisabledStatus(item.accessStatus);
  const canReveal = item.availableActions.includes('REVEAL_CODE') && !disabled;
  const canDownload = item.availableActions.includes('SECURE_DOWNLOAD') && !disabled;
  const primaryAction = primaryActionLabel(item);

  return (
    <Animated.View style={style}>
      <PremiumCard m="$2" p="$4">
        <YStack gap="$4">
          <XStack ai="flex-start" gap="$3">
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              placeholder={blurhash}
              source={{ uri: item.productImageUrl }}
              style={{ aspectRatio: 1, borderRadius: 14, height: 84, width: 84 }}
            />
            <YStack flex={1} gap="$2">
              <Text fontSize="$5" fontWeight="800">{item.productTitle}</Text>
              <Paragraph color="$gray10">{productTypeLabel(item.productType)} by {item.sellerDisplayName}</Paragraph>
              <XStack flexWrap="wrap" gap="$2">
                <StatusPill label={statusLabel(item.accessStatus)} tone={statusTone(item.accessStatus)} />
                <StatusPill label={item.refundStatus} tone={disabled ? 'error' : 'info'} />
              </XStack>
            </YStack>
          </XStack>

          <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} gap="$2" p="$3">
            <Text color="$gray10" fontSize="$2" fontWeight="800">Order {item.orderId} - Purchased {item.purchaseDate}</Text>
            <Text>{item.licenseSummary}</Text>
            {item.maskedCodePreview ? (
              <Text color="$blue10" fontFamily="$body" fontWeight="800">{item.maskedCodePreview}</Text>
            ) : null}
          </YStack>

          <XStack flexWrap="wrap" gap="$2">
            {canReveal ? (
              <Button disabled={revealLoadingAccessId === item.accessId} theme="purple" onPress={() => onReveal(item)}>
                {revealLoadingAccessId === item.accessId ? 'Preparing...' : 'Reveal Code'}
              </Button>
            ) : null}
            {canDownload ? (
              <Button disabled={downloadLoadingAccessId === item.accessId} theme="blue" onPress={() => onDownload(item)}>
                {downloadLoadingAccessId === item.accessId ? 'Preparing...' : 'Secure Download'}
              </Button>
            ) : null}
            {!canReveal && !canDownload ? <Button disabled={disabled}>{primaryAction}</Button> : null}
            <Button onPress={() => onReportIssue(item)}>Report Issue</Button>
            <Button>View Order Details</Button>
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
});

function RevealOverlay({
  hidden,
  item,
  prepare,
  revealed,
  step,
  onAgree,
  onClose,
  onDeny,
  onReveal
}: {
  hidden: boolean;
  item: LibraryItem | null;
  prepare: RevealPrepareResponse | null;
  revealed: RevealCodeResponse | null;
  step: RevealStep;
  onAgree: () => void;
  onClose: () => void;
  onDeny: () => void;
  onReveal: () => void;
}) {
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withSpring(1, { damping: 18, stiffness: 160 });
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <YStack ai="center" bg={colors.overlay} bottom={0} jc="center" left={0} p="$4" pos="absolute" right={0} top={0}>
      <Animated.View style={[{ maxWidth: 620, width: '100%' }, style]}>
        <PremiumCard p="$5">
          <YStack gap="$4">
            <XStack ai="center" jc="space-between">
              <Text fontSize="$6" fontWeight="800">Before revealing your code</Text>
              <Button size="$3" onPress={onClose}>Close</Button>
            </XStack>
            {step === 'warning' ? (
              <>
                <Paragraph>{prepare?.message ?? 'Revealing this code may affect refund eligibility. Do you want to continue?'}</Paragraph>
                <Paragraph color="$gray10">The revealed area is watermarked and each reveal is logged for fraud, refund, and dispute review.</Paragraph>
                <XStack flexWrap="wrap" gap="$2">
                  <Button onPress={onClose}>Cancel</Button>
                  <Button theme="purple" onPress={onAgree}>Continue</Button>
                </XStack>
              </>
            ) : null}
            {step === 'locationConsent' ? (
              <>
                <Paragraph>
                  To protect digital purchases and reduce fraud, Sharity records your approximate location, device, and reveal time when this code is revealed.
                </Paragraph>
                <Paragraph color="$gray10">Location is not shown to the seller and is not collected silently.</Paragraph>
                <XStack flexWrap="wrap" gap="$2">
                  <Button onPress={onDeny}>Cancel</Button>
                  <Button theme="purple" onPress={onReveal}>Agree & Reveal Code</Button>
                </XStack>
              </>
            ) : null}
            {step === 'revealed' ? (
              <>
                <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} gap="$2" p="$4" style={Platform.OS === 'web' ? ({ userSelect: 'none' } as never) : undefined}>
                  <Text color="$gray10" fontSize="$2" fontWeight="800">Watermarked secure reveal - visible for 60 seconds</Text>
                  <Text color="$purple10" fontSize="$8" fontWeight="900" ta="center">
                    {hidden ? revealed?.maskedCode : revealed?.revealedCode}
                  </Text>
                  <Text color="$gray10" fontSize="$2" ta="center">{revealed?.watermarkText}</Text>
                </YStack>
                <Paragraph color="$orange10">This code has been revealed. Refunds may require admin review.</Paragraph>
                <XStack flexWrap="wrap" gap="$2">
                  <Button theme="purple" onPress={onClose}>Hide Code</Button>
                  <Button>View Order Details</Button>
                  <Button>Contact Support</Button>
                </XStack>
              </>
            ) : null}
            {step === 'locationDenied' ? (
              <>
                <Paragraph>Location permission is required to reveal this code. You can try again or contact support.</Paragraph>
                <XStack flexWrap="wrap" gap="$2">
                  <Button onPress={onClose}>Close</Button>
                  <Button>Contact Support</Button>
                </XStack>
              </>
            ) : null}
            {item ? <Text color="$gray10" fontSize="$2">Access ID: {item.accessId}</Text> : null}
          </YStack>
        </PremiumCard>
      </Animated.View>
    </YStack>
  );
}

function LoadingState() {
  return (
    <YStack gap="$3">
      {[0, 1, 2].map((item) => (
        <PremiumCard key={item} p="$5">
          <YStack gap="$3">
            <YStack bg="$gray4" br="$4" h={18} w="60%" />
            <YStack bg="$gray3" br="$4" h={80} w="100%" />
          </YStack>
        </PremiumCard>
      ))}
    </YStack>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <CenteredCard>
      <Text fontSize="$6" fontWeight="800">Unable to load your library.</Text>
      <Button theme="purple" onPress={onRetry}>Retry</Button>
    </CenteredCard>
  );
}

function EmptyState({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <CenteredCard>
      <Text fontSize="$6" fontWeight="800">Your library is empty.</Text>
      <Paragraph ta="center">Your purchased digital codes, downloads, courses, and subscriptions will appear here.</Paragraph>
      <Button theme="purple" onPress={() => onNavigate('marketplaces')}>Browse Digital Products</Button>
    </CenteredCard>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <YStack bottom={24} left={24} pos="absolute" right={24}>
      <PremiumCard p="$3">
        <XStack ai="center" jc="space-between" gap="$3">
          <Text flex={1}>{message}</Text>
          <Button size="$3" onPress={onClose}>Dismiss</Button>
        </XStack>
      </PremiumCard>
    </YStack>
  );
}

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <YStack ai="center" jc="center" minHeight={320} p="$5">
      <PremiumCard maxWidth={560} p="$6" width="100%">
        <YStack ai="center" gap="$4">{children}</YStack>
      </PremiumCard>
    </YStack>
  );
}

function PremiumCard({ children, ...props }: { children: ReactNode; [key: string]: unknown }) {
  return (
    <Card borderColor="$borderColor" borderWidth={1} shadowColor="$shadowColor" shadowRadius={12} {...props}>
      {children}
    </Card>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'error' | 'info' | 'success' | 'warning' }) {
  const theme = tone === 'success' ? 'green' : tone === 'warning' ? 'orange' : tone === 'error' ? 'red' : 'blue';
  return (
    <YStack bg={`$${theme}4`} br="$10" px="$3" py="$2">
      <Text color={`$${theme}11`} fontSize="$2" fontWeight="800">{label}</Text>
    </YStack>
  );
}

function matchesLibraryFilter(item: LibraryItem, filter: LibraryFilter) {
  if (filter === 'All') {
    return true;
  }
  if (filter === 'Codes') {
    return ['DIGITAL_CODE', 'GAMING_CODE', 'SOFTWARE_KEY', 'GIFT_CARD'].includes(item.productType);
  }
  if (filter === 'Downloads') {
    return item.productType === 'DOWNLOADABLE_FILE';
  }
  if (filter === 'Subscriptions') {
    return item.productType === 'DIGITAL_SUBSCRIPTION';
  }
  if (filter === 'Courses') {
    return item.productType === 'ONLINE_COURSE';
  }
  if (filter === 'Services') {
    return item.productType === 'DIGITAL_SERVICE_ORDER';
  }
  if (filter === 'Access Ready') {
    return ['ACCESS_READY', 'ACCESS_GRANTED', 'DOWNLOAD_READY', 'CODE_REVEAL_AVAILABLE'].includes(item.accessStatus);
  }
  if (filter === 'Pending Review') {
    return item.accessStatus === 'PENDING_RISK_REVIEW';
  }
  if (filter === 'Refunded') {
    return item.accessStatus === 'REFUNDED';
  }
  return item.accessStatus === 'SELLER_DELIVERY_PENDING';
}

function statusTone(status: LibraryAccessStatus): 'error' | 'info' | 'success' | 'warning' {
  if (['ACCESS_READY', 'DOWNLOAD_READY', 'CODE_REVEAL_AVAILABLE', 'ACCESS_GRANTED'].includes(status)) {
    return 'success';
  }
  if (['PENDING_RISK_REVIEW', 'SELLER_DELIVERY_PENDING', 'DISPUTED'].includes(status)) {
    return 'warning';
  }
  if (['ACCESS_REVOKED', 'REFUNDED', 'EXPIRED'].includes(status)) {
    return 'error';
  }
  return 'info';
}

function isDisabledStatus(status: LibraryAccessStatus) {
  return ['ACCESS_REVOKED', 'REFUNDED', 'EXPIRED'].includes(status);
}

function primaryActionLabel(item: LibraryItem) {
  if (item.productType === 'DIGITAL_SUBSCRIPTION') {
    return 'Open Access';
  }
  if (item.productType === 'ONLINE_COURSE') {
    return 'Open Course';
  }
  if (item.productType === 'DIGITAL_SERVICE_ORDER') {
    return 'View Service Order';
  }
  return isDisabledStatus(item.accessStatus) ? 'Access Disabled' : 'View Details';
}

function productTypeLabel(type: LibraryProductType) {
  return type
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function statusLabel(status: LibraryAccessStatus) {
  return status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
