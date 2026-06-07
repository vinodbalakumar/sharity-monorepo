import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { ReactElement, ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, H1, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { colors } from '../../theme';
import { InteriorShell } from '../../components/appShell';
import type { AppRoute } from '../../types/navigation';
import { closeDispute, getDisputeActions, getDisputeStatus, getDisputeTimeline, uploadRequestedDisputeEvidence } from './disputeStatusMockApi';
import type {
  DisputeEvidenceItem,
  DisputeOutcomeSummary,
  DisputeReviewStatus,
  DisputeStatusResponse,
  DisputeTimelineEvent
} from './disputeStatusTypes';

type DisputeStatusScreenProps = {
  disputeId: string | null;
  orderId?: string | null;
  onNavigate: (route: AppRoute) => void;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

const TimelineFlashList = FlashList as unknown as (props: {
  data: DisputeTimelineEvent[];
  estimatedItemSize: number;
  keyExtractor: (item: DisputeTimelineEvent) => string;
  renderItem: (info: { index: number; item: DisputeTimelineEvent }) => ReactElement;
}) => ReactElement;

const EvidenceFlashList = FlashList as unknown as (props: {
  data: DisputeEvidenceItem[];
  estimatedItemSize: number;
  keyExtractor: (item: DisputeEvidenceItem) => string;
  renderItem: (info: { index: number; item: DisputeEvidenceItem }) => ReactElement;
}) => ReactElement;

export function DisputeStatusScreen({ disputeId, onNavigate, orderId }: DisputeStatusScreenProps) {
  const closeConfirmationOpen = useSelector(appState$.disputeStatus.closeConfirmationOpen);
  const evidencePanelOpen = useSelector(appState$.disputeStatus.evidencePanelOpen);
  const [status, setStatus] = useState<DisputeStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<'ACCESS_DENIED' | 'NOT_FOUND' | 'STATUS_FAILED' | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    const nextStatus = await getDisputeStatus(disputeId, orderId);
    if (!nextStatus) {
      setError('NOT_FOUND');
      setLoading(false);
      return;
    }
    const [timeline, actions] = await Promise.all([
      getDisputeTimeline(nextStatus.dispute.disputeId),
      getDisputeActions(nextStatus.dispute.disputeId)
    ]);
    setStatus({ ...nextStatus, availableActions: actions, timeline });
    setLoading(false);
  }, [disputeId, orderId]);

  useEffect(() => {
    loadStatus();
    appState$.disputeStatus.closeConfirmationOpen.set(false);
    appState$.disputeStatus.evidencePanelOpen.set(false);
  }, [loadStatus]);

  const isDigital = status?.dispute.marketplaceCode === 'DIGITAL';
  const isElectronics = status?.dispute.marketplaceCode === 'ELECTRONICS';

  const primaryTone = useMemo(() => getStatusTone(status?.statusSummary.currentStatus), [status?.statusSummary.currentStatus]);

  async function uploadEvidence() {
    if (!status || !status.availableActions.canUploadEvidence) {
      setMessage('Evidence upload is available only when Sharity requests it.');
      return;
    }
    setBusy(true);
    const response = await uploadRequestedDisputeEvidence(status.dispute.disputeId);
    setStatus((current) => current ? {
      ...current,
      dispute: { ...current.dispute, status: response.status },
      evidence: [...current.evidence, response.evidence],
      statusSummary: {
        ...current.statusSummary,
        currentStatus: response.status,
        nextStepMessage: response.nextStep,
        requiresBuyerEvidence: false,
        statusLabel: 'Evidence submitted'
      },
      timeline: [
        ...current.timeline,
        {
          description: response.nextStep,
          eventId: `timeline-${response.evidence.evidenceId}`,
          eventType: 'EVIDENCE_SUBMITTED',
          timestamp: response.evidence.uploadedAt ?? new Date().toISOString(),
          title: 'Evidence submitted',
          visibility: 'BUYER_VISIBLE'
        }
      ]
    } : current);
    appState$.disputeStatus.evidencePanelOpen.set(false);
    setBusy(false);
    setMessage(response.nextStep);
  }

  async function confirmCloseDispute() {
    if (!status || !status.availableActions.canCloseDispute) {
      setMessage('This dispute cannot be closed right now.');
      return;
    }
    setBusy(true);
    const response = await closeDispute(status.dispute.disputeId);
    setStatus((current) => current ? {
      ...current,
      availableActions: { ...current.availableActions, canCloseDispute: false, canUploadEvidence: false },
      dispute: { ...current.dispute, status: response.status },
      statusSummary: {
        ...current.statusSummary,
        closed: true,
        currentStatus: response.status,
        decisionMade: true,
        nextStepMessage: response.message,
        requiresBuyerEvidence: false,
        requiresSellerResponse: false,
        statusLabel: 'Dispute closed'
      },
      timeline: [
        ...current.timeline,
        {
          description: response.message,
          eventId: 'timeline-dispute-closed',
          eventType: 'DISPUTE_CLOSED',
          timestamp: response.closedAt,
          title: 'Dispute closed',
          visibility: 'BUYER_VISIBLE'
        }
      ]
    } : current);
    appState$.disputeStatus.closeConfirmationOpen.set(false);
    setBusy(false);
    setMessage(response.message);
  }

  if (loading) {
    return <CenteredState message="Loading Sharity Review status..." />;
  }

  if (error || !status) {
    return (
      <CenteredState
        actionLabel={error === 'ACCESS_DENIED' ? 'Back to Orders' : 'Back to Order Details'}
        message={error === 'ACCESS_DENIED' ? "You do not have permission to view this dispute." : 'Dispute not found.'}
        onAction={() => onNavigate(error === 'ACCESS_DENIED' ? 'orders' : 'orderDetails')}
      />
    );
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="Dispute Status" subtitle="Track Sharity review and outcome" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <StatusSummaryCard status={status} tone={primaryTone} />
              <OutcomeCard finalOutcome={status.finalOutcome} outcomes={status.possibleOutcomes} />
              {status.estimatedRefund ? <EstimatedRefundCard status={status} /> : null}
              {isDigital && status.digitalAccessSummary ? <DigitalAccessCard status={status} /> : null}
              {isElectronics && status.shippingReturnSummary ? <ShippingReturnCard status={status} /> : null}
              <SellerResponseCard status={status} />
              <AdminDecisionCard status={status} />
            </YStack>

            <YStack gap="$4" width={420} $sm={{ width: '100%' }}>
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text color="$blue10" fontWeight="900">Review timeline</Text>
                  <TimelineFlashList
                    data={status.timeline}
                    estimatedItemSize={94}
                    keyExtractor={(item) => item.eventId}
                    renderItem={({ item, index }) => <TimelineCard event={item} index={index} />}
                  />
                </YStack>
              </PremiumCard>

              <PremiumCard p="$4">
                <YStack gap="$3">
                  <XStack ai="center" jc="space-between" gap="$3">
                    <Text fontSize="$6" fontWeight="900">Evidence</Text>
                    {status.availableActions.canUploadEvidence ? <StatusPill label="Requested" tone="warning" /> : <StatusPill label="Locked" tone="info" />}
                  </XStack>
                  <Paragraph color="$gray10">
                    Upload more evidence only when Sharity asks for it. Evidence files are private and access-controlled.
                  </Paragraph>
                  {status.availableActions.canUploadEvidence ? (
                    <Button theme="purple" onPress={() => appState$.disputeStatus.evidencePanelOpen.set(!evidencePanelOpen)}>
                      Upload Requested Evidence
                    </Button>
                  ) : null}
                  {evidencePanelOpen ? (
                    <YStack bg="$blue4" br="$5" gap="$2" p="$3">
                      <Text fontWeight="900">Requested evidence upload</Text>
                      <Paragraph>Mock upload: screenshots, package photos, invalid code proof, PDFs, or error messages.</Paragraph>
                      <Button disabled={busy} theme="purple" onPress={uploadEvidence}>{busy ? 'Uploading...' : 'Upload Mock Evidence'}</Button>
                    </YStack>
                  ) : null}
                  {status.evidence.length > 0 ? (
                    <EvidenceFlashList
                      data={status.evidence}
                      estimatedItemSize={86}
                      keyExtractor={(item) => item.evidenceId}
                      renderItem={({ item, index }) => <EvidenceCard evidence={item} index={index} />}
                    />
                  ) : <Text color="$gray10">No buyer evidence is visible yet.</Text>}
                </YStack>
              </PremiumCard>

              <ActionsCard
                busy={busy}
                isDigital={Boolean(isDigital)}
                isElectronics={Boolean(isElectronics)}
                onClose={() => appState$.disputeStatus.closeConfirmationOpen.set(true)}
                onNavigate={onNavigate}
                status={status}
              />
            </YStack>
          </XStack>
        </YStack>

      {closeConfirmationOpen ? (
        <YStack bottom={24} left={24} pos="absolute" right={24}>
          <PremiumCard p="$4">
            <YStack gap="$3">
              <Text fontSize="$6" fontWeight="900">Are you sure you want to close this dispute?</Text>
              <Paragraph color="$gray10">Closing a dispute tells Sharity the review is no longer needed.</Paragraph>
              <XStack $sm={{ flexDirection: 'column' }} gap="$2">
                <Button flex={1} onPress={() => appState$.disputeStatus.closeConfirmationOpen.set(false)}>Keep Dispute Open</Button>
                <Button disabled={busy} flex={1} theme="red" onPress={confirmCloseDispute}>{busy ? 'Closing...' : 'Close Dispute'}</Button>
              </XStack>
            </YStack>
          </PremiumCard>
        </YStack>
      ) : null}

      {message ? <Toast message={message} onClose={() => setMessage('')} /> : null}
    </InteriorShell>
  );
}

