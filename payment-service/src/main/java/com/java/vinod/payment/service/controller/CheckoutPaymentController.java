package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.CheckoutPaymentDtos;
import com.java.vinod.payment.service.service.ConsolidatedCheckoutPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal API for consolidated multi-seller checkout payments (one buyer charge, ledger-only allocations).
 *
 * <p>All routes live under {@code /internal/} and therefore require the internal service token.</p>
 */
@RestController
@RequestMapping("/internal/api/v1/payments/checkouts")
public class CheckoutPaymentController {
    private final ConsolidatedCheckoutPaymentService consolidatedCheckoutPaymentService;

    public CheckoutPaymentController(ConsolidatedCheckoutPaymentService consolidatedCheckoutPaymentService) {
        this.consolidatedCheckoutPaymentService = consolidatedCheckoutPaymentService;
    }

    /**
     * Captures one buyer charge and persists the allocation ledger; identical retries replay the result.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutPaymentDtos.CheckoutPaymentResponse create(@Valid @RequestBody CheckoutPaymentDtos.CreateCheckoutPaymentRequest request) {
        return consolidatedCheckoutPaymentService.createCheckoutPayment(request);
    }

    /**
     * Returns the aggregate charge and allocation ledger state.
     */
    @GetMapping("/{checkoutPublicId}")
    public CheckoutPaymentDtos.CheckoutPaymentResponse get(@PathVariable String checkoutPublicId) {
        return consolidatedCheckoutPaymentService.checkoutPayment(checkoutPublicId);
    }

    /**
     * Marks one allocation eligible in the ledger only; never releases a provider payout.
     */
    @PostMapping("/{checkoutPublicId}/allocations/{marketplaceOrderPublicId}/mark-payout-eligible")
    public CheckoutPaymentDtos.CheckoutAllocationResponse markPayoutEligible(@PathVariable String checkoutPublicId,
                                                                            @PathVariable String marketplaceOrderPublicId) {
        return consolidatedCheckoutPaymentService.markAllocationPayoutEligible(checkoutPublicId, marketplaceOrderPublicId);
    }

    /**
     * Places a persisted dispute hold on one allocation.
     */
    @PostMapping("/{checkoutPublicId}/allocations/{marketplaceOrderPublicId}/dispute-request")
    public CheckoutPaymentDtos.CheckoutAllocationResponse dispute(@PathVariable String checkoutPublicId,
                                                                 @PathVariable String marketplaceOrderPublicId,
                                                                 @Valid @RequestBody(required = false) CheckoutPaymentDtos.AllocationDisputeRequest request) {
        return consolidatedCheckoutPaymentService.disputeAllocation(checkoutPublicId, marketplaceOrderPublicId, request);
    }

    /**
     * Partial (allocation) refunds are not supported; rejected before any mutation.
     */
    @PostMapping("/{checkoutPublicId}/allocations/{marketplaceOrderPublicId}/refund-request")
    public void refundAllocation(@PathVariable String checkoutPublicId, @PathVariable String marketplaceOrderPublicId) {
        consolidatedCheckoutPaymentService.rejectUnsupportedReversal(checkoutPublicId, marketplaceOrderPublicId, "refund");
    }

    /**
     * Partial (allocation) cancellations are not supported; rejected before any mutation.
     */
    @PostMapping("/{checkoutPublicId}/allocations/{marketplaceOrderPublicId}/cancel-request")
    public void cancelAllocation(@PathVariable String checkoutPublicId, @PathVariable String marketplaceOrderPublicId) {
        consolidatedCheckoutPaymentService.rejectUnsupportedReversal(checkoutPublicId, marketplaceOrderPublicId, "cancellation");
    }

    /**
     * Whole-checkout refunds are not supported yet; rejected before any mutation.
     */
    @PostMapping("/{checkoutPublicId}/refund-request")
    public void refundCheckout(@PathVariable String checkoutPublicId) {
        consolidatedCheckoutPaymentService.rejectUnsupportedReversal(checkoutPublicId, null, "refund");
    }

    /**
     * Whole-checkout cancellations are not supported yet; rejected before any mutation.
     */
    @PostMapping("/{checkoutPublicId}/cancel-request")
    public void cancelCheckout(@PathVariable String checkoutPublicId) {
        consolidatedCheckoutPaymentService.rejectUnsupportedReversal(checkoutPublicId, null, "cancellation");
    }
}