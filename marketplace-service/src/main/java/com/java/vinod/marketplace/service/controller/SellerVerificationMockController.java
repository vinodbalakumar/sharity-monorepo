package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SellerVerificationDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SellerVerificationMockController {
    @GetMapping("/api/seller/verification")
    public SellerVerificationDtos.SellerVerificationDashboardResponse dashboard() { return SellerVerificationDtos.dashboard(); }
    @GetMapping("/api/seller/verification/payout-eligibility")
    public SellerVerificationDtos.SellerPayoutEligibilityStatus payout() { return SellerVerificationDtos.dashboard().payoutEligibility(); }
    @GetMapping("/api/seller/verification/checklist")
    public List<SellerVerificationDtos.SellerVerificationChecklistItem> checklist() { return SellerVerificationDtos.checklist(); }
    @GetMapping("/api/seller/verification/marketplace-eligibility")
    public List<SellerVerificationDtos.SellerMarketplaceEligibilityItem> marketplace() { return SellerVerificationDtos.marketplace(); }
    @GetMapping("/api/seller/verification/limits")
    public List<SellerVerificationDtos.SellerAccountLimitItem> limits() { return SellerVerificationDtos.limits(); }
    @PostMapping("/api/seller/verification/paypal/connect")
    public String paypal() { return "PayPal payout setup started."; }
    @GetMapping("/api/seller/verification/documents/requirements")
    public List<SellerVerificationDtos.SellerDocumentRequirement> documents() { return SellerVerificationDtos.documents(); }
    @PostMapping("/api/seller/verification/documents")
    public SellerVerificationDtos.SellerDocumentUploadResponse upload(@RequestBody(required = false) Object request) { return new SellerVerificationDtos.SellerDocumentUploadResponse("seller-doc-001", "IDENTITY_DOCUMENT", "UPLOADED", "PENDING_REVIEW", "Document uploaded securely."); }
    @PostMapping("/api/seller/verification/admin-review/request")
    public String review() { return "Admin review requested."; }
    @GetMapping("/api/seller/verification/timeline")
    public List<SellerVerificationDtos.SellerVerificationTimelineEvent> timeline() { return SellerVerificationDtos.dashboard().timeline(); }
    @GetMapping("/api/seller/verification/badges")
    public List<SellerVerificationDtos.SellerBadgePreviewItem> badges() { return SellerVerificationDtos.dashboard().sellerBadges(); }
    @GetMapping("/api/admin/sellers/{sellerId}/verification")
    public SellerVerificationDtos.SellerVerificationDashboardResponse admin(@PathVariable String sellerId) { return SellerVerificationDtos.dashboard(); }
    @PostMapping("/api/admin/sellers/{sellerId}/verification/approve")
    public String approve(@PathVariable String sellerId) { return "Approved " + sellerId; }
    @PostMapping("/api/admin/sellers/{sellerId}/verification/reject")
    public String reject(@PathVariable String sellerId) { return "Rejected " + sellerId; }
    @PostMapping("/api/admin/sellers/{sellerId}/verification/request-more-info")
    public String moreInfo(@PathVariable String sellerId) { return "More info requested for " + sellerId; }
}