function StatusSummaryCard({ status, tone }: { status: DisputeStatusResponse; tone: StatusTone }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 260 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 140 });
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={style}>
      <PremiumCard p="$4">
        <YStack gap="$4">
          <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$3">
            <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: status.dispute.productImageUrl }} style={{ borderRadius: 14, height: 92, width: 92 }} />
            <YStack flex={1} gap="$1">
              <Text color="$gray10">{status.dispute.marketplaceName} - {status.dispute.productType}</Text>
              <Text fontSize="$7" fontWeight="900">{status.dispute.productTitle}</Text>
              <Text color="$gray10">Order {status.dispute.orderReference} - Dispute {status.dispute.disputeId}</Text>
              <Text color="$gray10">Seller: {status.dispute.sellerDisplayName}</Text>
            </YStack>
            <StatusPill label={status.statusSummary.statusLabel} tone={tone} />
          </XStack>
          <YStack bg="$blue4" br="$5" gap="$2" p="$3">
            <Text fontWeight="900">Next step</Text>
            <Paragraph>{status.statusSummary.nextStepMessage}</Paragraph>
          </YStack>
          <XStack flexWrap="wrap" gap="$2">
            <StatusPill label={`Submitted ${formatDate(status.dispute.submittedAt)}`} tone="info" />
            <StatusPill label={`Updated ${formatDate(status.dispute.lastUpdatedAt)}`} tone="info" />
            {status.statusSummary.requiresSellerResponse ? <StatusPill label="Seller response required" tone="warning" /> : null}
            {status.statusSummary.requiresBuyerEvidence ? <StatusPill label="Buyer evidence required" tone="warning" /> : null}
            {status.statusSummary.requiresAdminReview ? <StatusPill label="Admin review" tone="warning" /> : null}
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>
  );
}

