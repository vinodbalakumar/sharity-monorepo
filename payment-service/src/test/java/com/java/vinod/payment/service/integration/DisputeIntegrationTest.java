package com.java.vinod.payment.service.integration;

import com.java.vinod.payment.service.dto.DisputeDtos;
import com.java.vinod.payment.service.repository.DisputeRepository;
import com.java.vinod.payment.service.service.DisputeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for dispute management workflows.
 * Tests: Create dispute → Upload evidence → Submit → Review → Resolve
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Dispute Management Integration Tests")
public class DisputeIntegrationTest {

    @Autowired
    private DisputeService disputeService;

    @Autowired
    private DisputeRepository disputeRepository;

    @Test
    @DisplayName("Should create dispute and set 14-day SLA deadline")
    public void testCreateDispute_WithSlaDeadline() {
        // Arrange
        DisputeDtos.CreateDisputeRequest request = new DisputeDtos.CreateDisputeRequest(
            "order-123",
            "Item not as described",
            "Received wrong product",
            BigDecimal.valueOf(99.99)
        );

        // Act
        DisputeDtos.DisputeResponse response = disputeService.createDispute("customer-123", request);

        // Assert
        assertNotNull(response);
        assertNotNull(response.disputeId());
        assertEquals("OPENED", response.disputeStatus());

        // Verify SLA was set
        var dispute = disputeRepository.findByDisputeId(response.disputeId()).orElseThrow();
        assertNotNull(dispute.getSlaDeadline());
        assertEquals("OPEN", dispute.getSlaStatus());
        assertFalse(dispute.getEscalated());
    }

    @Test
    @DisplayName("Should upload evidence to dispute")
    public void testUploadEvidence() {
        // Arrange
        DisputeDtos.CreateDisputeRequest createRequest = new DisputeDtos.CreateDisputeRequest(
            "order-456",
            "Defective item",
            "Product broke after 1 day",
            BigDecimal.valueOf(149.99)
        );

        DisputeDtos.DisputeResponse dispute = disputeService.createDispute("customer-456", createRequest);

        DisputeDtos.UploadEvidenceRequest evidenceRequest = new DisputeDtos.UploadEvidenceRequest(
            "SCREENSHOT",
            "https://r2.cdn.example.com/dispute-456/screenshot.jpg",
            "Screenshot of broken product"
        );

        // Act
        DisputeDtos.DisputeEvidenceResponse response = disputeService.uploadEvidence(
            "customer-456", dispute.disputeId(), evidenceRequest);

        // Assert
        assertNotNull(response);
        assertNotNull(response.evidenceId());
        assertEquals("SCREENSHOT", response.evidenceType());
        assertEquals("https://r2.cdn.example.com/dispute-456/screenshot.jpg", response.fileUrl());
    }

    @Test
    @DisplayName("Should retrieve customer's disputes")
    public void testGetCustomerDisputes() {
        // Arrange
        DisputeDtos.CreateDisputeRequest request1 = new DisputeDtos.CreateDisputeRequest(
            "order-789",
            "Wrong item shipped",
            "Ordered blue, received red",
            BigDecimal.valueOf(49.99)
        );

        DisputeDtos.CreateDisputeRequest request2 = new DisputeDtos.CreateDisputeRequest(
            "order-012",
            "Never arrived",
            "Package not delivered",
            BigDecimal.valueOf(199.99)
        );

        disputeService.createDispute("customer-789", request1);
        disputeService.createDispute("customer-789", request2);

        // Act
        List<DisputeDtos.DisputeResponse> disputes = disputeService.getCustomerDisputes("customer-789");

        // Assert
        assertEquals(2, disputes.size());
        assertTrue(disputes.stream().allMatch(d -> "OPENED".equals(d.disputeStatus())));
    }

    @Test
    @DisplayName("Should resolve dispute and auto-refund on win")
    public void testResolveDispute_CustomerWins() {
        // Arrange
        DisputeDtos.CreateDisputeRequest createRequest = new DisputeDtos.CreateDisputeRequest(
            "order-345",
            "Unauthorized charge",
            "I did not authorize this payment",
            BigDecimal.valueOf(299.99)
        );

        DisputeDtos.DisputeResponse dispute = disputeService.createDispute("customer-345", createRequest);

        DisputeDtos.ResolveDisputeRequest resolveRequest = new DisputeDtos.ResolveDisputeRequest(
            "WON",
            BigDecimal.valueOf(299.99),
            "Customer proven right - full refund issued"
        );

        // Act
        DisputeDtos.DisputeResponse response = disputeService.resolveDispute(
            dispute.disputeId(), resolveRequest);

        // Assert
        assertNotNull(response);
        assertEquals("RESOLVED", response.disputeStatus());
        assertEquals("WON", response.resolutionStatus());
        assertEquals(BigDecimal.valueOf(299.99), response.refundedAmount());
    }

