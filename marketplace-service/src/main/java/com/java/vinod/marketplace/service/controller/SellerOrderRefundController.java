package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SellerOrderRefundDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class SellerOrderRefundController {
    @GetMapping("/api/orders/{parentOrderId}/refund-summary")
    public SellerOrderRefundDtos.ParentOrderRefundSummaryResponse summary(@PathVariable String parentOrderId) { return SellerOrderRefundDtos.summary(); }
    @GetMapping("/api/orders/{parentOrderId}/seller-orders/{sellerOrderId}/refund-eligibility")
    public SellerOrderRefundDtos.SellerOrderRefundSummary sellerOrderEligibility(@PathVariable String parentOrderId, @PathVariable String sellerOrderId) {
        return SellerOrderRefundDtos.summary().sellerOrderRefundSummaries().get(0);
    }
    @GetMapping("/api/orders/{parentOrderId}/seller-orders/{sellerOrderId}/items/{sellerOrderItemId}/refund-eligibility")
    public SellerOrderRefundDtos.SellerOrderItemRefundEligibility itemEligibility(@PathVariable String parentOrderId, @PathVariable String sellerOrderId, @PathVariable String sellerOrderItemId) {
        return SellerOrderRefundDtos.summary().sellerOrderRefundSummaries().get(0).items().get(0);
    }
    @GetMapping("/api/refunds/reasons")
    public List<SellerOrderRefundDtos.RefundReasonOption> reasons() { return SellerOrderRefundDtos.reasons(); }
    @PostMapping("/api/refunds/estimate")
    public SellerOrderRefundDtos.RefundEstimateResponse estimate(@RequestBody(required = false) SellerOrderRefundDtos.RefundEstimateRequest request) { return SellerOrderRefundDtos.estimate(); }
    @PostMapping("/api/refunds/evidence")
    public SellerOrderRefundDtos.RefundEvidenceItem evidence(@RequestBody(required = false) Object request) { return SellerOrderRefundDtos.evidence(); }
    @PostMapping("/api/refunds")
    public SellerOrderRefundDtos.SubmitRefundResponse submit(@RequestBody(required = false) SellerOrderRefundDtos.SubmitRefundRequest request) { return SellerOrderRefundDtos.submit(); }
    @GetMapping("/api/refunds/{refundRequestId}")
    public SellerOrderRefundDtos.SubmitRefundResponse refund(@PathVariable String refundRequestId) { return SellerOrderRefundDtos.submit(); }
    @GetMapping("/api/refunds/{refundRequestId}/timeline")
    public List<SellerOrderRefundDtos.RefundTimelineEvent> timeline(@PathVariable String refundRequestId) { return SellerOrderRefundDtos.timeline(); }
    @PostMapping("/api/refunds/{refundRequestId}/cancel")
    public SellerOrderRefundDtos.RefundTimelineEvent cancel(@PathVariable String refundRequestId, @RequestBody(required = false) SellerOrderRefundDtos.CancelRefundRequest request) {
        return new SellerOrderRefundDtos.RefundTimelineEvent("timeline-cancel", refundRequestId, "BUYER_CANCELLED",
                "BUYER", "Refund cancelled", "Buyer cancellation recorded when backend rules allow it.",
                java.time.LocalDateTime.now(), "CANCELLED", true);
    }
    @PostMapping("/api/refunds/{refundRequestId}/escalate")
    public SellerOrderRefundDtos.RefundTimelineEvent escalate(@PathVariable String refundRequestId, @RequestBody(required = false) SellerOrderRefundDtos.EscalateRefundRequest request) {
        return new SellerOrderRefundDtos.RefundTimelineEvent("timeline-escalate", refundRequestId, "SHARITY_REVIEW_STARTED",
                "SHARITY", "Sharity Review started", "Escalation accepted for review.",
                java.time.LocalDateTime.now(), "IN_REVIEW", true);
    }
    @GetMapping("/api/refunds/{refundRequestId}/breakdown")
    public SellerOrderRefundDtos.RefundBreakdown breakdown(@PathVariable String refundRequestId) { return SellerOrderRefundDtos.breakdown(); }
}