function OutcomeCard({ finalOutcome, outcomes }: { finalOutcome?: DisputeOutcomeSummary; outcomes: DisputeOutcomeSummary[] }) {
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">{finalOutcome ? 'Final outcome' : 'Possible outcomes'}</Text>
        {finalOutcome ? (
          <YStack bg="$green4" br="$5" gap="$2" p="$3">
            <Text color="$green11" fontWeight="900">{finalOutcome.label}</Text>
            <Paragraph>{finalOutcome.description}</Paragraph>
          </YStack>
        ) : (
          <>
            <Paragraph color="$gray10">Sharity will review the order, evidence, seller response, marketplace rules, and payment/access history before making a decision.</Paragraph>
            <XStack flexWrap="wrap" gap="$2">
              {outcomes.map((outcome) => <StatusPill key={outcome.outcomeCode} label={outcome.label} tone="info" />)}
            </XStack>
          </>
        )}
      </YStack>
    </PremiumCard>
  );
}

function EstimatedRefundCard({ status }: { status: DisputeStatusResponse }) {
  const refund = status.estimatedRefund;
  if (!refund) {
    return null;
  }
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$green11" fontWeight="900">Estimated refund amount</Text>
        <Text fontSize="$8" fontWeight="900">{formatMoney(refund.amount)}</Text>
        <StatusPill label="Estimated until final decision" tone="warning" />
        <Paragraph color="$gray10">{refund.calculationSummary}</Paragraph>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={`Marketplace fee: ${refund.marketplaceFeeRefundStatus}`} tone="info" />
          <StatusPill label={`Tax: ${refund.taxRefundStatus}`} tone="info" />
          {refund.shippingRefundStatus ? <StatusPill label={`Shipping: ${refund.shippingRefundStatus}`} tone="info" /> : null}
        </XStack>
      </YStack>
    </PremiumCard>
  );
}

