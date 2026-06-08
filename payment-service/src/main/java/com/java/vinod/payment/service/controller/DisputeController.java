package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.DisputeDtos;
import com.java.vinod.payment.service.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

/**
 * Dispute management REST endpoints.
 */
@RestController
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
public class DisputeController {
    private final DisputeService disputeService;

    /**
     * Create new dispute for an order.
     * POST /api/v1/disputes
     */
    @PostMapping
    public DisputeDtos.DisputeResponse createDispute(
        @Valid @RequestBody DisputeDtos.CreateDisputeRequest request,
        Principal principal) {
        String customerId = principal.getName();
        return disputeService.createDispute(customerId, request);
    }

    /**
     * Upload evidence for a dispute.
     * POST /api/v1/disputes/{disputeId}/evidence
     */
    @PostMapping("/{disputeId}/evidence")
    public DisputeDtos.DisputeEvidenceResponse uploadEvidence(
        @PathVariable String disputeId,
        @Valid @RequestBody DisputeDtos.UploadEvidenceRequest request,
        Principal principal) {
        String customerId = principal.getName();
        return disputeService.uploadEvidence(customerId, disputeId, request);
    }

    /**
     * Get dispute details.
     * GET /api/v1/disputes/{disputeId}
     */
    @GetMapping("/{disputeId}")
    public DisputeDtos.DisputeResponse getDispute(
        @PathVariable String disputeId,
        Principal principal) {
        String customerId = principal.getName();
        return disputeService.getDispute(customerId, disputeId);
    }

    /**
     * Get all disputes for customer.
     * GET /api/v1/disputes
     */
    @GetMapping
    public List<DisputeDtos.DisputeResponse> getMyDisputes(Principal principal) {
        String customerId = principal.getName();
        return disputeService.getCustomerDisputes(customerId);
    }

    /**
     * Resolve dispute (Admin only).
     * POST /api/v1/disputes/{disputeId}/resolve
     * Requires: ADMIN role
     */
    @PostMapping("/{disputeId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public DisputeDtos.DisputeResponse resolveDispute(
        @PathVariable String disputeId,
        @Valid @RequestBody DisputeDtos.ResolveDisputeRequest request) {
        return disputeService.resolveDispute(disputeId, request);
    }

    /**
     * Get open disputes for admin review.
     * GET /api/v1/admin/disputes/open
     * Requires: ADMIN role
     */
    @GetMapping("/admin/open")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisputeDtos.DisputeResponse> getOpenDisputes() {
        return disputeService.getOpenDisputes();
    }

    /**
     * Get escalated disputes for priority admin review.
     * GET /api/v1/admin/disputes/escalated
     * Requires: ADMIN role
     * Returns disputes that exceeded 14-day SLA deadline
     */
    @GetMapping("/admin/escalated")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisputeDtos.DisputeResponse> getEscalatedDisputes() {
        return disputeService.getEscalatedDisputes();
    }
}
