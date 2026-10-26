package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.aspect.CircuitBreakerProtected;
import com.java.vinod.payment.service.aspect.Retryable;
import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.entity.PaymentTransaction;
import com.java.vinod.payment.service.entity.PaymentWebhookEvent;
import com.java.vinod.payment.service.entity.ProviderPayout;
import com.java.vinod.payment.service.entity.RefundTransaction;
import com.java.vinod.payment.service.gateway.PaymentGatewayRegistry;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.repository.PaymentTransactionRepository;
import com.java.vinod.payment.service.repository.PaymentWebhookEventRepository;
import com.java.vinod.payment.service.repository.ProviderPayoutRepository;
import com.java.vinod.payment.service.repository.RefundTransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Owns payment orders, transactions, payout hold/release state, refunds, and webhook idempotency.
 */
@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProviderPayoutRepository providerPayoutRepository;
    private final RefundTransactionRepository refundTransactionRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final PaymentGatewayRegistry paymentGatewayRegistry;
    private final PaymentEventOutboxService paymentEventOutboxService;
    private final String gatewayMode;
    private final RestClient restClient;
    private final String authorizationProviderEligibilityUrl;
    private final String walletInternalUrl;
    private final String internalServiceToken;
    private final String stripeWebhookSecret;

    /**
     * Creates the payment service with repositories and downstream wallet configuration.
     */
    public PaymentService(PaymentOrderRepository paymentOrderRepository,
                          PaymentTransactionRepository paymentTransactionRepository,
                          ProviderPayoutRepository providerPayoutRepository,
                          RefundTransactionRepository refundTransactionRepository,
                          PaymentWebhookEventRepository paymentWebhookEventRepository,
                          PaymentEventOutboxService paymentEventOutboxService,
                          PaymentGatewayRegistry paymentGatewayRegistry,
                          @Value("${app.payment.gateway-mode:mock}") String gatewayMode,
                          @Value("${app.payment.stripe.webhook-secret:}") String stripeWebhookSecret,
                          @Value("${app.services.authorization-provider-eligibility-url}") String authorizationProviderEligibilityUrl,
                          @Value("${app.services.wallet-internal-url}") String walletInternalUrl,
                          @Value("${app.internal.service-token}") String internalServiceToken) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.providerPayoutRepository = providerPayoutRepository;
        this.refundTransactionRepository = refundTransactionRepository;
        this.paymentWebhookEventRepository = paymentWebhookEventRepository;
        this.paymentEventOutboxService = paymentEventOutboxService;
        this.paymentGatewayRegistry = paymentGatewayRegistry;
        this.gatewayMode = gatewayMode;
        this.stripeWebhookSecret = stripeWebhookSecret;
        this.restClient = RestClient.builder().build();
        this.authorizationProviderEligibilityUrl = authorizationProviderEligibilityUrl;
        this.walletInternalUrl = walletInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Creates a checkout payment order for the authenticated customer.
     */
    @Transactional
    public PaymentDtos.PaymentOrderResponse checkout(PaymentDtos.CheckoutRequest request, Jwt jwt) {
        String customer = userPublicId(jwt);
        if (request.customerUserPublicId() != null && !request.customerUserPublicId().isBlank()
                && !customer.equals(request.customerUserPublicId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer mismatch");
        return createPaymentOrder(request, customer);
    }

    /**
     * Creates a persisted mock payment order if one does not already exist.
     */
    @Transactional
    public PaymentDtos.PaymentOrderResponse createPaymentOrder(PaymentDtos.CheckoutRequest request, String fallbackCustomerPublicId) {
        return paymentOrderRepository.findByMarketplaceOrderPublicId(request.marketplaceOrderPublicId())
                .map(this::toOrderResponse)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    BigDecimal fee = request.amount().multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);
                    PaymentOrder order = new PaymentOrder();
                    order.setPublicId(UUID.randomUUID().toString());
                    order.setMarketplaceOrderPublicId(request.marketplaceOrderPublicId());
                    order.setCustomerUserPublicId(firstNonBlank(request.customerUserPublicId(), fallbackCustomerPublicId));
                    order.setProviderAccountPublicId(firstNonBlank(request.providerAccountPublicId(), "UNKNOWN_PROVIDER"));
                    order.setCurrencyCode(request.currencyCode());
                    order.setCustomerChargeAmount(request.amount());
                    order.setPlatformFeeAmount(fee);
                    order.setProviderPayableAmount(request.amount().subtract(fee));
                    String providerCountryCode = firstNonBlank(request.providerCountryCode(), "US");
                    String selectedGatewayMode = paymentGatewayRegistry.resolveGatewayMode(providerCountryCode);
                    order.setPaymentProvider(selectedGatewayMode);
                    order.setPaymentStatus("PENDING");
                    order.setPayoutEligibilityStatus("ON_HOLD");
                    order.setCreatedAt(now);
                    order.setUpdatedAt(now);
                    PaymentOrder saved = paymentOrderRepository.save(order);
                    saved.setProviderPaymentReference(paymentGatewayRegistry.capture(selectedGatewayMode, saved.getPublicId(), saved.getCustomerChargeAmount(), saved.getCurrencyCode()));
                    if (saved.getProviderPaymentReference() == null || saved.getProviderPaymentReference().isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment confirmation unavailable");
                    }
                    saved.setPaymentStatus("CAPTURED");
                    createCaptureTransaction(saved, now);
                    createHeldPayout(saved, now);
                    publishWalletEvent("payment-captured", saved, saved.getCustomerUserPublicId(), saved.getCustomerChargeAmount());
                    publishWalletEvent("provider-pending-earning", saved, saved.getProviderAccountPublicId(), saved.getProviderPayableAmount());
                    log.info("Payment order captured: paymentOrderPublicId={}, marketplaceOrderPublicId={}, providerAccountPublicId={}, amount={}, payoutStatus={}",
                            saved.getPublicId(), saved.getMarketplaceOrderPublicId(), saved.getProviderAccountPublicId(),
                            saved.getCustomerChargeAmount(), saved.getPayoutEligibilityStatus());
                    return toOrderResponse(saved);
                });
    }

    /**
     * Loads a payment order by marketplace order id.
     */
    @Transactional(readOnly = true)
    public PaymentDtos.PaymentOrderResponse order(String marketplaceOrderPublicId) {
        return toOrderResponse(findOrder(marketplaceOrderPublicId));
    }

    /**
     * Lists payment orders created by the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<PaymentDtos.PaymentOrderResponse> myTransactions(Jwt jwt) {
        return paymentOrderRepository.findByCustomerUserPublicIdOrderByCreatedAtDesc(userPublicId(jwt)).stream()
                .map(this::toOrderResponse)
                .toList();
    }

    /**
     * Lists payout records for a provider account.
     */
    @Transactional(readOnly = true)
    public List<PaymentDtos.PayoutResponse> providerPayouts(String providerPublicId) {
        return providerPayoutRepository.findByProviderAccountPublicIdOrderByCreatedAtDesc(providerPublicId).stream()
                .map(this::toPayoutResponse)
                .toList();
    }

    /**
     * Loads a provider payout by public id.
     */
    @Transactional(readOnly = true)
    public PaymentDtos.PayoutResponse payout(String payoutPublicId) {
        return providerPayoutRepository.findByPublicId(payoutPublicId).map(this::toPayoutResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payout not found"));
    }

    /**
     * Releases the mock payout after marketplace marks the order eligible.
     */
    @Transactional
    public PaymentDtos.MessageResponse markPayoutEligible(String marketplaceOrderPublicId) {
        PaymentOrder order = findOrder(marketplaceOrderPublicId);
        ensurePaymentLifecycleAllowsPayout(order);
        ProviderEligibilityResponse eligibility = providerEligibility(order.getProviderAccountPublicId());
        if (eligibility == null || !eligibility.eligible() || !eligibility.payoutEligible() || eligibility.restricted()) {
            blockPayout(order, "Provider is not eligible for payout");
            log.warn("Payment payout blocked: marketplaceOrderPublicId={}, providerAccountPublicId={}, restricted={}, payoutEligible={}",
                    marketplaceOrderPublicId, order.getProviderAccountPublicId(),
                    eligibility != null && eligibility.restricted(),
                    eligibility != null && eligibility.payoutEligible());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Provider is not eligible for payout");
        }
        ProviderPayout payout = providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(marketplaceOrderPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payout not found"));
        LocalDateTime now = LocalDateTime.now();
        order.setPayoutEligibilityStatus("ELIGIBLE");
        order.setUpdatedAt(now);
        payout.setPayoutStatus("PAID");
        payout.setEligibleAt(now);
        payout.setReleaseRequestedAt(now);
        payout.setProviderPayoutReference(paymentGatewayRegistry.releasePayout(order.getPaymentProvider(), payout.getPublicId(), payout.getAmount(), payout.getCurrencyCode()));
        payout.setPaidAt(now);
        payout.setUpdatedAt(now);
        publishWalletEvent("payout-eligible", order, order.getProviderAccountPublicId(), order.getProviderPayableAmount());
        publishWalletEvent("payout-paid", order, order.getProviderAccountPublicId(), order.getProviderPayableAmount());
        log.info("Payment payout released: marketplaceOrderPublicId={}, paymentOrderPublicId={}, providerAccountPublicId={}, payoutAmount={}",
                marketplaceOrderPublicId, order.getPublicId(), order.getProviderAccountPublicId(), payout.getAmount());
        return new PaymentDtos.MessageResponse("Payout marked eligible and paid in mock mode");
    }

    /**
     * Cancels a payment lifecycle and reverses captured funds when a buyer abandons the order.
     */
    @Transactional
    public PaymentDtos.MessageResponse cancel(String marketplaceOrderPublicId, PaymentDtos.LifecycleRequest request, Jwt jwt) {
        PaymentOrder order = findOrder(marketplaceOrderPublicId);
        if ("CANCELLED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Cancellation already completed");
        }
        if ("REFUNDED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Refund already completed");
        }
        return completeRefundLikeTransition(order, request, jwt, "CANCELLED", "CANCELLED", "Cancellation completed", "customer cancellation");
    }

    /**
     * Marks a payment order as disputed so payout eligibility stays blocked while the issue is reviewed.
     */
    @Transactional
    public PaymentDtos.MessageResponse dispute(String marketplaceOrderPublicId, PaymentDtos.LifecycleRequest request, Jwt jwt) {
        PaymentOrder order = findOrder(marketplaceOrderPublicId);
        if ("DISPUTED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Dispute already opened");
        }
        if ("CANCELLED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Cancellation already completed");
        }
        if ("REFUNDED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Refund already completed");
        }
        LocalDateTime now = LocalDateTime.now();
        order.setPaymentStatus("DISPUTED");
        order.setPayoutEligibilityStatus("BLOCKED_BY_DISPUTE");
        order.setUpdatedAt(now);
        providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(marketplaceOrderPublicId).ifPresent(payout -> {
            payout.setPayoutStatus("BLOCKED_BY_DISPUTE");
            payout.setPayoutHoldReason(firstNonBlank(request == null ? null : request.reason(), "Dispute opened"));
            payout.setUpdatedAt(now);
        });
        log.warn("Payment dispute opened: marketplaceOrderPublicId={}, paymentOrderPublicId={}, reason={}",
                marketplaceOrderPublicId, order.getPublicId(), request == null ? null : request.reason());
        return new PaymentDtos.MessageResponse("Dispute opened");
    }

    /**
     * Completes a mock refund and publishes a wallet refund event.
     */
    @Transactional
    public PaymentDtos.MessageResponse refund(String marketplaceOrderPublicId, PaymentDtos.RefundRequest request, Jwt jwt) {
        PaymentOrder order = findOrder(marketplaceOrderPublicId);
        if ("REFUNDED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Refund already completed");
        }
        if ("CANCELLED".equals(order.getPaymentStatus())) {
            return new PaymentDtos.MessageResponse("Cancellation already completed");
        }
        return completeRefundLikeTransition(order,
                request == null ? null : new PaymentDtos.LifecycleRequest(request.reason()),
                jwt, "REFUNDED", "REFUNDED", "Refund completed", "refund");
    }

    /**
     * Loads the current payment, payout, and refund lifecycle state for a marketplace order.
     */
    @Transactional(readOnly = true)
    public PaymentDtos.PaymentLifecycleResponse lifecycle(String marketplaceOrderPublicId) {
        PaymentOrder order = findOrder(marketplaceOrderPublicId);
        ProviderPayout payout = providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(marketplaceOrderPublicId)
                .orElse(null);
        RefundTransaction refund = refundTransactionRepository
                .findTopByPaymentOrder_MarketplaceOrderPublicIdOrderByCreatedAtDesc(marketplaceOrderPublicId)
                .orElse(null);
        return new PaymentDtos.PaymentLifecycleResponse(order.getMarketplaceOrderPublicId(), order.getPaymentStatus(),
                order.getPayoutEligibilityStatus(), payout == null ? null : payout.getPayoutStatus(),
                refund == null ? "NONE" : refund.getRefundStatus(),
                payout == null ? null : payout.getPayoutHoldReason(),
                refund == null ? null : refund.getRefundReason(),
                order.getUpdatedAt());
    }

    /**
     * Completes a refund-like lifecycle transition and publishes a wallet refund event when money is reversed.
     */
    @Transactional
    private PaymentDtos.MessageResponse completeRefundLikeTransition(PaymentOrder order,
                                                                     PaymentDtos.LifecycleRequest request,
                                                                     Jwt jwt,
                                                                     String finalPaymentStatus,
                                                                     String finalPayoutStatus,
                                                                     String successMessage,
                                                                     String fallbackReason) {
        LocalDateTime now = LocalDateTime.now();
        RefundTransaction refund = new RefundTransaction();
        refund.setPublicId(UUID.randomUUID().toString());
        refund.setPaymentOrder(order);
        refund.setRequestedByUserPublicId(jwt == null ? null : userPublicId(jwt));
        refund.setAmount(order.getCustomerChargeAmount());
        refund.setCurrencyCode(order.getCurrencyCode());
        refund.setRefundStatus("COMPLETED");
        refund.setRefundReason(firstNonBlank(request == null ? null : request.reason(), fallbackReason));
        refund.setPaymentProviderReference(paymentGatewayRegistry.refund(order.getPaymentProvider(), order.getPublicId(), order.getCustomerChargeAmount(), order.getCurrencyCode()));
        refund.setCreatedAt(now);
        refund.setCompletedAt(now);
        refundTransactionRepository.save(refund);
        order.setPaymentStatus(finalPaymentStatus);
        order.setPayoutEligibilityStatus(finalPayoutStatus);
        order.setUpdatedAt(now);
        providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(order.getMarketplaceOrderPublicId()).ifPresent(payout -> {
            payout.setPayoutStatus(finalPayoutStatus);
            payout.setPayoutHoldReason(firstNonBlank(request == null ? null : request.reason(), fallbackReason));
            payout.setUpdatedAt(now);
        });
        publishWalletEvent("refund-completed", order, order.getCustomerUserPublicId(), order.getCustomerChargeAmount());
        log.warn("Payment {} completed: marketplaceOrderPublicId={}, paymentOrderPublicId={}, refundPublicId={}, amount={}, reason={}",
                fallbackReason, order.getMarketplaceOrderPublicId(), order.getPublicId(), refund.getPublicId(), refund.getAmount(),
                request == null ? null : request.reason());
        return new PaymentDtos.MessageResponse(successMessage);
    }

    /**
     * Stores a Stripe webhook event once and ignores duplicate provider event ids.
     */
    @Transactional
    public PaymentDtos.MessageResponse stripeWebhook(String signature, String providerEventId, String eventType, String payload) {
        if ("stripe-test".equalsIgnoreCase(gatewayMode)) {
            verifyStripeSignature(signature, payload);
        }
        if (paymentWebhookEventRepository.existsByProviderEventId(providerEventId)) {
            log.info("Duplicate Stripe webhook ignored: providerEventId={}, eventType={}", providerEventId, firstNonBlank(eventType, "UNKNOWN"));
            return new PaymentDtos.MessageResponse("Duplicate webhook ignored");
        }
        PaymentWebhookEvent event = new PaymentWebhookEvent();
        event.setPaymentProvider("stripe");
        event.setProviderEventId(providerEventId);
        event.setEventType(firstNonBlank(eventType, "UNKNOWN"));
        event.setPayloadJson(firstNonBlank(payload, "{}"));
        event.setProcessingStatus("PROCESSED");
        event.setReceivedAt(LocalDateTime.now());
        event.setProcessedAt(LocalDateTime.now());
        paymentWebhookEventRepository.save(event);
        log.info("Stripe webhook accepted: providerEventId={}, eventType={}", providerEventId, event.getEventType());
        return new PaymentDtos.MessageResponse("Stripe webhook accepted for idempotent processing");
    }

    private void verifyStripeSignature(String signatureHeader, String payload) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STRIPE_WEBHOOK_SECRET is required in stripe-test mode");
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe-Signature header is required");
        }
        String timestamp = null;
        String expectedV1 = null;
        for (String part : signatureHeader.split(",")) {
            String[] pair = part.trim().split("=", 2);
            if (pair.length != 2) {
                continue;
            }
            if ("t".equals(pair[0])) {
                timestamp = pair[1];
            } else if ("v1".equals(pair[0])) {
                expectedV1 = pair[1];
            }
        }
        if (timestamp == null || expectedV1 == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe-Signature format is invalid");
        }
        String signedPayload = timestamp + "." + firstNonBlank(payload, "");
        String computed = hmacSha256Hex(stripeWebhookSecret, signedPayload);
        if (!computed.equalsIgnoreCase(expectedV1)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Stripe webhook signature validation failed");
        }
    }

    private String hmacSha256Hex(String secret, String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to verify Stripe signature");
        }
    }

    /**
     * Lists payment orders for admin transaction views.
     */
    @Transactional(readOnly = true)
    public List<PaymentDtos.PaymentOrderResponse> adminTransactions() {
        return paymentOrderRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toOrderResponse).toList();
    }

    /**
     * Lists all provider payouts for admin views.
     */
    @Transactional(readOnly = true)
    public List<PaymentDtos.PayoutResponse> adminPayouts() {
        return providerPayoutRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toPayoutResponse).toList();
    }

    /**
     * Lists blocked payout records for finance/admin views.
     */
    @Transactional(readOnly = true)
    public List<PaymentDtos.PayoutResponse> blockedPayouts() {
        return providerPayoutRepository.findByPayoutStatusOrderByCreatedAtDesc("BLOCKED").stream().map(this::toPayoutResponse).toList();
    }

    /**
     * Lists refund identifiers for admin views.
     */
    @Transactional(readOnly = true)
    public List<String> adminRefunds() {
        return refundTransactionRepository.findAllByOrderByCreatedAtDesc().stream().map(RefundTransaction::getPublicId).toList();
    }

    private void createCaptureTransaction(PaymentOrder order, LocalDateTime now) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPublicId(UUID.randomUUID().toString());
        transaction.setPaymentOrder(order);
        transaction.setTransactionType("CAPTURE");
        transaction.setAmount(order.getCustomerChargeAmount());
        transaction.setCurrencyCode(order.getCurrencyCode());
        transaction.setProviderTransactionReference(order.getProviderPaymentReference());
        transaction.setTransactionStatus("SUCCEEDED");
        transaction.setCreatedAt(now);
        paymentTransactionRepository.save(transaction);
    }

    private void createHeldPayout(PaymentOrder order, LocalDateTime now) {
        ProviderPayout payout = new ProviderPayout();
        payout.setPublicId(UUID.randomUUID().toString());
        payout.setPaymentOrder(order);
        payout.setProviderAccountPublicId(order.getProviderAccountPublicId());
        payout.setAmount(order.getProviderPayableAmount());
        payout.setCurrencyCode(order.getCurrencyCode());
        payout.setPayoutStatus("ON_HOLD");
        payout.setPayoutHoldReason("Waiting for customer acceptance");
        payout.setPaymentProvider(order.getPaymentProvider());
        payout.setCreatedAt(now);
        payout.setUpdatedAt(now);
        providerPayoutRepository.save(payout);
    }

    private PaymentOrder findOrder(String marketplaceOrderPublicId) {
        return paymentOrderRepository.findByMarketplaceOrderPublicId(marketplaceOrderPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found"));
    }

    private String userPublicId(Jwt jwt) {
        String uid = jwt.getClaimAsString("uid");
        return uid == null || uid.isBlank() ? jwt.getSubject() : uid;
    }

    private String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private PaymentDtos.PaymentOrderResponse toOrderResponse(PaymentOrder order) {
        return new PaymentDtos.PaymentOrderResponse(order.getPublicId(), order.getMarketplaceOrderPublicId(),
                order.getPaymentStatus(), order.getPayoutEligibilityStatus(), order.getCustomerChargeAmount(),
                order.getPlatformFeeAmount(), order.getProviderPayableAmount(), order.getCreatedAt());
    }

    private PaymentDtos.PayoutResponse toPayoutResponse(ProviderPayout payout) {
        return new PaymentDtos.PayoutResponse(payout.getPublicId(), payout.getPaymentOrder().getMarketplaceOrderPublicId(),
                payout.getProviderAccountPublicId(), payout.getAmount(), payout.getCurrencyCode(),
                payout.getPayoutStatus(), payout.getPaidAt());
    }

    protected void publishWalletEvent(String path, PaymentOrder order, String ownerPublicId, BigDecimal amount) {
        try {
            paymentEventOutboxService.queueWalletEvent(path, order, ownerPublicId, amount);
            log.info("Wallet event queued: eventType={}, marketplaceOrderPublicId={}, ownerPublicId={}",
                    path, order.getMarketplaceOrderPublicId(), ownerPublicId);
        } catch (RuntimeException exception) {
            log.error("Wallet event queue failed: eventType={}, marketplaceOrderPublicId={}, ownerPublicId={}, reason={}",
                    path, order.getMarketplaceOrderPublicId(), ownerPublicId, exception.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to update wallet projection right now", exception);
        }
    }

    @Retryable("service-retry")
    @CircuitBreakerProtected("authorization-circuit-breaker")
    private ProviderEligibilityResponse providerEligibility(String providerPublicId) {
        try {
            return restClient.get()
                    .uri(authorizationProviderEligibilityUrl + "/providers/" + providerPublicId + "/modules/MARKETPLACE/eligibility")
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .retrieve()
                    .body(ProviderEligibilityResponse.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify provider eligibility right now", exception);
        }
    }

    private void ensurePaymentLifecycleAllowsPayout(PaymentOrder order) {
        String paymentStatus = firstNonBlank(order.getPaymentStatus(), "");
        if ("DISPUTED".equals(paymentStatus) || "CANCELLED".equals(paymentStatus) || "REFUNDED".equals(paymentStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order is no longer eligible for payout");
        }
    }

    private void blockPayout(PaymentOrder order, String reason) {
        ProviderPayout payout = providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payout not found"));
        LocalDateTime now = LocalDateTime.now();
        order.setPayoutEligibilityStatus("BLOCKED");
        order.setUpdatedAt(now);
        payout.setPayoutStatus("BLOCKED");
        payout.setPayoutHoldReason(reason);
        payout.setUpdatedAt(now);
    }

    private record WalletEventRequest(String sourceEventId, String paymentOrderPublicId, String marketplaceOrderPublicId,
                                      String ownerPublicId, String currencyCode, BigDecimal amount) {
    }

    private record ProviderEligibilityResponse(boolean eligible, String providerPublicId, String moduleCode,
                                               String providerStatus, String enrollmentStatus, boolean sellingEnabled,
                                               boolean payoutEligible, boolean restricted) {
    }
}
