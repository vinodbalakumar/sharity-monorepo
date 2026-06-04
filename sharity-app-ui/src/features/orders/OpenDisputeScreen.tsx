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
import type { AppRoute } from '../../types/navigation';
import {
  createDispute,
  getDisputeContext,
  getDisputeEligibility,
  getExistingDispute,
  uploadDisputeEvidence
} from './disputeMockApi';
import type { DisputeContextResponse, DisputeEligibilityResponse, DisputeEvidenceUploadResponse, DisputeReasonOption } from './disputeTypes';

type OpenDisputeScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenDisputeStatus?: (disputeId: string, orderId: string) => void;
  orderId: string | null;
  refundRequestId?: string | null;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const ReasonFlashList = FlashList as unknown as (props: {
  data: DisputeReasonOption[];
  estimatedItemSize: number;
  keyExtractor: (item: DisputeReasonOption) => string;
  renderItem: (info: { index: number; item: DisputeReasonOption }) => ReactElement;
}) => ReactElement;

const EvidenceFlashList = FlashList as unknown as (props: {
  data: DisputeEvidenceUploadResponse[];
  estimatedItemSize: number;
  keyExtractor: (item: DisputeEvidenceUploadResponse) => string;
  renderItem: (info: { index: number; item: DisputeEvidenceUploadResponse }) => ReactElement;
}) => ReactElement;

const outcomes = ['Full refund', 'Partial refund', 'Replacement', 'Seller provides valid code', 'Buyer return required', 'Dispute rejected', 'Seller warning/suspension', 'Account/risk review', 'Continue seller communication'];

