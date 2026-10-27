import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H1, Paragraph, ScrollView, Text, TextArea, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { colors } from '../../theme';
import { InteriorShell } from '../../components/appShell';
import type { AppRoute } from '../../types/navigation';
import { getBuyerOrderDetails } from './orderDetailsMockApi';
import type { OrderDetailsResponse } from './orderDetailsTypes';
import {
  getLatestRefundRequest,
  getRefundEligibility,
  getRefundRequestConfig,
  submitRefundRequest,
  uploadRefundEvidence
} from './refundMockApi';
import type { EvidenceUploadResponse, RefundEligibilityResponse, RefundReasonOption, SubmitRefundRequest } from './refundTypes';

type RefundReturnRequestScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenRefundStatus?: (refundRequestId: string, orderId: string) => void;
  orderId: string | null;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const ReasonFlashList = FlashList as unknown as (props: {
  data: RefundReasonOption[];
  estimatedItemSize: number;
  keyExtractor: (item: RefundReasonOption) => string;
  renderItem: (info: { index: number; item: RefundReasonOption }) => ReactElement;
}) => ReactElement;

const EvidenceFlashList = FlashList as unknown as (props: {
  data: EvidenceUploadResponse[];
  estimatedItemSize: number;
  keyExtractor: (item: EvidenceUploadResponse) => string;
  renderItem: (info: { index: number; item: EvidenceUploadResponse }) => ReactElement;
}) => ReactElement;