function DigitalAccessCard({ status }: { status: DisputeStatusResponse }) {
  const digital = status.digitalAccessSummary;
  if (!digital) {
    return null;
  }
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Digital access summary</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={`Code revealed: ${digital.codeRevealed ? 'Yes' : 'No'}`} tone={digital.codeRevealed ? 'warning' : 'success'} />
          <StatusPill label={`File downloaded: ${digital.fileDownloaded ? 'Yes' : 'No'}`} tone={digital.fileDownloaded ? 'warning' : 'success'} />
          <StatusPill label={`Access granted: ${digital.accessGranted ? 'Yes' : 'No'}`} tone={digital.accessGranted ? 'info' : 'warning'} />
          <StatusPill label={`Location consent: ${digital.locationConsentAccepted ? 'Accepted' : 'Not accepted'}`} tone="info" />
        </XStack>
        <Paragraph>{digital.reviewImpact}</Paragraph>
        <Paragraph color="$gray10">Actual digital codes, raw download URLs, exact location, IP address, device ID, risk score, and admin private notes are not shown.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

function ShippingReturnCard({ status }: { status: DisputeStatusResponse }) {
  const shipping = status.shippingReturnSummary;
  if (!shipping) {
    return null;
  }
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Shipping and return summary</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={`Shipping: ${shipping.shippingStatus}`} tone="info" />
          <StatusPill label={`Delivery: ${shipping.deliveryStatus}`} tone="info" />
          <StatusPill label={`Return required: ${shipping.returnRequired ? 'Yes' : 'No'}`} tone={shipping.returnRequired ? 'warning' : 'success'} />
          <StatusPill label={`Return instructions: ${shipping.returnInstructionsStatus}`} tone="info" />
          <StatusPill label={`Return shipment: ${shipping.returnShipmentStatus}`} tone="info" />
        </XStack>
        <Paragraph color="$gray10">Full buyer address, seller private address, raw carrier payloads, internal admin notes, and risk score are not shown.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

function SellerResponseCard({ status }: { status: DisputeStatusResponse }) {
  const sellerResponse = status.sellerResponse;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Seller response</Text>
        {sellerResponse?.responseAvailable ? (
          <>
            <StatusPill label={sellerResponse.responseStatus ?? 'Response available'} tone="info" />
            <Paragraph>{sellerResponse.buyerSafeMessage}</Paragraph>
            {sellerResponse.respondedAt ? <Text color="$gray10">Responded {formatDate(sellerResponse.respondedAt)}</Text> : null}
          </>
        ) : (
          <Paragraph color="$gray10">{sellerResponse?.responseStatus ?? 'Waiting for seller response.'}</Paragraph>
        )}
      </YStack>
    </PremiumCard>
  );
}

function AdminDecisionCard({ status }: { status: DisputeStatusResponse }) {
  const adminDecision = status.adminDecision;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Admin decision</Text>
        {adminDecision?.decisionAvailable ? (
          <>
            <StatusPill label={adminDecision.finalOutcome ?? adminDecision.decisionStatus ?? 'Decision made'} tone="success" />
            <Paragraph>{adminDecision.buyerSafeReason}</Paragraph>
            {adminDecision.nextStep ? <Paragraph color="$gray10">{adminDecision.nextStep}</Paragraph> : null}
          </>
        ) : (
          <Paragraph color="$gray10">No final decision yet. Sharity will show a buyer-safe reason when a decision is made.</Paragraph>
        )}
      </YStack>
    </PremiumCard>
  );
}