export function OpenDisputeScreen({ onNavigate, onOpenDisputeStatus, orderId, refundRequestId }: OpenDisputeScreenProps) {
  const selectedReasonCode = useSelector(appState$.disputes.selectedReasonCode);
  const warningAccepted = useSelector(appState$.disputes.warningAccepted);
  const [eligibility, setEligibility] = useState<DisputeEligibilityResponse | null>(null);
  const [context, setContext] = useState<DisputeContextResponse | null>(null);
  const [evidence, setEvidence] = useState<DisputeEvidenceUploadResponse[]>([]);
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadDispute = useCallback(async () => {
    if (!orderId) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const [nextEligibility, nextContext, existing] = await Promise.all([
      getDisputeEligibility(orderId),
      getDisputeContext(orderId),
      getExistingDispute(orderId)
    ]);
    setEligibility(nextEligibility);
    setContext(nextContext);
    if (existing) {
      setMessage(`A dispute already exists: ${existing.disputeId}`);
    }
    setError(!nextEligibility || !nextContext);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadDispute();
    appState$.disputes.selectedReasonCode.set('');
    appState$.disputes.warningAccepted.set(false);
  }, [loadDispute]);

  const selectedReason = useMemo(
    () => eligibility?.allowedReasons.find((reason) => reason.reasonCode === selectedReasonCode) ?? null,
    [eligibility?.allowedReasons, selectedReasonCode]
  );

  async function addEvidence() {
    if (!orderId) {
      return;
    }
    const uploaded = await uploadDisputeEvidence(orderId);
    setEvidence((current) => [...current, uploaded]);
    setMessage('Evidence uploaded. Dispute evidence is private and access-controlled.');
  }

  async function submitDispute() {
    if (!orderId || !eligibility) {
      return;
    }
    if (!eligibility.eligible) {
      setMessage(eligibility.reason);
      return;
    }
    if (!selectedReason) {
      setMessage('Select a dispute reason.');
      return;
    }
    if (selectedReason.requiresRefundRequestFirst && !refundRequestId) {
      setMessage('Please submit a refund or return request before opening a dispute for this issue.');
      return;
    }
    if (evidence.length === 0) {
      setMessage('Please upload evidence before sending this dispute to Sharity Review.');
      return;
    }
    if (details.trim().length < 20) {
      setMessage('Describe the dispute with enough detail for Sharity Review.');
      return;
    }
    if (!warningAccepted) {
      setMessage('Acknowledge the dispute warning before submitting.');
      return;
    }
    setSubmitting(true);
    const response = await createDispute(orderId, {
      buyerAcknowledgedDisputeWarning: true,
      evidenceIds: evidence.map((item) => item.evidenceId),
      expectedResolution: selectedReason.reasonCode.includes('CODE') ? 'VALID_CODE' : 'ADMIN_REVIEW',
      message: details.trim(),
      reasonCode: selectedReason.reasonCode,
      refundRequestId
    });
    setSubmitting(false);
    if (onOpenDisputeStatus) {
      onOpenDisputeStatus(response.disputeId, orderId);
      return;
    }
    setMessage(`Dispute submitted: ${response.disputeId}. ${response.nextStep}`);
  }

  if (loading) {
    return <CenteredState message="Checking dispute eligibility..." />;
  }

  if (error || !eligibility || !context) {
    return <CenteredState actionLabel="Back to Orders" message="Order not found." onAction={() => onNavigate('orders')} />;
  }

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1240} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack gap="$2">
              <Text color="$blue10" fontWeight="800">Serious issue escalation</Text>
              <H1>Open Dispute</H1>
              <Paragraph color="$gray10">Send an unresolved marketplace issue to Sharity Review.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button onPress={() => onNavigate('orderDetails')}>Back to Order Details</Button>
              <Button theme="purple" onPress={() => onNavigate('orders')}>View Orders</Button>
            </XStack>
          </XStack>

          <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <ContextCard context={context} />
              <EligibilityCard eligibility={eligibility} />
              <HistoryCard context={context} />
              <SectionTitle title="Dispute reason" />
              <ReasonFlashList
                data={eligibility.allowedReasons}
                estimatedItemSize={116}
                keyExtractor={(reason) => reason.reasonCode}
                renderItem={({ item, index }) => <ReasonCard index={index} reason={item} selected={item.reasonCode === selectedReasonCode} />}
              />
            </YStack>

            <YStack gap="$4" width={420} $sm={{ width: '100%' }}>
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="900">Evidence</Text>
                  <Paragraph color="$gray10">Evidence is required. Upload screenshots, package photos, error messages, or payment/refund proof.</Paragraph>
                  <Button theme="purple" onPress={addEvidence}>Upload Evidence</Button>
                  {evidence.length > 0 ? (
                    <EvidenceFlashList
                      data={evidence}
                      estimatedItemSize={92}
                      keyExtractor={(item) => item.evidenceId}
                      renderItem={({ item, index }) => <EvidenceCard evidence={item} index={index} />}
                    />
                  ) : <Text color="$gray10">No dispute evidence uploaded yet.</Text>}
                </YStack>
              </PremiumCard>

              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="900">Describe the dispute</Text>
                  <TextArea
                    minHeight={132}
                    onChangeText={setDetails}
                    placeholder="Explain what happened, what resolution you expect, and what Sharity should review."
                    value={details}
                  />
                </YStack>
              </PremiumCard>

              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text color="$blue10" fontWeight="900">Possible outcomes</Text>
                  <XStack flexWrap="wrap" gap="$2">
                    {outcomes.map((outcome) => <StatusPill key={outcome} label={outcome} tone="info" />)}
                  </XStack>
                  <Paragraph>Sharity will review the order, evidence, seller response, marketplace rules, and payment/access history before making a decision.</Paragraph>
                </YStack>
              </PremiumCard>

              <PremiumCard p="$4">
                <YStack gap="$3">
                  <XStack ai="flex-start" gap="$3">
                    <YStack ai="center" bg="$orange4" br="$10" h={42} jc="center" w={42}>
                      <Ionicons color={colors.warning} name="alert-outline" size={22} />
                    </YStack>
                    <YStack flex={1} gap="$1">
                      <Text fontWeight="900">Dispute warning</Text>
                      <Paragraph>Opening false or abusive disputes may affect your account.</Paragraph>
                      <Paragraph color="$gray10">By sending this to Sharity Review, you confirm the information and evidence are accurate to the best of your knowledge.</Paragraph>
                    </YStack>
                  </XStack>
                  <Button theme={warningAccepted ? 'green' : undefined} onPress={() => appState$.disputes.warningAccepted.set(!warningAccepted)}>
                    {warningAccepted ? 'Warning Acknowledged' : 'Acknowledge Warning'}
                  </Button>
                  <Button disabled={submitting} theme="purple" onPress={submitDispute}>
                    {submitting ? 'Sending...' : 'Send to Sharity Review'}
                  </Button>
                </YStack>
              </PremiumCard>
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
    </YStack>
  );
}

function ContextCard({ context }: { context: DisputeContextResponse }) {
  const order = context.orderSummary;
  return (
    <PremiumCard p="$4">
      <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
        <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: order.productImageUrl }} style={{ borderRadius: 14, height: 88, width: 88 }} />
        <YStack flex={1} gap="$1">
          <Text fontSize="$6" fontWeight="900">{order.productTitle}</Text>
          <Text color="$gray10">{order.marketplaceName} - Seller: {order.sellerDisplayName}</Text>
          <Text color="$gray10">Order {order.orderReference} - {labelize(order.paymentStatus)} - {labelize(order.orderStatus)}</Text>
        </YStack>
        <Text fontSize="$6" fontWeight="900">{formatMoney(order.totalAmount)}</Text>
      </XStack>
    </PremiumCard>
  );
}