export function RefundReturnRequestScreen({ onNavigate, onOpenRefundStatus, orderId }: RefundReturnRequestScreenProps) {
  const selectedReasonCode = useSelector(appState$.refunds.selectedReasonCode);
  const warningAccepted = useSelector(appState$.refunds.warningAccepted);
  const [details, setDetails] = useState<OrderDetailsResponse | null>(null);
  const [eligibility, setEligibility] = useState<RefundEligibilityResponse | null>(null);
  const [evidence, setEvidence] = useState<EvidenceUploadResponse[]>([]);
  const [message, setMessage] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadRefund = useCallback(async () => {
    if (!orderId) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
    const [orderDetails, refundEligibility, existing] = await Promise.all([
      getBuyerOrderDetails(orderId),
      getRefundEligibility(orderId),
      getLatestRefundRequest(orderId),
      getRefundRequestConfig(orderId)
    ]);
    setDetails(orderDetails);
    setEligibility(refundEligibility);
    if (existing) {
      setMessage(`A refund request already exists: ${existing.refundRequestId}`);
    }
    setError(!orderDetails || !refundEligibility);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => {
    loadRefund();
    appState$.refunds.selectedReasonCode.set('');
    appState$.refunds.warningAccepted.set(false);
  }, [loadRefund]);

  const selectedReason = useMemo(
    () => eligibility?.allowedReasons.find((reason) => reason.reasonCode === selectedReasonCode) ?? null,
    [eligibility?.allowedReasons, selectedReasonCode]
  );

  async function addEvidence(kind: 'digital' | 'electronics') {
    if (!orderId) {
      return;
    }
    const uploaded = await uploadRefundEvidence(orderId, kind === 'digital' ? 'invalid-code-screenshot.png' : 'package-damage-photo.png', 'image/png');
    setEvidence((current) => [...current, uploaded]);
    setMessage('Evidence uploaded. Files are private and review-scoped.');
  }

  async function submitRequest() {
    if (!orderId || !eligibility) {
      return;
    }
    if (!eligibility.eligible) {
      setMessage(eligibility.reason);
      return;
    }
    if (!selectedReason) {
      setMessage('Select a refund or return reason.');
      return;
    }
    if (selectedReason.requiresEvidence && evidence.length === 0) {
      setMessage('Evidence is required for this reason.');
      return;
    }
    if (selectedReason.requiresMessage && issueDetails.trim().length < 12) {
      setMessage('Add a few details so the request can be reviewed fairly.');
      return;
    }
    if (!warningAccepted) {
      setMessage('Acknowledge the false-claim warning before submitting.');
      return;
    }

    setSubmitting(true);
    const payload: SubmitRefundRequest = {
      buyerAcknowledgedFalseClaimWarning: true,
      evidenceIds: evidence.map((item) => item.evidenceId),
      message: issueDetails.trim(),
      reasonCode: selectedReason.reasonCode,
      requestedResolution: details?.order.marketplaceCode === 'ELECTRONICS' ? 'RETURN_AND_REFUND' : 'REFUND'
    };
    const response = await submitRefundRequest(orderId, payload);
    setSubmitting(false);
    if (onOpenRefundStatus) {
      onOpenRefundStatus(response.refundRequestId, orderId);
      return;
    }
    setMessage(`Refund request submitted: ${response.refundRequestId}. ${response.nextStep}`);
  }

  if (loading) {
    return <CenteredState message="Loading refund eligibility..." />;
  }

  if (error || !details || !eligibility) {
    return <CenteredState actionLabel="Back to Orders" message="Order not found." onAction={() => onNavigate('orders')} />;
  }

  const isDigital = details.order.marketplaceCode === 'DIGITAL';
  const isElectronics = details.order.marketplaceCode === 'ELECTRONICS';

  return (
    <InteriorShell onNavigate={onNavigate} title="Request Refund / Return" subtitle={`Order ${details.order.orderReference}`} scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <OrderSummary details={details} />
              <EligibilityCard eligibility={eligibility} />
              {isDigital && eligibility.digitalAccessHistory ? <DigitalAccessHistoryCard eligibility={eligibility} /> : null}
              {isElectronics && eligibility.electronicsReturnPolicy ? <ElectronicsPolicyCard eligibility={eligibility} /> : null}
              <SectionTitle title="Select a reason" />
              <ReasonFlashList
                data={eligibility.allowedReasons}
                estimatedItemSize={104}
                keyExtractor={(reason) => reason.reasonCode}
                renderItem={({ item, index }) => <ReasonCard index={index} reason={item} selected={item.reasonCode === selectedReasonCode} />}
              />
            </YStack>

            <YStack gap="$4" width={420} $sm={{ width: '100%' }}>
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="700">Evidence</Text>
                  <Paragraph color="$gray10">Upload screenshots, photos, videos, PDFs, or error messages. Evidence is not public.</Paragraph>
                  <XStack flexWrap="wrap" gap="$2">
                    <Button theme="blue" onPress={() => addEvidence(isDigital ? 'digital' : 'electronics')}>Upload Evidence</Button>
                    <Button onPress={() => setMessage('Evidence upload failed state is mocked for backend integration readiness.')}>Simulate Upload Failed</Button>
                  </XStack>
                  {evidence.length > 0 ? (
                    <EvidenceFlashList
                      data={evidence}
                      estimatedItemSize={92}
                      keyExtractor={(item) => item.evidenceId}
                      renderItem={({ item, index }) => <EvidenceCard evidence={item} index={index} onRemove={() => setEvidence((current) => current.filter((next) => next.evidenceId !== item.evidenceId))} />}
                    />
                  ) : (
                    <Text color="$gray10">No evidence uploaded yet.</Text>
                  )}
                </YStack>
              </PremiumCard>

              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="700">Describe the issue</Text>
                  <TextArea
                    minHeight={126}
                    onChangeText={setIssueDetails}
                    placeholder="Explain what happened and include details that can help us review your request."
                    value={issueDetails}
                  />
                  {selectedReason?.reasonCode === 'CHANGED_MY_MIND' ? <StatusPill label="Depends on seller policy" tone="warning" /> : null}
                </YStack>
              </PremiumCard>

              <PremiumCard p="$4">
                <YStack gap="$3">
                  <XStack ai="flex-start" gap="$3">
                    <YStack ai="center" bg="$orange4" br="$10" h={42} jc="center" w={42}>
                      <Ionicons color={colors.warning} name="alert-outline" size={22} />
                    </YStack>
                    <YStack flex={1} gap="$1">
                      <Text fontWeight="700">Submission warning</Text>
                      <Paragraph>Submitting false claims may affect your account and refund eligibility.</Paragraph>
                      <Paragraph color="$gray10">Your request may be reviewed by Sharity, the seller, or both.</Paragraph>
                    </YStack>
                  </XStack>
                  <Button
                    theme={warningAccepted ? 'green' : undefined}
                    onPress={() => appState$.refunds.warningAccepted.set(!warningAccepted)}
                  >
                    {warningAccepted ? 'Warning Acknowledged' : 'Acknowledge Warning'}
                  </Button>
                  <Button disabled={submitting} theme="blue" onPress={submitRequest}>
                    {submitting ? 'Submitting...' : 'Submit Refund Request'}
                  </Button>
                </YStack>
              </PremiumCard>
            </YStack>
          </XStack>
        </YStack>
      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
    </InteriorShell>
  );
}

function OrderSummary({ details }: { details: OrderDetailsResponse }) {
  const item = details.items[0]!;
  return (
    <PremiumCard p="$4">
      <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
        <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: item.productImageUrl }} style={{ borderRadius: 14, height: 88, width: 88 }} />
        <YStack flex={1} gap="$1">
          <Text fontSize="$6" fontWeight="700">{item.productTitle}</Text>
          <Text color="$gray10">{item.productType} - Seller: {details.seller.sellerDisplayName}</Text>
          <Text color="$gray10">Placed {formatDate(details.order.orderDate)} - {labelize(details.order.paymentStatus)} - {labelize(details.order.orderStatus)}</Text>
          {item.condition ? <Text color="$gray10">{item.condition}</Text> : null}
        </YStack>
        <Text fontSize="$6" fontWeight="700">{formatMoney(details.order.totalAmount)}</Text>
      </XStack>
    </PremiumCard>
  );
}

