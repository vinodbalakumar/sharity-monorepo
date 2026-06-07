package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.PricingPromotionsDtos;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PricingPromotionsMockController {
    @GetMapping("/api/admin/pricing/rules")
    public List<PricingPromotionsDtos.PricingRule> rules() { return PricingPromotionsDtos.rules(); }
    @PostMapping("/api/admin/pricing/rules")
    public PricingPromotionsDtos.PricingRule createRule(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.rules().get(0); }
    @PatchMapping("/api/admin/pricing/rules/{ruleId}")
    public PricingPromotionsDtos.PricingRule updateRule(@PathVariable String ruleId, @RequestBody(required = false) Object request) { return PricingPromotionsDtos.rules().get(0); }
    @PostMapping("/api/admin/pricing/rules/{ruleId}/disable")
    public PricingPromotionsDtos.PricingRule disableRule(@PathVariable String ruleId) { return PricingPromotionsDtos.rules().get(0); }
    @GetMapping("/api/admin/pricing/coupons")
    public List<PricingPromotionsDtos.CouponRule> coupons() { return PricingPromotionsDtos.coupons(); }
    @PostMapping("/api/admin/pricing/coupons")
    public PricingPromotionsDtos.CouponRule createCoupon(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.coupons().get(0); }
    @PatchMapping("/api/admin/pricing/coupons/{couponId}")
    public PricingPromotionsDtos.CouponRule updateCoupon(@PathVariable String couponId, @RequestBody(required = false) Object request) { return PricingPromotionsDtos.coupons().get(0); }
    @PostMapping("/api/admin/pricing/coupons/{couponId}/disable")
    public PricingPromotionsDtos.CouponRule disableCoupon(@PathVariable String couponId) { return PricingPromotionsDtos.coupons().get(0); }
    @GetMapping("/api/admin/pricing/fee-waivers")
    public List<PricingPromotionsDtos.FeeWaiverSellerRule> feeWaivers() { return PricingPromotionsDtos.waivers(); }
    @PostMapping("/api/admin/pricing/fee-waivers")
    public PricingPromotionsDtos.FeeWaiverSellerRule createWaiver(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.waivers().get(0); }
    @DeleteMapping("/api/admin/pricing/fee-waivers/{feeWaiverId}")
    public PricingPromotionsDtos.FeeWaiverSellerRule deleteWaiver(@PathVariable String feeWaiverId) { return PricingPromotionsDtos.waivers().get(0); }
    @GetMapping("/api/admin/pricing/free-product-rules")
    public List<PricingPromotionsDtos.FreeProductRule> freeProductRules() { return PricingPromotionsDtos.freeRules(); }
    @PostMapping("/api/admin/pricing/free-product-rules")
    public PricingPromotionsDtos.FreeProductRule createFreeRule(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.freeRules().get(0); }
    @PatchMapping("/api/admin/pricing/free-product-rules/{ruleId}")
    public PricingPromotionsDtos.FreeProductRule updateFreeRule(@PathVariable String ruleId, @RequestBody(required = false) Object request) { return PricingPromotionsDtos.freeRules().get(0); }
    @PostMapping("/api/admin/pricing/simulate")
    public PricingPromotionsDtos.PricingSimulationResponse simulate(@RequestBody(required = false) PricingPromotionsDtos.PricingSimulationRequest request) { return PricingPromotionsDtos.simulation(); }
    @GetMapping("/api/admin/pricing/conflicts")
    public List<String> conflicts() { return List.of("Fee waiver and promotional commission overlap"); }
    @PostMapping("/api/admin/pricing/conflicts/{conflictId}/resolve")
    public String resolveConflict(@PathVariable String conflictId) { return "Resolved " + conflictId; }
    @GetMapping("/api/admin/pricing/audit-log")
    public List<PricingPromotionsDtos.PricingAuditLogItem> audit() { return PricingPromotionsDtos.audit(); }
    @GetMapping("/api/seller/pricing/summary")
    public PricingPromotionsDtos.SellerPricingDisplay sellerSummary() { return PricingPromotionsDtos.simulation().sellerDisplay(); }
    @GetMapping("/api/seller/pricing/coupons")
    public List<PricingPromotionsDtos.CouponRule> sellerCoupons() { return PricingPromotionsDtos.coupons(); }
    @PostMapping("/api/seller/pricing/coupons")
    public PricingPromotionsDtos.CouponRule createSellerCoupon(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.coupons().get(0); }
    @PostMapping("/api/seller/pricing/coupons/{couponId}/disable")
    public PricingPromotionsDtos.CouponRule disableSellerCoupon(@PathVariable String couponId) { return PricingPromotionsDtos.coupons().get(0); }
    @PostMapping("/api/seller/pricing/simulate-receives")
    public PricingPromotionsDtos.SellerPricingDisplay simulateReceives(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.simulation().sellerDisplay(); }
    @PostMapping("/api/pricing/coupons/validate")
    public PricingPromotionsDtos.CouponRule validateCoupon(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.coupons().get(0); }
    @PostMapping("/api/pricing/checkout/calculate")
    public PricingPromotionsDtos.PricingSimulationResponse calculate(@RequestBody(required = false) Object request) { return PricingPromotionsDtos.simulation(); }
    @GetMapping("/api/pricing/checkout/{checkoutSessionId}/buyer-display")
    public PricingPromotionsDtos.BuyerPricingDisplay buyerDisplay(@PathVariable String checkoutSessionId) { return PricingPromotionsDtos.simulation().buyerDisplay(); }
    @GetMapping("/api/seller/orders/{sellerOrderId}/pricing-snapshot")
    public PricingPromotionsDtos.PricingSnapshot snapshot(@PathVariable String sellerOrderId) { return PricingPromotionsDtos.simulation().pricingSnapshotPreview(); }
}
