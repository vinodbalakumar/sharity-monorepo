import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H1, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';
import { appState$ } from '../../state/appState';
import { colors } from '../../theme';
import { contactDigitalAccessSupport, endRevealSession, getDownloadFiles, getLibraryItemDetails, prepareCodeReveal, prepareSecureDownload, reportInvalidCode, revealCode, startSecureDownload } from './libraryMockApi';
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const FilesFlashList = FlashList;
export function CodeRevealScreen({ accessId, onNavigate }) {
    const [item, setItem] = useState(null);
    const [prepare, setPrepare] = useState(null);
    const [revealed, setRevealed] = useState(null);
    const [step, setStep] = useState('idle');
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const revealLoading = useSelector(appState$.secureAccess.revealedCodeHidden);
    const loadAccess = useCallback(async () => {
        if (!accessId) {
            setError(true);
            setLoading(false);
            return;
        }
        setError(false);
        setLoading(true);
        const access = await getLibraryItemDetails(accessId);
        setItem(access);
        setError(!access);
        setLoading(false);
    }, [accessId]);
    useEffect(() => {
        loadAccess();
    }, [loadAccess]);
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state !== 'active' && accessId && revealed) {
                setRevealed(null);
                setStep('idle');
                endRevealSession(accessId, revealed.revealId, { endedAt: new Date().toISOString(), endReason: 'APP_BACKGROUND' });
            }
        });
        return () => subscription.remove();
    }, [accessId, revealed]);
    useEffect(() => {
        if (!revealed) {
            return;
        }
        setTimer(60);
        const interval = setInterval(() => {
            setTimer((current) => {
                if (current <= 1) {
                    clearInterval(interval);
                    setRevealed(null);
                    setStep('idle');
                    if (accessId) {
                        endRevealSession(accessId, revealed.revealId, { endedAt: new Date().toISOString(), endReason: 'TIMER_EXPIRED' });
                    }
                    return 0;
                }
                return current - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [accessId, revealed]);
    async function prepareReveal() {
        if (!accessId) {
            return;
        }
        appState$.secureAccess.revealConsent.set('WARNING');
        appState$.library.revealLoadingAccessId.set(accessId);
        const response = await prepareCodeReveal(accessId);
        setPrepare(response);
        setStep('warning');
        appState$.library.revealLoadingAccessId.set('');
    }
    async function revealWithConsent() {
        if (!accessId) {
            return;
        }
        appState$.secureAccess.locationConsent.set('ACCEPTED');
        appState$.library.revealLoadingAccessId.set(accessId);
        try {
            const response = await revealCode(accessId, {
                appVersion: 'story-012-mock',
                approxCity: 'Phoenix',
                approxCountry: 'US',
                approxState: 'AZ',
                deviceId: 'mock-device-session',
                locationConsentStatus: 'ACCEPTED',
                platform: Platform.OS,
                sessionId: 'mock-session-001'
            });
            setRevealed({ ...response, revealedCode: chunkCode(response.revealedCode) });
            setStep('revealed');
            appState$.secureAccess.revealedCodeHidden.set(false);
        }
        catch {
            setStep('failed');
        }
        finally {
            appState$.library.revealLoadingAccessId.set('');
        }
    }
    async function hideCode() {
        if (accessId && revealed) {
            await endRevealSession(accessId, revealed.revealId, { endedAt: new Date().toISOString(), endReason: 'USER_HIDDEN' });
        }
        setRevealed(null);
        setStep('idle');
        appState$.secureAccess.revealedCodeHidden.set(true);
    }
    async function reportCode() {
        if (!accessId) {
            return;
        }
        await reportInvalidCode(accessId, { message: 'Buyer reported invalid code from secure reveal screen.', reasonCode: 'CODE_INVALID', revealId: revealed?.revealId });
        setStep('failed');
    }
    async function contactSupport() {
        if (!item) {
            return;
        }
        await contactDigitalAccessSupport({
            accessId: item.accessId,
            message: 'Buyer requested support from Code Reveal Screen.',
            orderId: item.orderId,
            productId: item.productId,
            revealId: revealed?.revealId,
            sellerId: item.sellerId
        });
        setStep('failed');
    }
    if (loading) {
        return <CenteredState message="Loading secure access..."/>;
    }
    if (error || !item) {
        return <CenteredState actionLabel="Back to Library" message="Code reveal is not available for this item." onAction={() => onNavigate('library')}/>;
    }
    return (<ScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1180} mx="auto" p="$5" width="100%">
          <Header eyebrow="Secure vault" onBack={() => onNavigate('library')} title="Secure Code Reveal"/>
          <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <ProductSummary item={item}/>
              <WarningCard title="Refund impact" body={prepare?.refundImpactWarning ?? 'Revealing this code may affect refund eligibility. Every reveal is logged.'}/>
              <WarningCard title="Capture protection" body="No copy is allowed. Screenshot and screen recording protection is enabled where supported; external camera capture cannot be fully prevented."/>
            </YStack>
            <PremiumCard p="$5" width={440} $sm={{ width: '100%' }}>
              <YStack gap="$4">
                <StatusPill label={revealed ? `Visible for ${timer}s` : 'Code hidden'} tone={revealed ? 'success' : 'warning'}/>
                <YStack bg="$background" br="$6" borderColor="$borderColor" borderWidth={1} gap="$3" minHeight={180} p="$5" style={Platform.OS === 'web' ? { userSelect: 'none' } : undefined}>
                  <Text color="$gray10" fontSize="$2" fontWeight="800">Watermarked sensitive area</Text>
                  <Text color="$purple10" fontSize="$8" fontWeight="900" ta="center">
                    {revealed && !revealLoading ? revealed.revealedCode : item.maskedCodePreview ?? 'XXXX - XXXX - XXXX - XXXX'}
                  </Text>
                  <Text color="$gray10" fontSize="$2" ta="center">{revealed?.watermarkText ?? `Sharity - Order ${item.orderId} - Buyer V***D - session protected`}</Text>
                </YStack>
                {step === 'idle' ? <Button theme="purple" onPress={prepareReveal}>Reveal Code</Button> : null}
                {step === 'warning' ? (<>
                    <Paragraph>{prepare?.message}</Paragraph>
                    <Button theme="purple" onPress={() => setStep('locationConsent')}>Continue</Button>
                    <Button onPress={() => setStep('idle')}>Cancel</Button>
                  </>) : null}
                {step === 'locationConsent' ? (<>
                    <Paragraph>To protect digital purchases and reduce fraud, Sharity records your approximate location, device, and reveal time when this code is revealed.</Paragraph>
                    <Button theme="purple" onPress={revealWithConsent}>Agree & Reveal Code</Button>
                    <Button onPress={() => setStep('denied')}>Cancel</Button>
                  </>) : null}
                {step === 'denied' ? <Paragraph color="$orange10">Location consent is required to reveal this code. You can contact support for help.</Paragraph> : null}
                {step === 'revealed' ? <Button theme="purple" onPress={hideCode}>Hide Code</Button> : null}
                <XStack flexWrap="wrap" gap="$2">
                  <Button onPress={reportCode}>Report Invalid Code</Button>
                  <Button onPress={contactSupport}>Contact Support</Button>
                </XStack>
              </YStack>
            </PremiumCard>
          </XStack>
        </YStack>
      </ScrollView>
    </ScreenShell>);
}
export function SecureDownloadScreen({ accessId, onNavigate }) {
    const selectedFileId = useSelector(appState$.secureAccess.downloadFileId);
    const [item, setItem] = useState(null);
    const [files, setFiles] = useState([]);
    const [step, setStep] = useState('idle');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const selectedFile = useMemo(() => files.find((file) => file.fileId === selectedFileId) ?? files[0], [files, selectedFileId]);
    const loadAccess = useCallback(async () => {
        if (!accessId) {
            setError(true);
            setLoading(false);
            return;
        }
        setError(false);
        setLoading(true);
        const [access, downloadFiles] = await Promise.all([getLibraryItemDetails(accessId), getDownloadFiles(accessId)]);
        setItem(access);
        setFiles(downloadFiles.files);
        appState$.secureAccess.downloadFileId.set(downloadFiles.files[0]?.fileId ?? '');
        setError(!access);
        setLoading(false);
    }, [accessId]);
    useEffect(() => {
        loadAccess();
    }, [loadAccess]);
    async function beginDownload() {
        if (!accessId || !selectedFile) {
            return;
        }
        const warning = await prepareSecureDownload(accessId);
        setMessage(warning.message);
        setStep('warning');
    }
    async function confirmDownload() {
        if (!accessId || !selectedFile) {
            return;
        }
        setStep('downloading');
        appState$.secureAccess.downloadLoading.set(true);
        try {
            const response = await startSecureDownload(accessId, selectedFile.fileId);
            setMessage(`Secure download started. Link expires at ${new Date(response.expiresAt).toLocaleTimeString()}.`);
            setStep('started');
        }
        catch {
            setStep('failed');
            setMessage('Unable to start secure download. Please try again.');
        }
        finally {
            appState$.secureAccess.downloadLoading.set(false);
        }
    }
    if (loading) {
        return <CenteredState message="Loading secure access..."/>;
    }
    if (error || !item) {
        return <CenteredState actionLabel="Back to Library" message="Secure download is not available for this item." onAction={() => onNavigate('library')}/>;
    }
    return (<ScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1180} mx="auto" p="$5" width="100%">
          <Header eyebrow="File locker" onBack={() => onNavigate('library')} title="Secure Download"/>
          <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <ProductSummary item={item}/>
              <WarningCard title="Download warning" body="Downloading this file may affect refund eligibility. Every download is logged and raw file URLs are never exposed."/>
              <FilesFlashList data={files} estimatedItemSize={128} keyExtractor={(file) => file.fileId} renderItem={({ item: file, index }) => <FileCard file={file} index={index}/>}/>
            </YStack>
            <PremiumCard p="$5" width={420} $sm={{ width: '100%' }}>
              <YStack gap="$4">
                <Text fontSize="$6" fontWeight="800">Selected file</Text>
                {selectedFile ? (<YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} gap="$2" p="$4">
                    <Text fontWeight="900">{selectedFile.fileName}</Text>
                    <Text color="$gray10">{selectedFile.fileType} - {selectedFile.fileSize} - {selectedFile.version}</Text>
                    <Text>{selectedFile.licenseSummary}</Text>
                    <StatusPill label={selectedFile.downloadStatus} tone={selectedFile.downloadStatus === 'READY' ? 'success' : 'info'}/>
                  </YStack>) : null}
                {message ? <Paragraph color={step === 'failed' ? '$red10' : '$orange10'}>{message}</Paragraph> : null}
                {step === 'warning' ? (<XStack flexWrap="wrap" gap="$2">
                    <Button onPress={() => setStep('idle')}>Cancel</Button>
                    <Button theme="purple" onPress={confirmDownload}>Continue Secure Download</Button>
                  </XStack>) : (<Button disabled={!selectedFile || step === 'downloading'} theme="purple" onPress={beginDownload}>
                    {step === 'downloading' ? 'Preparing secure link...' : 'Secure Download'}
                  </Button>)}
                <XStack flexWrap="wrap" gap="$2">
                  <Button onPress={() => setMessage('Support ticket created for this download access item.')}>Contact Support</Button>
                  <Button onPress={() => setMessage('Issue reported for this file.')}>Report Issue</Button>
                </XStack>
              </YStack>
            </PremiumCard>
          </XStack>
        </YStack>
      </ScrollView>
    </ScreenShell>);
}
const FileCard = memo(function FileCard({ file, index }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(14);
    useEffect(() => {
        opacity.value = withDelay(index * 50, withTiming(1, { duration: 220 }));
        translateY.value = withDelay(index * 50, withSpring(0, { damping: 16, stiffness: 140 }));
    }, [index, opacity, translateY]);
    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }]
    }));
    return (<Animated.View style={style}>
      <PremiumCard mb="$3" p="$4">
        <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
          <YStack ai="center" bg="$blue4" br="$5" h={54} jc="center" w={54}>
            <Ionicons color={colors.info} name="document-lock-outline" size={24}/>
          </YStack>
          <YStack flex={1} gap="$1">
            <Text fontWeight="900">{file.fileName}</Text>
            <Text color="$gray10">{file.fileType} - {file.fileSize} - {file.version} - Updated {file.lastUpdated}</Text>
            <Text>{file.licenseSummary}</Text>
          </YStack>
          <Button theme="blue" onPress={() => appState$.secureAccess.downloadFileId.set(file.fileId)}>Select</Button>
        </XStack>
      </PremiumCard>
    </Animated.View>);
});
function Header({ eyebrow, onBack, title }) {
    return (<XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
      <YStack gap="$2">
        <Text color="$blue10" fontWeight="800">{eyebrow}</Text>
        <H1>{title}</H1>
      </YStack>
      <Button onPress={onBack}>Back to Library</Button>
    </XStack>);
}
function ProductSummary({ item }) {
    return (<PremiumCard p="$5">
      <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$4">
        <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: item.productImageUrl }} style={{ borderRadius: 16, height: 112, width: 112 }}/>
        <YStack flex={1} gap="$2">
          <Text fontSize="$6" fontWeight="900">{item.productTitle}</Text>
          <Paragraph>{item.licenseSummary}</Paragraph>
          <XStack flexWrap="wrap" gap="$2">
            <StatusPill label={`Order ${item.orderId}`} tone="info"/>
            <StatusPill label={item.accessStatus.replaceAll('_', ' ')} tone="success"/>
            <StatusPill label={item.refundStatus} tone="warning"/>
          </XStack>
        </YStack>
      </XStack>
    </PremiumCard>);
}
function WarningCard({ body, title }) {
    return (<PremiumCard p="$4">
      <YStack gap="$2">
        <Text color="$orange10" fontWeight="900">{title}</Text>
        <Paragraph>{body}</Paragraph>
      </YStack>
    </PremiumCard>);
}
function CenteredState({ actionLabel, message, onAction }) {
    return (<ScreenShell>
      <YStack ai="center" f={1} jc="center" p="$5">
        <PremiumCard maxWidth={560} p="$6" width="100%">
          <YStack ai="center" gap="$4">
            <Text fontSize="$6" fontWeight="900" ta="center">{message}</Text>
            {actionLabel && onAction ? <Button theme="purple" onPress={onAction}>{actionLabel}</Button> : null}
          </YStack>
        </PremiumCard>
      </YStack>
    </ScreenShell>);
}
function ScreenShell({ children }) {
    return <YStack bg="$background" f={1}>{children}</YStack>;
}
function PremiumCard({ children, ...props }) {
    return (<Card borderColor="$borderColor" borderWidth={1} shadowColor="$shadowColor" shadowRadius={12} {...props}>
      {children}
    </Card>);
}
function StatusPill({ label, tone }) {
    const theme = tone === 'success' ? 'green' : tone === 'warning' ? 'orange' : tone === 'error' ? 'red' : 'blue';
    return (<YStack bg={`$${theme}4`} br="$10" px="$3" py="$2">
      <Text color={`$${theme}11`} fontSize="$2" fontWeight="800">{label}</Text>
    </YStack>);
}
function chunkCode(code) {
    return code.replaceAll('-', '').match(/.{1,4}/g)?.join(' - ') ?? code;
}
