package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.dto.DisputeDtos;
import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.*;
import com.java.vinod.payment.service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Dispute management service.
 *
 * Handles:
 * - Dispute creation and validation
 * - Evidence management
 * - Resolution workflow
 * - Auto-refund on dispute win
 * - Timeline tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {
    private final DisputeRepository disputeRepository;
    private final DisputeEvidenceRepository evidenceRepository;
    private final DisputeEventRepository eventRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    /**
     * Create new dispute for an order.
     */
    @Transactional
    public DisputeDtos.DisputeResponse createDispute(String customerId, DisputeDtos.CreateDisputeRequest request) {
        // Validate order exists and belongs to customer
        // (In real app, would query marketplace-service)

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slaDeadline = now.plusDays(14); // 14-day SLA

        Dispute dispute = Dispute.builder()
            .disputeId(UUID.randomUUID().toString())
            .customerId(customerId)
            .orderId(request.getOrderId())
            .disputeReason(request.getDisputeReason())
            .disputeDescription(request.getDisputeDescription())
            .claimedAmount(request.getClaimedAmount())
            .disputeStatus("OPENED")
            .slaStatus("OPEN")
            .slaDeadline(slaDeadline)
            .escalated(false)
            .currencyCode("USD")
            .build();

        Dispute saved = disputeRepository.save(dispute);

        // Record timeline event
        recordEvent(saved, "OPENED", "Dispute opened by customer", "CUSTOMER", "BOTH");

        log.info("Dispute created: {} for order: {} by customer: {}",
            saved.getDisputeId(), request.getOrderId(), customerId);

        // Notify customer
        notificationService.sendDisputeNotification(customerId, "customer@example.com", saved.getDisputeId());

        return mapToResponse(saved);
    }

    /**
     * Upload evidence for dispute.
     */
    @Transactional
    public DisputeDtos.DisputeEvidenceResponse uploadEvidence(String customerId, String disputeId,
                                                             DisputeDtos.UploadEvidenceRequest request) {
        Dispute dispute = disputeRepository.findByDisputeId(disputeId)
            .orElseThrow(() -> new RuntimeException("Dispute not found: " + disputeId));

        if (!dispute.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: dispute belongs to different customer");
        }

        if (!dispute.getDisputeStatus().equals("OPENED") && !dispute.getDisputeStatus().equals("EVIDENCE_SUBMITTED")) {
            throw new RuntimeException("Cannot add evidence to dispute in status: " + dispute.getDisputeStatus());
        }

        // Validate file (in real app, validate via R2/CDN)
        if (request.getFileSize() != null && request.getFileSize() > 25 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds 25MB limit");
        }

        DisputeEvidence evidence = DisputeEvidence.builder()
            .evidenceId(UUID.randomUUID().toString())
            .dispute(dispute)
            .evidenceType(request.getEvidenceType())
            .fileUrl(request.getFileUrl())
            .fileName(request.getFileName())
            .fileSize(request.getFileSize())
            .description(request.getDescription())
            .uploadedBy("CUSTOMER")
            .build();

        DisputeEvidence saved = evidenceRepository.save(evidence);

        // Update dispute
        dispute.setEvidenceCount(dispute.getEvidenceCount() + 1);
        dispute.setDisputeStatus("EVIDENCE_SUBMITTED");
        disputeRepository.save(dispute);

        // Record event
        recordEvent(dispute, "EVIDENCE_ADDED",
            "Customer uploaded evidence: " + request.getEvidenceType(), "CUSTOMER", "BOTH");

        log.info("Evidence uploaded for dispute {}: {}", disputeId, evidence.getEvidenceId());

        return mapToEvidenceResponse(saved);
    }

    /**
     * Resolve dispute (auto-resolve based on evidence quality or manual admin action).
     */
    @Transactional
    public DisputeDtos.DisputeResponse resolveDispute(String disputeId,
                                                      DisputeDtos.ResolveDisputeRequest request) {
        Dispute dispute = disputeRepository.findByDisputeId(disputeId)
            .orElseThrow(() -> new RuntimeException("Dispute not found: " + disputeId));

        dispute.setResolutionStatus(request.getResolutionStatus());
        dispute.setDisputeStatus("RESOLVED");
        dispute.setResolvedAt(LocalDateTime.now());
        dispute.setNotes(request.getNotes());

        // Handle refund if dispute won
        String resolutionStatus = request.getResolutionStatus();
        boolean refundRequested = "WON".equalsIgnoreCase(resolutionStatus)
            || ("SETTLED".equalsIgnoreCase(resolutionStatus)
            && request.getRefundAmount() != null
            && request.getRefundAmount().compareTo(BigDecimal.ZERO) > 0);

        if (refundRequested) {
            BigDecimal refundAmount = request.getRefundAmount() != null ?
                request.getRefundAmount() : dispute.getClaimedAmount();

            dispute.setRefundedAmount(refundAmount);

            String refundableOrderId = dispute.getPaymentId() != null && !dispute.getPaymentId().isBlank()
                ? dispute.getPaymentId()
                : dispute.getOrderId();

            if (paymentOrderRepository.findByMarketplaceOrderPublicId(refundableOrderId).isPresent()) {
                try {
                    PaymentDtos.RefundRequest refundRequest = new PaymentDtos.RefundRequest("Dispute resolved in customer favor");
                    paymentService.refund(refundableOrderId, refundRequest, null);
                    recordEvent(dispute, "REFUNDED",
                        "Dispute won - Refund issued", "SYSTEM", "BOTH");
                } catch (Exception e) {
                    log.error("Refund failed for disputed order: {}", dispute.getOrderId(), e);
                    recordEvent(dispute, "REFUND_FAILED",
                        "Refund processing failed: " + e.getMessage(), "SYSTEM", "ADMIN_ONLY");
                }
            } else {
                log.warn("Refund skipped for dispute {} because payment order {} was not found",
                    dispute.getDisputeId(), refundableOrderId);
                recordEvent(dispute, "REFUND_FAILED",
                    "Refund processing failed: payment order not found", "SYSTEM", "ADMIN_ONLY");
            }
        }

        Dispute saved = disputeRepository.save(dispute);

        // Record resolution event
        recordEvent(saved, "RESOLVED",
            "Dispute resolved - Status: " + request.getResolutionStatus(), "SYSTEM", "BOTH");

        log.info("Dispute resolved: {} - Status: {}", disputeId, request.getResolutionStatus());

        // Notify customer
        notificationService.notifyCustomer(
            dispute.getCustomerId(),
            "customer@example.com",
            NotificationService.NotificationType.DISPUTE_RESOLVED,
            null
        );

        return mapToResponse(saved);
    }

    /**
     * Get dispute details with full timeline and evidence.
     */
    public DisputeDtos.DisputeResponse getDispute(String customerId, String disputeId) {
        Dispute dispute = disputeRepository.findByDisputeId(disputeId)
            .orElseThrow(() -> new RuntimeException("Dispute not found: " + disputeId));

        if (!dispute.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: dispute belongs to different customer");
        }

        return mapToResponse(dispute);
    }

    /**
     * Get all disputes for customer.
     */
    public List<DisputeDtos.DisputeResponse> getCustomerDisputes(String customerId) {
        return disputeRepository.findByCustomerId(customerId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get open disputes for admin review.
     */
    public List<DisputeDtos.DisputeResponse> getOpenDisputes() {
        return disputeRepository.findOpenDisputes().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Record timeline event.
     */
    private void recordEvent(Dispute dispute, String eventType, String description,
                           String actor, String visibility) {
        DisputeEvent event = DisputeEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .dispute(dispute)
            .eventType(eventType)
            .eventDescription(description)
            .actor(actor)
            .visibility(visibility)
            .build();

        eventRepository.save(event);
    }

    /**
     * Map entity to response DTO.
     */
    private DisputeDtos.DisputeResponse mapToResponse(Dispute dispute) {
        List<DisputeEvent> events = eventRepository.findByDisputeIdOrderByCreatedAtDesc(dispute.getId());
        List<DisputeEvidence> evidence = evidenceRepository.findByDisputeId(dispute.getId());

        return DisputeDtos.DisputeResponse.builder()
            .disputeId(dispute.getDisputeId())
            .orderId(dispute.getOrderId())
            .disputeStatus(dispute.getDisputeStatus())
            .resolutionStatus(dispute.getResolutionStatus())
            .claimedAmount(dispute.getClaimedAmount())
            .refundedAmount(dispute.getRefundedAmount())
            .evidenceCount(dispute.getEvidenceCount())
            .createdAt(dispute.getCreatedAt())
            .resolvedAt(dispute.getResolvedAt())
            .timeline(events.stream()
                .map(e -> DisputeDtos.DisputeEventResponse.builder()
                    .eventId(e.getEventId())
                    .eventType(e.getEventType())
                    .eventDescription(e.getEventDescription())
                    .actor(e.getActor())
                    .createdAt(e.getCreatedAt())
                    .build())
                .collect(Collectors.toList()))
            .evidence(evidence.stream()
                .map(this::mapToEvidenceResponse)
                .collect(Collectors.toList()))
            .build();
    }

    private DisputeDtos.DisputeEvidenceResponse mapToEvidenceResponse(DisputeEvidence evidence) {
        return DisputeDtos.DisputeEvidenceResponse.builder()
            .evidenceId(evidence.getEvidenceId())
            .evidenceType(evidence.getEvidenceType())
            .fileUrl(evidence.getFileUrl())
            .description(evidence.getDescription())
            .uploadedBy(evidence.getUploadedBy())
            .uploadedAt(evidence.getUploadedAt())
            .build();
    }

    /**
     * Check SLA status and escalate if breached.
     * Scheduled to run daily to identify disputes exceeding SLA deadline.
     */
    @Transactional
    public void checkAndEscalateSlaBreaches() {
        LocalDateTime now = LocalDateTime.now();
        List<Dispute> openDisputes = disputeRepository.findByDisputeStatusNotIn(
            List.of("RESOLVED", "CLOSED"));

        for (Dispute dispute : openDisputes) {
            if (dispute.getSlaDeadline() == null) continue;

            // Check if SLA is breached
            if (now.isAfter(dispute.getSlaDeadline())) {
                handleSlaBreached(dispute);
            }
            // Check if warning needed (3 days left)
            else if (now.isAfter(dispute.getSlaDeadline().minusDays(3))) {
                if (!"WARNING".equals(dispute.getSlaStatus())) {
                    dispute.setSlaStatus("WARNING");
                    disputeRepository.save(dispute);
                    recordEvent(dispute, "SLA_WARNING",
                        "Dispute approaching SLA deadline (3 days remaining)",
                        "SYSTEM", "ADMIN_ONLY");
                    log.warn("SLA warning for dispute: {}", dispute.getDisputeId());
                }
            }
        }
    }

    /**
     * Handle SLA breach for a dispute - auto-escalate to priority queue.
     */
    private void handleSlaBreached(Dispute dispute) {
        if (!dispute.getEscalated()) {
            dispute.setSlaStatus("BREACHED");
            dispute.setEscalated(true);
            dispute.setEscalatedAt(LocalDateTime.now());
            disputeRepository.save(dispute);

            recordEvent(dispute, "SLA_BREACHED",
                "Dispute exceeded 14-day SLA - Auto-escalated to priority review",
                "SYSTEM", "BOTH");

            log.warn("SLA BREACHED for dispute: {} - Admin review required", dispute.getDisputeId());
            // Admin notification would be sent via admin dashboard
            // Escalated disputes available at: GET /api/v1/admin/disputes/escalated
        }
    }

    /**
     * Get escalated disputes for priority admin review.
     */
    public List<DisputeDtos.DisputeResponse> getEscalatedDisputes() {
        return disputeRepository.findByEscalatedOrderByEscalatedAtAsc(true).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
}