function EligibilityCard({ eligibility }: { eligibility: DisputeEligibilityResponse }) {
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
          <Text color="$blue10" fontWeight="900">Dispute eligibility</Text>
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="900">{labelize(eligibility.eligibilityStatus)}</Text>
              <Paragraph>{eligibility.reason}</Paragraph>
            </YStack>
            <StatusPill label={eligibility.eligible ? 'Eligible' : 'Not eligible'} tone={eligibility.eligible ? 'success' : 'error'} />
          </XStack>
          <XStack flexWrap="wrap" gap="$2">
            {eligibility.requiresRefundRequestFirst ? <StatusPill label="Refund required first" tone="warning" /> : null}
            {eligibility.requiresSellerResponse ? <StatusPill label="Seller response may be required" tone="warning" /> : null}
            {eligibility.requiresAdminReview ? <StatusPill label="Admin review" tone="warning" /> : null}
            <StatusPill label="Evidence required" tone="warning" />
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

function HistoryCard({ context }: { context: DisputeContextResponse }) {
  const digital = context.digitalAccessSummary;
  const shipping = context.shippingSummary;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Buyer-safe history summary</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={context.refundSummary ?? 'Refund status unavailable'} tone="info" />
          <StatusPill label={context.paymentSummary} tone="info" />
          {digital ? <StatusPill label={`Code revealed: ${digital.codeRevealed ? 'Yes' : 'No'}`} tone={digital.codeRevealed ? 'warning' : 'success'} /> : null}
          {digital ? <StatusPill label={`File downloaded: ${digital.fileDownloaded ? 'Yes' : 'No'}`} tone={digital.fileDownloaded ? 'warning' : 'success'} /> : null}
          {shipping ? <StatusPill label={labelize(shipping.shippingStatus)} tone="info" /> : null}
        </XStack>
        <Paragraph color="$gray10">Digital codes, raw download URLs, exact location, IP, device ID, raw carrier payloads, admin private notes, and risk score are not shown.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

const ReasonCard = memo(function ReasonCard({ index, reason, selected }: { index: number; reason: DisputeReasonOption; selected: boolean }) {
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
        <XStack ai="flex-start" gap="$3">
          <Button size="$3" theme={selected ? 'purple' : undefined} onPress={() => appState$.disputes.selectedReasonCode.set(reason.reasonCode)}>
            {selected ? 'Selected' : 'Select'}
          </Button>
          <YStack flex={1} gap="$2">
            <Text fontWeight="900">{reason.label}</Text>
            <Paragraph color="$gray10">{reason.guidance}</Paragraph>
            <XStack flexWrap="wrap" gap="$2">
              {reason.requiresRefundRequestFirst ? <StatusPill label="Refund first" tone="warning" /> : null}
              {reason.sellerResponseRequired ? <StatusPill label="Seller response" tone="info" /> : null}
              {reason.adminReviewRequired ? <StatusPill label="Admin review" tone="warning" /> : null}
            </XStack>
          </YStack>
        </XStack>
      </PremiumCard>
    </Animated.View>
  );
});

const EvidenceCard = memo(function EvidenceCard({ evidence, index }: { evidence: DisputeEvidenceUploadResponse; index: number }) {
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
            <Text fontWeight="900">{evidence.fileName}</Text>
            <Text color="$gray10">{evidence.fileType} - {Math.round(evidence.fileSize / 1000)} KB</Text>
          </YStack>
        </XStack>
      </YStack>
    </Animated.View>
  );
});

function SectionTitle({ title }: { title: string }) {
  return <Text fontSize="$6" fontWeight="900">{title}</Text>;
}

function CenteredState({ actionLabel, message, onAction }: { actionLabel?: string; message: string; onAction?: () => void }) {
  return (
    <YStack bg="$background" f={1}>
      <YStack ai="center" f={1} jc="center" p="$5">
        <PremiumCard maxWidth={560} p="$6" width="100%">
          <YStack ai="center" gap="$4">
            <Text fontSize="$6" fontWeight="900" ta="center">{message}</Text>
            {actionLabel && onAction ? <Button theme="purple" onPress={onAction}>{actionLabel}</Button> : null}
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
