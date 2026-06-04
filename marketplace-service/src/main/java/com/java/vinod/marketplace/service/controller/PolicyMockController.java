package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.PolicyDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PolicyMockController {
    @GetMapping("/api/policies")
    public PolicyDtos.PoliciesDashboardResponse dashboard() { return PolicyDtos.dashboard(); }
    @GetMapping("/api/policies/required")
    public List<PolicyDtos.PolicySummaryItem> required() { return PolicyDtos.dashboard().requiredPolicies(); }
    @GetMapping("/api/policies/{policyId}")
    public PolicyDtos.PolicyDetailResponse detail(@PathVariable String policyId) { return PolicyDtos.detail(policyId); }
    @GetMapping("/api/policies/{policyId}/changes")
    public PolicyDtos.PolicyChangesResponse changes(@PathVariable String policyId) { return PolicyDtos.changes(policyId); }
    @PostMapping("/api/policies/{policyId}/accept")
    public PolicyDtos.PolicyAcceptanceResponse accept(@PathVariable String policyId, @RequestBody(required = false) PolicyDtos.PolicyAcceptanceRequest request) { return PolicyDtos.accepted(policyId, request == null ? "v1.0" : request.policyVersion()); }
    @PostMapping("/api/policies/accept-required")
    public PolicyDtos.AcceptAllRequiredPoliciesResponse acceptRequired(@RequestBody(required = false) PolicyDtos.AcceptAllRequiredPoliciesRequest request) { return new PolicyDtos.AcceptAllRequiredPoliciesResponse(List.of(PolicyDtos.accepted("policy-seller-terms", "v3.0")), List.of(), true, "All eligible required policies accepted."); }
    @GetMapping("/api/policies/acceptance-history")
    public List<PolicyDtos.PolicyAcceptanceHistoryItem> history() { return PolicyDtos.history(); }
    @GetMapping("/api/policies/{policyId}/download")
    public String download(@PathVariable String policyId) { return "/api/policies/" + policyId + "/download/mock-copy"; }
    @GetMapping("/api/policies/blocking-status")
    public PolicyDtos.PolicyBlockingSummary blocking() { return PolicyDtos.blocking(); }
    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/policies/accept-digital-terms")
    public PolicyDtos.DigitalCheckoutTermsAcceptanceResponse digital(@PathVariable String checkoutSessionId, @RequestBody(required = false) PolicyDtos.DigitalCheckoutTermsAcceptanceRequest request) { return new PolicyDtos.DigitalCheckoutTermsAcceptanceResponse(checkoutSessionId, true, java.time.LocalDateTime.now(), "terms-snapshot-001", true, "Digital checkout terms accepted."); }
    @GetMapping("/api/admin/policies/versions")
    public List<PolicyDtos.AdminPolicyVersionPreview> versions() { return PolicyDtos.dashboard().adminPreviewVersions(); }
    @GetMapping("/api/admin/policies/{policyId}/preview")
    public PolicyDtos.PolicyDetailResponse preview(@PathVariable String policyId) { return PolicyDtos.detail(policyId); }
    @GetMapping("/api/admin/policies/{policyId}/acceptance-audit")
    public List<PolicyDtos.PolicyAcceptanceHistoryItem> audit(@PathVariable String policyId) { return PolicyDtos.history(); }
}