function ActionsCard({ busy, isDigital, isElectronics, onClose, onNavigate, status }: {
  busy: boolean;
  isDigital: boolean;
  isElectronics: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
  status: DisputeStatusResponse;
}) {
  const actions = status.availableActions;
  return (
    <PremiumCard p="$4">
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="900">Actions</Text>
        {actions.canViewReceipt ? <Button onPress={() => onNavigate('receipt')}>View Receipt</Button> : null}
        {actions.canViewRefundStatus ? <Button onPress={() => onNavigate('refundStatus')}>View Refund Status</Button> : null}
        {isDigital && actions.canGoToLibrary ? <Button onPress={() => onNavigate('library')}>Go to Library</Button> : null}
        {isElectronics && actions.canTrackPackage ? <Button onPress={() => onNavigate('tracking')}>Track Package</Button> : null}
        {actions.canBackToOrder ? <Button onPress={() => onNavigate('orderDetails')}>Back to Order Details</Button> : null}
        {actions.canCloseDispute ? <Button disabled={busy} theme="red" onPress={onClose}>Close Dispute</Button> : null}
        <Paragraph color="$gray10">Actions are controlled by dispute status and backend eligibility.</Paragraph>
      </YStack>
    </PremiumCard>
  );
}

const TimelineCard = memo(function TimelineCard({ event, index }: { event: DisputeTimelineEvent; index: number }) {
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
      <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} mb="$2" p="$3">
        <XStack ai="flex-start" gap="$3">
          <YStack ai="center" bg="$blue4" br="$10" h={36} jc="center" w={36}>
            <Ionicons color={colors.info} name="checkmark-circle-outline" size={20} />
          </YStack>
          <YStack flex={1} gap="$1">
            <Text fontWeight="900">{event.title}</Text>
            <Paragraph color="$gray10">{event.description}</Paragraph>
            <Text color="$gray10" fontSize="$2">{formatDate(event.timestamp)}</Text>
          </YStack>
        </XStack>
      </YStack>
    </Animated.View>
  );
});

const EvidenceCard = memo(function EvidenceCard({ evidence, index }: { evidence: DisputeEvidenceItem; index: number }) {
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
            <Text color="$gray10">{labelize(evidence.uploadStatus)}</Text>
          </YStack>
        </XStack>
      </YStack>
    </Animated.View>
  );
});

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

type StatusTone = 'error' | 'info' | 'success' | 'warning';

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const theme = tone === 'success' ? 'green' : tone === 'warning' ? 'orange' : tone === 'error' ? 'red' : 'blue';
  return (
    <YStack bg={`$${theme}4`} br="$10" px="$3" py="$2">
      <Text color={`$${theme}11`} fontSize="$2" fontWeight="800">{label}</Text>
    </YStack>
  );
}

function getStatusTone(status?: DisputeReviewStatus): StatusTone {
  if (!status) {
    return 'info';
  }
  if (status.includes('REFUND_APPROVED') || status.includes('REPLACEMENT') || status === 'DISPUTE_CLOSED') {
    return 'success';
  }
  if (status.includes('WAITING') || status.includes('REVIEW') || status.includes('RETURN')) {
    return 'warning';
  }
  if (status.includes('REJECTED') || status.includes('SUSPENSION')) {
    return 'error';
  }
  return 'info';
}

function labelize(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