    @Test
    @DisplayName("Should retrieve open disputes for admin review")
    public void testGetOpenDisputes_ForAdminReview() {
        // Arrange
        for (int i = 0; i < 3; i++) {
            DisputeDtos.CreateDisputeRequest request = new DisputeDtos.CreateDisputeRequest(
                "admin-order-" + i,
                "Test dispute " + i,
                "Test description",
                BigDecimal.valueOf(100.00 + i)
            );
            disputeService.createDispute("admin-customer-" + i, request);
        }

        // Act
        List<DisputeDtos.DisputeResponse> openDisputes = disputeService.getOpenDisputes();

        // Assert
        assertTrue(openDisputes.size() >= 3);
        assertTrue(openDisputes.stream().allMatch(d ->
            "OPENED".equals(d.disputeStatus()) || "EVIDENCE_SUBMITTED".equals(d.disputeStatus())));
    }

    @Test
    @DisplayName("Should retrieve escalated disputes for priority review")
    public void testGetEscalatedDisputes_PriorityReview() {
        // Arrange - Create a dispute and manually mark it as escalated for testing
        DisputeDtos.CreateDisputeRequest request = new DisputeDtos.CreateDisputeRequest(
            "escalation-order",
            "SLA breach scenario",
            "Test escalation",
            BigDecimal.valueOf(500.00)
        );

        DisputeDtos.DisputeResponse dispute = disputeService.createDispute("escalation-customer", request);

        // Simulate escalation by manually updating (in production, scheduler would do this)
        var disputeEntity = disputeRepository.findByDisputeId(dispute.disputeId()).orElseThrow();
        disputeEntity.setEscalated(true);
        disputeEntity.setSlaStatus("BREACHED");
        disputeRepository.save(disputeEntity);

        // Act
        List<DisputeDtos.DisputeResponse> escalated = disputeService.getEscalatedDisputes();

        // Assert
        assertTrue(escalated.stream().anyMatch(d -> d.disputeId().equals(dispute.disputeId())));
    }

    @Test
    @DisplayName("Should handle complete dispute lifecycle with evidence and timeline")
    public void testCompleteDisputeLifecycle() {
        // Arrange - Create dispute
        DisputeDtos.CreateDisputeRequest createRequest = new DisputeDtos.CreateDisputeRequest(
            "lifecycle-order",
            "Complete workflow test",
            "Testing full dispute lifecycle",
            BigDecimal.valueOf(299.99)
        );

        DisputeDtos.DisputeResponse dispute = disputeService.createDispute("lifecycle-customer", createRequest);
        String disputeId = dispute.disputeId();

        // Upload evidence
        DisputeDtos.UploadEvidenceRequest evidence1 = new DisputeDtos.UploadEvidenceRequest(
            "SCREENSHOT",
            "https://cdn.example.com/screenshot.jpg",
            "Product defect screenshot"
        );

        DisputeDtos.UploadEvidenceRequest evidence2 = new DisputeDtos.UploadEvidenceRequest(
            "EMAIL",
            "https://cdn.example.com/email.txt",
            "Email communication with seller"
        );

        disputeService.uploadEvidence("lifecycle-customer", disputeId, evidence1);
        disputeService.uploadEvidence("lifecycle-customer", disputeId, evidence2);

        // Retrieve dispute with full timeline
        DisputeDtos.DisputeResponse updated = disputeService.getDispute("lifecycle-customer", disputeId);

        // Resolve dispute
        DisputeDtos.ResolveDisputeRequest resolveRequest = new DisputeDtos.ResolveDisputeRequest(
            "SETTLED",
            BigDecimal.valueOf(150.00),
            "Partial refund - customer accepted settlement"
        );

        DisputeDtos.DisputeResponse resolved = disputeService.resolveDispute(disputeId, resolveRequest);

        // Assert - Full lifecycle complete
        assertNotNull(updated);
        assertTrue(updated.evidenceCount() >= 2);
        assertTrue(updated.timeline().size() >= 3); // OPENED + 2 evidence uploads

        assertEquals("RESOLVED", resolved.disputeStatus());
        assertEquals("SETTLED", resolved.resolutionStatus());
        assertEquals(BigDecimal.valueOf(150.00), resolved.refundedAmount());
    }
}
