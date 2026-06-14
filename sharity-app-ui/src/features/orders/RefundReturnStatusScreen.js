import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';
import { colors } from '../../theme';
import { InteriorShell } from '../../components/appShell';
import { cancelRefundRequest, getRefundStatus, openDisputeFromRefund, uploadRequestedEvidence } from './refundStatusMockApi';
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const TimelineFlashList = FlashList;
const EvidenceFlashList = FlashList;
export function RefundReturnStatusScreen({ onNavigate, onOpenDispute, orderId, refundRequestId }) {
    const [status, setStatus] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [message, setMessage] = useState('');
    const loadStatus = useCallback(async () => {
        setLoading(true);
        setError(false);
        const response = await getRefundStatus(refundRequestId, orderId);
        setStatus(response);
        setError(!response);
        setLoading(false);
    }, [orderId, refundRequestId]);
    useEffect(() => {
        loadStatus();
    }, [loadStatus]);
    async function uploadEvidence() {
        if (!status || !status.availableActions.canUploadEvidence) {
            setMessage('Evidence upload is available only when Sharity requests more evidence.');
            return;
        }
        const uploaded = await uploadRequestedEvidence(status.refundRequest.refundRequestId);
        setEvidence((current) => [...current, uploaded]);
        setMessage('Requested evidence uploaded for review.');
    }
    async function cancelRequest() {
        if (!status || !status.availableActions.canCancelRequest) {
            setMessage('This refund request cannot be cancelled at the current status.');
            return;
        }
        const response = await cancelRefundRequest(status.refundRequest.refundRequestId);
        setMessage(`Refund request ${response.status.toLowerCase()}.`);
    }
    async function openDispute() {
        if (!status || !status.availableActions.canOpenDispute) {
            setMessage('Dispute escalation is not available for this refund status.');
            return;
        }
        if (onOpenDispute) {
            onOpenDispute(status.refundRequest.orderId, status.refundRequest.refundRequestId);
            return;
        }
        const response = await openDisputeFromRefund(status.refundRequest.refundRequestId);
        setMessage(`Dispute opened: ${response.disputeId}`);
    }
    if (loading) {
        return <CenteredState message="Loading refund status..."/>;
    }
    if (error || !status) {
        return <CenteredState actionLabel="Back to Order Details" message="Refund request not found." onAction={() => onNavigate('orderDetails')}/>;
    }
    const isDigital = status.refundRequest.marketplaceCode === 'DIGITAL';
    const isElectronics = status.refundRequest.marketplaceCode === 'ELECTRONICS';
    return (<InteriorShell onNavigate={onNavigate} title="Return / Refund Status" subtitle={`Request ${status.refundRequest.refundRequestId}`} scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              <StatusSummaryCard status={status}/>
              <EstimatedRefundCard status={status}/>
              {isDigital && status.digitalAccessSummary ? <DigitalAccessCard status={status}/> : null}
              {isElectronics && status.returnInstructions ? <ReturnInstructionsCard status={status}/> : null}
              <ResponseCards status={status}/>
              <SectionTitle title="Timeline"/>
              <TimelineFlashList data={status.timeline} estimatedItemSize={110} keyExtractor={(event) => event.eventId} renderItem={({ item, index }) => <TimelineCard event={item} index={index}/>}/>
            </YStack>

            <YStack gap="$4" width={400} $sm={{ width: '100%' }}>
              <ProductCard status={status}/>
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="900">Actions</Text>
                  {status.availableActions.canUploadEvidence ? <Button theme="purple" onPress={uploadEvidence}>Upload Requested Evidence</Button> : null}
                  <Button onPress={() => setMessage('Support flow will open from /support/refunds when STORY support screens are added.')}>Contact Support</Button>
                  {status.availableActions.canCancelRequest ? <Button onPress={cancelRequest}>Cancel Refund Request</Button> : null}
                  {status.availableActions.canOpenDispute ? <Button theme="purple" onPress={openDispute}>Open Dispute</Button> : null}
                  {status.availableActions.canViewReceipt ? <Button onPress={() => onNavigate('receipt')}>View Receipt</Button> : null}
                </YStack>
              </PremiumCard>
              <PremiumCard p="$4">
                <YStack gap="$3">
                  <Text fontSize="$6" fontWeight="900">Requested evidence</Text>
                  {evidence.length > 0 ? (<EvidenceFlashList data={evidence} estimatedItemSize={92} keyExtractor={(item) => item.evidenceId} renderItem={({ item, index }) => <EvidenceCard evidence={item} index={index}/>}/>) : (<Paragraph color="$gray10">{status.statusSummary.requiresBuyerEvidence ? 'Upload the requested evidence to continue review.' : 'No additional evidence requested right now.'}</Paragraph>)}
                </YStack>
              </PremiumCard>
            </YStack>
          </XStack>
        </YStack>
      {message ? <Toast message={message} onClose={() => setMessage('')}/> : null}
    </InteriorShell>);
}
function StatusSummaryCard({ status }) {
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
    return (<Animated.View style={style}>
      <PremiumCard p="$5">
        <YStack gap="$4">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$3">
            <YStack gap="$1">
              <Text color="$blue10" fontWeight="900">Current status</Text>
              <Text fontSize="$7" fontWeight="900">{status.statusSummary.statusLabel}</Text>
              <Paragraph>{status.statusSummary.nextStepMessage}</Paragraph>
            </YStack>
            <StatusPill label={status.statusSummary.statusLabel} tone={statusTone(status.statusSummary.currentStatus)}/>
          </XStack>
          <XStack flexWrap="wrap" gap="$2">
            {status.statusSummary.requiresBuyerEvidence ? <StatusPill label="Buyer evidence requested" tone="warning"/> : null}
            {status.statusSummary.requiresSellerResponse ? <StatusPill label="Seller response required" tone="warning"/> : null}
            {status.statusSummary.requiresAdminReview ? <StatusPill label="Admin review" tone="warning"/> : null}
            <StatusPill label={`Updated ${formatDate(status.refundRequest.lastUpdatedAt)}`} tone="info"/>
          </XStack>
        </YStack>
      </PremiumCard>
    </Animated.View>);
}
function EstimatedRefundCard({ status }) {
    return (<PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Estimated refund</Text>
        <Text fontSize="$8" fontWeight="900">{formatMoney(status.estimatedRefund.amount)}</Text>
        <StatusPill label={status.estimatedRefund.isEstimated ? 'Estimated until approved' : 'Final amount'} tone={status.estimatedRefund.isEstimated ? 'warning' : 'success'}/>
        <Paragraph>{status.estimatedRefund.calculationSummary}</Paragraph>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={`Marketplace fee: ${status.estimatedRefund.marketplaceFeeRefundStatus}`} tone="info"/>
          {status.estimatedRefund.shippingRefundStatus ? <StatusPill label={`Shipping: ${status.estimatedRefund.shippingRefundStatus}`} tone="info"/> : null}
          <StatusPill label={`Tax: ${status.estimatedRefund.taxRefundStatus}`} tone="info"/>
        </XStack>
      </YStack>
    </PremiumCard>);
}
function ProductCard({ status }) {
    const request = status.refundRequest;
    return (<PremiumCard p="$4">
      <YStack gap="$3">
        <Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: request.productImageUrl }} style={{ borderRadius: 14, height: 150, width: '100%' }}/>
        <Text fontSize="$6" fontWeight="900">{request.productTitle}</Text>
        <Paragraph color="$gray10">{request.marketplaceName} - Seller: {request.sellerDisplayName}</Paragraph>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={request.reasonLabel} tone="info"/>
          <StatusPill label={`Submitted ${formatDate(request.submittedAt)}`} tone="info"/>
        </XStack>
      </YStack>
    </PremiumCard>);
}
function DigitalAccessCard({ status }) {
    const summary = status.digitalAccessSummary;
    return (<PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Digital access summary</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={`Code revealed: ${summary.codeRevealed ? 'Yes' : 'No'}`} tone={summary.codeRevealed ? 'warning' : 'success'}/>
          <StatusPill label={`Download started: ${summary.fileDownloaded ? 'Yes' : 'No'}`} tone={summary.fileDownloaded ? 'warning' : 'success'}/>
          <StatusPill label={`Location consent: ${summary.locationConsentAccepted ? 'Accepted' : 'Not used'}`} tone="info"/>
        </XStack>
        <Paragraph>{summary.reviewImpact}</Paragraph>
        <Paragraph color="$gray10">Actual digital code, raw download URL, exact location, IP, device ID, and risk score are not shown.</Paragraph>
      </YStack>
    </PremiumCard>);
}
function ReturnInstructionsCard({ status }) {
    const instructions = status.returnInstructions;
    return (<PremiumCard p="$4">
      <YStack gap="$3">
        <Text color="$blue10" fontWeight="900">Return instructions</Text>
        <XStack flexWrap="wrap" gap="$2">
          <StatusPill label={instructions.returnMethod} tone="info"/>
          <StatusPill label={instructions.returnLabelAvailable ? 'Return label available' : 'Return label pending'} tone={instructions.returnLabelAvailable ? 'success' : 'warning'}/>
          {instructions.returnTrackingStatus ? <StatusPill label={instructions.returnTrackingStatus} tone="info"/> : null}
        </XStack>
        <Paragraph>{instructions.instructions}</Paragraph>
        {instructions.returnDeadline ? <Text color="$gray10">Return deadline: {formatDate(instructions.returnDeadline)}</Text> : null}
      </YStack>
    </PremiumCard>);
}
function ResponseCards({ status }) {
    return (<XStack $sm={{ flexDirection: 'column' }} gap="$4">
      <PremiumCard flex={1} p="$4">
        <YStack gap="$2">
          <Text color="$blue10" fontWeight="900">Seller response</Text>
          <Text fontWeight="900">{status.sellerResponse?.responseAvailable ? status.sellerResponse.responseStatus : 'No seller response yet'}</Text>
          <Paragraph>{status.sellerResponse?.buyerSafeMessage ?? 'Seller private notes are not shown. Buyer-safe responses will appear here.'}</Paragraph>
          {status.sellerResponse?.respondedAt ? <Text color="$gray10">{formatDate(status.sellerResponse.respondedAt)}</Text> : null}
        </YStack>
      </PremiumCard>
      <PremiumCard flex={1} p="$4">
        <YStack gap="$2">
          <Text color="$blue10" fontWeight="900">Admin decision</Text>
          <Text fontWeight="900">{status.adminDecision?.decisionAvailable ? status.adminDecision.decisionStatus : 'No decision yet'}</Text>
          <Paragraph>{status.adminDecision?.buyerSafeReason ?? 'Admin private notes and internal risk details are not shown.'}</Paragraph>
          {status.adminDecision?.nextStep ? <Text color="$gray10">{status.adminDecision.nextStep}</Text> : null}
        </YStack>
      </PremiumCard>
    </XStack>);
}
const TimelineCard = memo(function TimelineCard({ event, index }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(10);
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
        <XStack ai="flex-start" gap="$3">
          <YStack ai="center" bg="$blue4" br="$10" h={40} jc="center" w={40}>
            <Ionicons color={colors.info} name="time-outline" size={20}/>
          </YStack>
          <YStack flex={1} gap="$1">
            <Text fontWeight="900">{event.title}</Text>
            <Text>{event.description}</Text>
            <Text color="$gray10" fontSize="$2">{formatDate(event.timestamp)}</Text>
          </YStack>
        </XStack>
      </PremiumCard>
    </Animated.View>);
});
const EvidenceCard = memo(function EvidenceCard({ evidence, index }) {
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
    return (<Animated.View style={style}>
      <YStack bg="$background" br="$5" borderColor="$borderColor" borderWidth={1} mb="$2" p="$3">
        <XStack ai="center" gap="$3">
          {evidence.previewUrl ? (<Image cachePolicy="memory-disk" contentFit="cover" placeholder={blurhash} source={{ uri: evidence.previewUrl }} style={{ borderRadius: 10, height: 52, width: 52 }}/>) : (<YStack ai="center" bg="$blue4" br="$4" h={52} jc="center" w={52}>
              <Ionicons color={colors.info} name="document-outline" size={22}/>
            </YStack>)}
          <YStack flex={1}>
            <Text fontWeight="900">{evidence.fileName}</Text>
            <Text color="$gray10">{evidence.fileType} - {Math.round(evidence.fileSize / 1000)} KB</Text>
          </YStack>
        </XStack>
      </YStack>
    </Animated.View>);
});
function SectionTitle({ title }) {
    return <Text fontSize="$6" fontWeight="900">{title}</Text>;
}
function CenteredState({ actionLabel, message, onAction }) {
    return (<YStack bg="$background" f={1}>
      <YStack ai="center" f={1} jc="center" p="$5">
        <PremiumCard maxWidth={560} p="$6" width="100%">
          <YStack ai="center" gap="$4">
            <Text fontSize="$6" fontWeight="900" ta="center">{message}</Text>
            {actionLabel && onAction ? <Button theme="purple" onPress={onAction}>{actionLabel}</Button> : null}
          </YStack>
        </PremiumCard>
      </YStack>
    </YStack>);
}
function Toast({ message, onClose }) {
    return (<YStack bottom={24} left={24} pos="absolute" right={24}>
      <PremiumCard p="$3">
        <XStack ai="center" jc="space-between" gap="$3">
          <Text flex={1}>{message}</Text>
          <Button size="$3" onPress={onClose}>Dismiss</Button>
        </XStack>
      </PremiumCard>
    </YStack>);
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
function statusTone(status) {
    if (['APPROVED', 'REFUNDED', 'RETURN_DELIVERED'].includes(status)) {
        return 'success';
    }
    if (['REJECTED', 'DISPUTE_OPENED'].includes(status)) {
        return 'error';
    }
    if (['SUBMITTED'].includes(status)) {
        return 'info';
    }
    return 'warning';
}
function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatMoney(value) {
    return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}