function EligibilityCard({ eligibility }: { eligibility: RefundEligibilityResponse }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 240 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 140 });
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <PremiumCard p="$4">
        <YStack gap="$3">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
            <YStack gap="$1">
              <Text color="$blue10" fontWeight="700">Refund eligibility</Text>
              <Text fontSize="$6" fontWeight="700">{labelize(eligibility.eligibilityStatus)}</Text>
            </YStack>
            <StatusPill label={eligibility.eligible ? 'Request Allowed' : 'Not Eligible'} tone={eligibility.eligible ? 'success' : 'error'} />
          </XStack>
          <Paragraph>{eligibility.reason}</Paragraph>
          <XStack flexWrap="wrap" gap="$2">
            {eligibility.requiresAdminReview ? <StatusPill label="Admin review required" tone="warning" /> : null}
            {eligibility.requiresSellerResponse ? <StatusPill label="Seller response may be required" tone="warning" /> : null}
            {eligibility.evidenceRequired ? <StatusPill label="Evidence required" tone="warning" /> : <StatusPill label="Evidence recommended" tone="info" />}
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

function DigitalAccessHistoryCard({ eligibility }: { eligibility: RefundEligibilityResponse }) {
  const history = eligibility.digitalAccessHistory!;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Digital access history</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={`Code revealed: ${history.codeRevealed ? 'Yes' : 'No'}`} tone={history.codeRevealed ? 'warning' : 'success'} />
          <StatusPill label={`File downloaded: ${history.fileDownloaded ? 'Yes' : 'No'}`} tone={history.fileDownloaded ? 'warning' : 'success'} />
          <StatusPill label={`Location consent: ${history.locationConsentAccepted ? 'Accepted' : 'Not used'}`} tone="info" />
        </XStack>
        {history.codeRevealTimestamp ? <Text color="$gray10">Reveal time: {formatDate(history.codeRevealTimestamp)}</Text> : null}
        {history.fileDownloadTimestamp ? <Text color="$gray10">Download time: {formatDate(history.fileDownloadTimestamp)}</Text> : null}
        <Paragraph>{history.refundEligibilityAfterAccess}</Paragraph>
        <Paragraph color="$gray10">Digital code value, raw download URL, exact location, IP, device ID, and risk score are not shown.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

function ElectronicsPolicyCard({ eligibility }: { eligibility: RefundEligibilityResponse }) {
  const policy = eligibility.electronicsReturnPolicy!;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="700">Electronics return policy</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={policy.returnWindowStatus} tone="info" />
          <StatusPill label={labelize(policy.deliveryStatus)} tone="info" />
          <StatusPill label={policy.warrantyStatus} tone="warning" />
        </XStack>
        <Paragraph>{policy.sellerReturnPolicy}</Paragraph>
        <Paragraph color="$gray10">{policy.returnMethodDecisionStatus}</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

const ReasonCard = memo(function ReasonCard({ index, reason, selected }: { index: number; reason: RefundReasonOption; selected: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(index * 35, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(index * 35, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$3" p="$4">
        <YStack gap="$3">
          <XStack ai="flex-start" gap="$3">
            <Button size="$3" theme={selected ? 'purple' : undefined} onPress={() => appState$.refunds.selectedReasonCode.set(reason.reasonCode)}>
              {selected ? 'Selected' : 'Select'}
            </Button>
            <YStack flex={1} gap="$1">
              <Text fontWeight="700">{reason.label}</Text>
              <XStack flexWrap="wrap" gap="$2">
                {reason.requiresEvidence ? <StatusPill label="Evidence required" tone="warning" /> : <StatusPill label="Evidence optional" tone="info" />}
                {reason.requiresMessage ? <StatusPill label="Details required" tone="warning" /> : null}
                {reason.adminReviewRequired ? <StatusPill label="Admin review" tone="warning" /> : null}
                {reason.sellerResponseRequired ? <StatusPill label="Seller response" tone="info" /> : null}
              </XStack>
            </YStack>
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
});

const EvidenceCard = memo(function EvidenceCard({ evidence, index, onRemove }: { evidence: EvidenceUploadResponse; index: number; onRemove: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} mb="$2" p="$3">
        <XStack ai="center" gap="$3">
          {evidence.previewUrl ? (
            <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: evidence.previewUrl }} style={{ borderRadius: 10, height: 52, width: 52 }} />
          ) : (
            <YStack ai="center" bg="$blue4" br="$4" h={52} jc="center" w={52}>
              <Ionicons color={colors.info} name="document-outline" size={22} />
            </YStack>
          )}
          <YStack flex={1}>
            <Text fontWeight="700">{evidence.fileName}</Text>
            <Text color="$gray10">{evidence.fileType} - {Math.round(evidence.fileSize / 1000)} KB</Text>
          </YStack>
          <Button size="$3" onPress={onRemove}>Remove</Button>
        </XStack>
      </YStack>
    </Animated.View>
  );
});

function SectionTitle({ title }: { title: string }) {
  return <Text fontSize="$6" fontWeight="700">{title}</Text>;
}

function CenteredState({ actionLabel, message, onAction }: { actionLabel?: string; message: string; onAction?: () => void }) {
  return (
    <YStack bg="$background" f={1}>
      <YStack ai="center" f={1} jc="center" p="$5">
        <PremiumCard maxWidth={560} p="$6" width="100%">
          <YStack ai="center" gap="$4">
            <Text fontSize="$6" fontWeight="700" ta="center">{message}</Text>
            {actionLabel && onAction ? <Button theme="blue" onPress={onAction}>{actionLabel}</Button> : null}
          </YStack>
        </PremiumCard>
      </YStack>
    </YStack>
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

function labelize(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
