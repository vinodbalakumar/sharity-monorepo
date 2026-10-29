package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.config.PayPalConfig;
import com.java.vinod.payment.service.dto.PayPalMarketplaceDtos;
import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.Dispute;
import com.java.vinod.payment.service.entity.PaymentGatewayPolicy;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.entity.PaymentWebhookEvent;
import com.java.vinod.payment.service.entity.ProviderPayout;
import com.java.vinod.payment.service.entity.RefundTransaction;
import com.java.vinod.payment.service.repository.DisputeRepository;
import com.java.vinod.payment.service.repository.PaymentGatewayPolicyRepository;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.repository.PaymentWebhookEventRepository;
import com.java.vinod.payment.service.repository.ProviderPayoutRepository;
import com.java.vinod.payment.service.repository.RefundTransactionRepository;
import com.java.vinod.payment.service.webhook.PayPalWebhookHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PayPalMarketplaceService {
    private static final String PAYPAL_PROVIDER = "PAYPAL_MARKETPLACE";
    private static final String UNKNOWN_PROVIDER_ACCOUNT = "UNKNOWN_PROVIDER";
    private static final String DEFAULT_COUNTRY = "US";

    private final PayPalConfig payPalConfig;
    private final PaymentGatewayPolicyRepository paymentGatewayPolicyRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final ProviderPayoutRepository providerPayoutRepository;
    private final RefundTransactionRepository refundTransactionRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final DisputeRepository disputeRepository;
    private final PaymentService paymentService;
    private final PayPalWebhookHandler payPalWebhookHandler;

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalProviderAvailabilityResponse availability() {
        boolean configured = isConfigured();
        List<String> supportedCountries = supportedCountries();
        return new PayPalMarketplaceDtos.PayPalProviderAvailabilityResponse(
                configured,
                configured,
                configured,
                true,
                isSandboxMode(),
                !supportedCountries.isEmpty(),
                configured,
                configured ? null : "PayPal credentials are not configured for this environment",
                configured
                        ? "PayPal marketplace checkout availability is derived from active payment-service configuration."
                        : "PayPal is unavailable until client credentials and webhook configuration are provided by the backend."
        );
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalProviderConfigResponse config() {
        boolean configured = isConfigured();
        return new PayPalMarketplaceDtos.PayPalProviderConfigResponse(
                PAYPAL_PROVIDER,
                normalizedMode(),
                supportedCountries(),
                List.of("MARKETPLACE", "DIGITAL_GOODS"),
                isWebhookVerificationConfigured(),
                configured,
                configured,
                "Provider credentials, webhook secrets, and partner referral payloads remain backend-only."
        );
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse sellerStatus(Jwt jwt) {
        return toSellerStatus(requireAuthenticatedSellerId(jwt));
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse sellerPayoutStatus(Jwt jwt) {
        return toSellerStatus(requireAuthenticatedSellerId(jwt));
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.SellerPayPalOnboardingLinkResponse onboardingLink(Jwt jwt) {
        String sellerId = requireAuthenticatedSellerId(jwt);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(45);
        String onboardingUrl = isSandboxMode()
                ? "https://www.sandbox.paypal.com/bizsignup/partner/entry?referralToken=" + sellerId
                : "https://www.paypal.com/bizsignup/partner/entry?referralToken=" + sellerId;
        return new PayPalMarketplaceDtos.SellerPayPalOnboardingLinkResponse(
                isConfigured(),
                onboardingUrl,
                expiresAt,
                "/payment/paypal/return",
                "/payment/paypal/refresh",
                isConfigured()
                        ? "Complete PayPal onboarding in the hosted PayPal flow. Sensitive partner referral data stays on the backend."
                        : "PayPal onboarding cannot start until provider credentials are configured."
        );
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse refreshSeller(Jwt jwt) {
        String resolvedSellerId = requireAuthenticatedSellerId(jwt);
        return new PayPalMarketplaceDtos.SellerPayPalRefreshResponse(
                true,
                toSellerStatus(resolvedSellerId),
                "Seller PayPal status was refreshed from persisted payout and payment state."
        );
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse sellerReturn(
            Jwt jwt,
            PayPalMarketplaceDtos.SellerPayPalReturnRequest request) {
        String authenticatedSellerId = requireAuthenticatedSellerId(jwt);
        if (request != null && !isBlank(request.sellerId()) && !authenticatedSellerId.equals(request.sellerId().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "sellerId does not match the authenticated seller");
        }
        return new PayPalMarketplaceDtos.SellerPayPalRefreshResponse(
                true,
                toSellerStatus(authenticatedSellerId),
                "Seller PayPal return state was reconciled for the authenticated seller."
        );
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalOrderCreateResponse createOrder(
            PayPalMarketplaceDtos.PayPalOrderCreateRequest request) {
        String checkoutId = requireValue(request == null ? null : request.checkoutId(), "checkoutId is required");
        PaymentOrder order = findOrderByCheckoutId(checkoutId);
        return new PayPalMarketplaceDtos.PayPalOrderCreateResponse(
                true,
                order.getMarketplaceOrderPublicId(),
                order.getPublicId(),
                maskReference(order.getProviderPaymentReference()),
                buildApproveUrl(order),
                mapOrderCreationStatus(order),
                requiresBuyerRedirect(order),
                "Approval details are derived from the stored payment order. Provider payloads remain backend-owned."
        );
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalAuthorizeResponse authorize(
            PayPalMarketplaceDtos.PayPalAuthorizeRequest request) {
        PaymentOrder order = resolveOrder(request == null ? null : request.paymentAuthorizationId(),
                request == null ? null : request.checkoutId());
        return new PayPalMarketplaceDtos.PayPalAuthorizeResponse(
                true,
                order.getPublicId(),
                PAYPAL_PROVIDER,
                maskReference(order.getProviderPaymentReference()),
                maskReference(order.getProviderPaymentReference()),
                mapAuthorizationStatus(order),
                order.getCustomerChargeAmount(),
                order.getCurrencyCode(),
                orderRoute(order),
                "Authorization state is projected from the persisted payment order and excludes seller receivable details."
        );
    }

    @Transactional
    public PayPalMarketplaceDtos.PayPalActionResponse capture(
            PayPalMarketplaceDtos.PayPalCaptureRequest request) {
        String paymentAuthorizationId = requireValue(request == null ? null : request.paymentAuthorizationId(),
                "paymentAuthorizationId is required");
        PaymentOrder order = resolveOrder(paymentAuthorizationId, null);
        if (request != null && request.amountToCapture() != null
                && request.amountToCapture().compareTo(order.getCustomerChargeAmount()) != 0) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    false,
                    "PARTIAL_CAPTURE_NOT_SUPPORTED",
                    "This payment flow stores captured marketplace orders only; partial capture is not supported.",
                    statusRoute(order),
                    false,
                    LocalDateTime.now());
        }
        return new PayPalMarketplaceDtos.PayPalActionResponse(
                true,
                "ALREADY_CAPTURED",
                "The stored marketplace payment order is already captured.",
                statusRoute(order),
                true,
                LocalDateTime.now());
    }

    @Transactional
    public PayPalMarketplaceDtos.PayPalActionResponse voidAuthorization(
            PayPalMarketplaceDtos.PayPalVoidRequest request) {
        String paymentAuthorizationId = requireValue(request == null ? null : request.paymentAuthorizationId(),
                "paymentAuthorizationId is required");
        PaymentOrder order = resolveOrder(paymentAuthorizationId, null);
        if ("CANCELLED".equalsIgnoreCase(order.getPaymentStatus())) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    true,
                    "AUTHORIZATION_ALREADY_VOIDED",
                    "The payment has already been cancelled.",
                    statusRoute(order),
                    true,
                    LocalDateTime.now());
        }
        if (!"CAPTURED".equalsIgnoreCase(order.getPaymentStatus())) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    false,
                    "AUTHORIZATION_VOID_NOT_ALLOWED",
                    "Only captured marketplace payments can be cancelled through this endpoint.",
                    statusRoute(order),
                    false,
                    LocalDateTime.now());
        }
        PaymentDtos.MessageResponse response = paymentService.cancel(
                order.getMarketplaceOrderPublicId(),
                new PaymentDtos.LifecycleRequest("PayPal authorization void requested"),
                null);
        return new PayPalMarketplaceDtos.PayPalActionResponse(
                true,
                "AUTHORIZATION_VOIDED",
                response.message(),
                statusRoute(order),
                false,
                LocalDateTime.now());
    }

    @Transactional
    public PayPalMarketplaceDtos.PayPalActionResponse refund(
            PayPalMarketplaceDtos.PayPalRefundRequest request) {
        String paymentAuthorizationId = requireValue(request == null ? null : request.paymentAuthorizationId(),
                "paymentAuthorizationId is required");
        PaymentOrder order = resolveOrder(paymentAuthorizationId, null);
        if (request != null && request.refundAmount() != null
                && request.refundAmount().compareTo(order.getCustomerChargeAmount()) != 0) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    false,
                    "PARTIAL_REFUND_NOT_SUPPORTED",
                    "This refund endpoint supports full-order refunds only.",
                    statusRoute(order),
                    false,
                    LocalDateTime.now());
        }
        if ("REFUNDED".equalsIgnoreCase(order.getPaymentStatus())) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    true,
                    "REFUND_ALREADY_COMPLETED",
                    "The order has already been refunded.",
                    statusRoute(order),
                    true,
                    LocalDateTime.now());
        }
        PaymentDtos.MessageResponse response = paymentService.refund(
                order.getMarketplaceOrderPublicId(),
                new PaymentDtos.RefundRequest(request == null ? null : request.reason()),
                null);
        return new PayPalMarketplaceDtos.PayPalActionResponse(
                true,
                "REFUND_COMPLETED",
                response.message(),
                statusRoute(order),
                false,
                LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalPaymentStatusResponse status(String paymentAuthorizationId) {
        return toStatusResponse(resolveOrder(paymentAuthorizationId, null));
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalOrderCreateResponse retry(
            PayPalMarketplaceDtos.PayPalOrderCreateRequest request) {
        return createOrder(request);
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.PayPalPaymentStatusResponse paypalReturn(
            PayPalMarketplaceDtos.PayPalAuthorizeRequest request) {
        PaymentOrder order = resolveOrder(request == null ? null : request.paymentAuthorizationId(),
                request == null ? null : request.checkoutId());
        return toStatusResponse(order);
    }

    public PayPalMarketplaceDtos.PayPalActionResponse cancelReturn() {
        return new PayPalMarketplaceDtos.PayPalActionResponse(
                true,
                "PAYPAL_PAYMENT_CANCELLED",
                "The PayPal approval flow was cancelled before any new payment change was applied.",
                "/checkout",
                true,
                LocalDateTime.now());
    }

    @Transactional
    public PayPalMarketplaceDtos.PayPalActionResponse paypalWebhook(
            String transmissionId,
            String transmissionTime,
            String certUrl,
            String authAlgo,
            String transmissionSignature,
            String providerEventId,
            String payload) {
        if (isBlank(transmissionId) || isBlank(transmissionTime) || isBlank(certUrl)
                || isBlank(authAlgo) || isBlank(transmissionSignature) || isBlank(payload)) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    false,
                    "WEBHOOK_HEADERS_MISSING",
                    "PayPal webhook verification headers and payload are required.",
                    "/admin/payments/paypal/webhook-health",
                    false,
                    LocalDateTime.now());
        }
        String resolvedProviderEventId = firstNonBlank(providerEventId, transmissionId);
        if (paymentWebhookEventRepository.existsByProviderEventId(resolvedProviderEventId)) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    true,
                    "DUPLICATE_WEBHOOK_IGNORED",
                    "A webhook with the same provider event id has already been processed.",
                    "/admin/payments/paypal/webhook-health",
                    true,
                    LocalDateTime.now());
        }
        boolean verified = payPalWebhookHandler.verifyWebhookSignature(
                transmissionId,
                transmissionTime,
                certUrl,
                authAlgo,
                transmissionSignature,
                payload);
        if (!verified) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    false,
                    "WEBHOOK_VERIFICATION_FAILED",
                    "The PayPal webhook signature could not be verified.",
                    "/admin/payments/paypal/webhook-health",
                    false,
                    LocalDateTime.now());
        }
        PayPalWebhookHandler.PayPalWebhookEvent event;
        try {
            event = payPalWebhookHandler.parseWebhookEvent(payload);
        } catch (Exception exception) {
            return new PayPalMarketplaceDtos.PayPalActionResponse(
                    false,
                    "WEBHOOK_PAYLOAD_INVALID",
                    "The PayPal webhook payload could not be parsed.",
                    "/admin/payments/paypal/webhook-health",
                    false,
                    LocalDateTime.now());
        }
        PaymentWebhookEvent webhookEvent = new PaymentWebhookEvent();
        webhookEvent.setPaymentProvider("paypal");
        webhookEvent.setProviderEventId(firstNonBlank(event.getEventId(), resolvedProviderEventId));
        webhookEvent.setEventType(event.getEventType() == null ? "UNKNOWN" : event.getEventType().code);
        webhookEvent.setPayloadJson(payload);
        webhookEvent.setProcessingStatus("PROCESSED");
        webhookEvent.setReceivedAt(LocalDateTime.now());
        webhookEvent.setProcessedAt(LocalDateTime.now());
        paymentWebhookEventRepository.save(webhookEvent);
        return new PayPalMarketplaceDtos.PayPalActionResponse(
                true,
                "WEBHOOK_VERIFIED",
                "The PayPal webhook was verified and recorded for audit-safe processing.",
                "/admin/payments/paypal/webhook-health",
                false,
                LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.AdminPayPalConfigResponse adminConfig() {
        boolean configured = isConfigured();
        return new PayPalMarketplaceDtos.AdminPayPalConfigResponse(
                configured,
                normalizedMode(),
                supportedCountries(),
                configured,
                configured,
                isWebhookVerificationConfigured(),
                true,
                configured
                        ? "Admin visibility shows gateway readiness without exposing PayPal secrets."
                        : "PayPal is not production-ready until credentials and webhook verification are configured.",
                LocalDateTime.now());
    }

    public PayPalMarketplaceDtos.PayPalActionResponse updateAdminConfig() {
        return new PayPalMarketplaceDtos.PayPalActionResponse(
                false,
                "PAYPAL_CONFIG_UPDATE_REQUIRES_DEPLOYMENT",
                "PayPal runtime configuration is environment-backed and cannot be changed through this controller.",
                "/admin/payments/paypal/config",
                true,
                LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary> sellers() {
        return payPalSellerIds().stream().map(this::toAdminSellerSummary).toList();
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary seller(String sellerId) {
        return toAdminSellerSummary(resolveSellerAccountId(sellerId));
    }

    @Transactional(readOnly = true)
    public List<PayPalMarketplaceDtos.AdminPayPalEventSummary> events() {
        return payPalEvents().stream().map(this::toEventSummary).toList();
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.AdminPayPalEventSummary event(String eventId) {
        return payPalEvents().stream()
                .filter(event -> eventId.equals(String.valueOf(event.getId())) || eventId.equals(event.getProviderEventId()))
                .findFirst()
                .map(this::toEventSummary)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PayPal event not found"));
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.AdminPayPalWebhookHealth webhookHealth() {
        List<PaymentWebhookEvent> events = payPalEvents();
        LocalDateTime lastReceivedAt = events.stream()
                .map(PaymentWebhookEvent::getReceivedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        int failedEventCount = (int) events.stream()
                .filter(event -> !"PROCESSED".equalsIgnoreCase(event.getProcessingStatus()))
                .count();
        return new PayPalMarketplaceDtos.AdminPayPalWebhookHealth(
                isConfigured(),
                isConfigured(),
                lastReceivedAt,
                failedEventCount,
                0,
                isWebhookVerificationConfigured(),
                isWebhookVerificationConfigured()
                        ? "Webhook health is derived from recorded PayPal webhook events."
                        : "Webhook verification remains incomplete until PAYPAL_WEBHOOK_ID is configured."
        );
    }

    @Transactional(readOnly = true)
    public List<PayPalMarketplaceDtos.AdminPayPalDisputeSummary> disputes() {
        return disputeRepository.findOpenDisputes().stream()
                .filter(this::isPayPalDispute)
                .map(this::toDisputeSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PayPalMarketplaceDtos.AdminPayPalSettlementSummary> settlements() {
        return providerPayoutRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(this::isPayPalPayout)
                .map(this::toSettlementSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse adminRefreshSeller(String sellerId) {
        String resolvedSellerId = resolveSellerAccountId(sellerId);
        return new PayPalMarketplaceDtos.SellerPayPalRefreshResponse(
                true,
                toSellerStatus(resolvedSellerId),
                "Seller PayPal status was refreshed from persisted payout and payment state."
        );
    }

    private PayPalMarketplaceDtos.PayPalPaymentStatusResponse toStatusResponse(PaymentOrder order) {
        Optional<RefundTransaction> refund = refundTransactionRepository
                .findTopByPaymentOrder_MarketplaceOrderPublicIdOrderByCreatedAtDesc(order.getMarketplaceOrderPublicId());
        Optional<Dispute> dispute = disputeRepository.findByOrderId(order.getMarketplaceOrderPublicId());
        String paymentStatus = firstNonBlank(order.getPaymentStatus(), "UNKNOWN");
        boolean pending = "PENDING".equalsIgnoreCase(paymentStatus) || "CREATED".equalsIgnoreCase(paymentStatus);
        boolean cancelled = "CANCELLED".equalsIgnoreCase(paymentStatus);
        boolean refunded = "REFUNDED".equalsIgnoreCase(paymentStatus);
        boolean disputed = "DISPUTED".equalsIgnoreCase(paymentStatus);
        boolean captured = "CAPTURED".equalsIgnoreCase(paymentStatus) || refunded || disputed || cancelled;
        boolean authorized = captured || "AUTHORIZED".equalsIgnoreCase(paymentStatus);
        return new PayPalMarketplaceDtos.PayPalPaymentStatusResponse(
                order.getPublicId(),
                order.getMarketplaceOrderPublicId(),
                PAYPAL_PROVIDER,
                paymentStatus,
                true,
                authorized,
                captured,
                cancelled,
                false,
                cancelled,
                pending,
                refund.map(RefundTransaction::getRefundStatus).orElse("NONE"),
                dispute.map(Dispute::getDisputeStatus).orElse("NONE"),
                order.getMarketplaceOrderPublicId(),
                orderRoute(order),
                "Buyer-safe PayPal status is projected from persisted payment, refund, and dispute state.",
                order.getUpdatedAt());
    }

    private PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse toSellerStatus(String sellerId) {
        SellerSnapshot snapshot = sellerSnapshot(sellerId);
        boolean connected = snapshot.latestOrder() != null || snapshot.latestPayout() != null;
        boolean payoutsEnabled = snapshot.latestPayout() == null
                || !firstNonBlank(snapshot.latestPayout().getPayoutStatus(), "").startsWith("BLOCKED");
        List<String> permissions = connected ? List.of("PAYMENT", "REFUND", "PARTNER_FEE") : List.of();
        List<String> requirementsDue = new ArrayList<>();
        if (!connected) {
            requirementsDue.add("CONNECT_PAYPAL_ACCOUNT");
        }
        if (snapshot.latestPayout() != null && isBlockedPayout(snapshot.latestPayout())) {
            requirementsDue.add(firstNonBlank(snapshot.latestPayout().getPayoutHoldReason(), "RESOLVE_PAYOUT_REVIEW"));
        }
        String nextAction = requirementsDue.isEmpty() ? "READY_TO_SELL" : "COMPLETE_ONBOARDING";
        LocalDateTime updatedAt = latestTimestamp(snapshot.latestOrder(), snapshot.latestPayout());
        return new PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse(
                sellerId,
                connected,
                maskReference(sellerId),
                !connected,
                connected,
                connected,
                connected,
                payoutsEnabled,
                permissions,
                requirementsDue,
                snapshot.country(),
                nextAction,
                "/seller/payments/paypal/onboarding",
                "Seller status is derived from stored payout and payment state without exposing PayPal credentials.",
                updatedAt == null ? LocalDateTime.now() : updatedAt);
    }

    private PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary toAdminSellerSummary(String sellerId) {
        SellerSnapshot snapshot = sellerSnapshot(sellerId);
        boolean connected = snapshot.latestOrder() != null || snapshot.latestPayout() != null;
        boolean payoutsEnabled = snapshot.latestPayout() == null
                || !firstNonBlank(snapshot.latestPayout().getPayoutStatus(), "").startsWith("BLOCKED");
        List<String> requirementsDue = new ArrayList<>();
        if (!connected) {
            requirementsDue.add("CONNECT_PAYPAL_ACCOUNT");
        }
        if (snapshot.latestPayout() != null && isBlockedPayout(snapshot.latestPayout())) {
            requirementsDue.add(firstNonBlank(snapshot.latestPayout().getPayoutHoldReason(), "RESOLVE_PAYOUT_REVIEW"));
        }
        String onboardingStatus = requirementsDue.isEmpty() ? "ONBOARDING_COMPLETE" : "ACTION_REQUIRED";
        LocalDateTime lastRefreshedAt = latestTimestamp(snapshot.latestOrder(), snapshot.latestPayout());
        return new PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary(
                sellerId,
                sellerId,
                maskReference(sellerId),
                onboardingStatus,
                connected,
                connected,
                payoutsEnabled,
                requirementsDue.size(),
                snapshot.country(),
                lastRefreshedAt == null ? LocalDateTime.now() : lastRefreshedAt,
                "/admin/payments/paypal/sellers/" + sellerId,
                "Seller PayPal status is summarized from persisted marketplace payment activity."
        );
    }

    private PayPalMarketplaceDtos.AdminPayPalEventSummary toEventSummary(PaymentWebhookEvent event) {
        return new PayPalMarketplaceDtos.AdminPayPalEventSummary(
                String.valueOf(event.getId()),
                event.getProviderEventId(),
                event.getEventType(),
                relatedEntityType(event.getEventType()),
                event.getProviderEventId(),
                "PROCESSED".equalsIgnoreCase(event.getProcessingStatus()),
                event.getProcessingStatus(),
                event.getReceivedAt(),
                "PayPal webhook processing history is shown without exposing raw payload secrets.",
                "/admin/payments/paypal/events/" + event.getId()
        );
    }

    private PayPalMarketplaceDtos.AdminPayPalDisputeSummary toDisputeSummary(Dispute dispute) {
        String paymentAuthorizationId = paymentOrderRepository.findByMarketplaceOrderPublicId(dispute.getOrderId())
                .map(PaymentOrder::getPublicId)
                .orElse(dispute.getPaymentId());
        return new PayPalMarketplaceDtos.AdminPayPalDisputeSummary(
                dispute.getDisputeId(),
                paymentAuthorizationId,
                dispute.getDisputeStatus(),
                dispute.getDisputeReason(),
                firstNonBlank(dispute.getClaimedAmount(), BigDecimal.ZERO),
                firstNonBlank(dispute.getCurrencyCode(), "USD"),
                "Dispute data is summarized from the internal dispute ledger without exposing provider case payloads.",
                "/admin/payments/paypal/disputes/" + dispute.getDisputeId()
        );
    }

    private PayPalMarketplaceDtos.AdminPayPalSettlementSummary toSettlementSummary(ProviderPayout payout) {
        PaymentOrder order = payout.getPaymentOrder();
        return new PayPalMarketplaceDtos.AdminPayPalSettlementSummary(
                payout.getPublicId(),
                payout.getProviderAccountPublicId(),
                maskReference(payout.getProviderAccountPublicId()),
                payout.getPayoutStatus(),
                order.getCustomerChargeAmount(),
                payout.getAmount(),
                payout.getCurrencyCode(),
                firstNonBlank(payout.getEligibleAt(), payout.getCreatedAt()),
                "Settlement visibility is admin-safe and excludes PayPal batch payload details."
        );
    }

    private PaymentOrder resolveOrder(String paymentAuthorizationId, String checkoutId) {
        if (!isBlank(paymentAuthorizationId)) {
            Optional<PaymentOrder> byPublicId = paymentOrderRepository.findByPublicId(paymentAuthorizationId);
            if (byPublicId.isPresent()) {
                return byPublicId.get();
            }
            Optional<PaymentOrder> byCheckoutId = paymentOrderRepository.findByMarketplaceOrderPublicId(paymentAuthorizationId);
            if (byCheckoutId.isPresent()) {
                return byCheckoutId.get();
            }
        }
        if (!isBlank(checkoutId)) {
            return findOrderByCheckoutId(checkoutId);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentAuthorizationId or checkoutId is required");
    }

    private PaymentOrder findOrderByCheckoutId(String checkoutId) {
        return paymentOrderRepository.findByMarketplaceOrderPublicId(checkoutId)
                .filter(this::isPayPalOrder)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No persisted PayPal marketplace payment order exists for checkoutId=" + checkoutId));
    }

    private List<String> supportedCountries() {
        List<String> countries = paymentGatewayPolicyRepository.findAllByOrderByCountryCodeAsc().stream()
                .filter(PaymentGatewayPolicy::isActive)
                .filter(policy -> containsIgnoreCase(policy.getGatewayMode(), "paypal"))
                .map(PaymentGatewayPolicy::getCountryCode)
                .filter(Objects::nonNull)
                .map(code -> code.trim().toUpperCase(Locale.ROOT))
                .toList();
        return countries.isEmpty() ? List.of(DEFAULT_COUNTRY) : countries;
    }

    private List<String> payPalSellerIds() {
        LinkedHashSet<String> sellerIds = new LinkedHashSet<>();
        paymentOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(this::isPayPalOrder)
                .filter(order -> !order.isConsolidatedCheckout())
                .map(PaymentOrder::getProviderAccountPublicId)
                .filter(value -> !isBlank(value))
                .forEach(sellerIds::add);
        providerPayoutRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(this::isPayPalPayout)
                .map(ProviderPayout::getProviderAccountPublicId)
                .filter(value -> !isBlank(value))
                .forEach(sellerIds::add);
        if (sellerIds.isEmpty()) {
            sellerIds.add(UNKNOWN_PROVIDER_ACCOUNT);
        }
        return List.copyOf(sellerIds);
    }

    private String resolveSellerAccountId(String sellerId) {
        return isBlank(sellerId) ? payPalSellerIds().get(0) : sellerId;
    }

    private String requireAuthenticatedSellerId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated seller context is required");
        }
        String sellerId = jwt.getClaimAsString("uid");
        if (isBlank(sellerId)) {
            sellerId = jwt.getSubject();
        }
        if (isBlank(sellerId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated seller identifier is missing");
        }
        return sellerId.trim();
    }

    private SellerSnapshot sellerSnapshot(String sellerId) {
        String resolvedSellerId = resolveSellerAccountId(sellerId);
        PaymentOrder latestOrder = paymentOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(this::isPayPalOrder)
                .filter(order -> !order.isConsolidatedCheckout())
                .filter(order -> resolvedSellerId.equals(order.getProviderAccountPublicId()))
                .findFirst()
                .orElse(null);
        ProviderPayout latestPayout = providerPayoutRepository.findByProviderAccountPublicIdOrderByCreatedAtDesc(resolvedSellerId)
                .stream()
                .filter(this::isPayPalPayout)
                .findFirst()
                .orElse(null);
        String country = supportedCountries().get(0);
        return new SellerSnapshot(latestOrder, latestPayout, country);
    }

    private List<PaymentWebhookEvent> payPalEvents() {
        return paymentWebhookEventRepository.findAll().stream()
                .filter(event -> containsIgnoreCase(event.getPaymentProvider(), "paypal"))
                .sorted(Comparator.comparing(PaymentWebhookEvent::getReceivedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private boolean isPayPalDispute(Dispute dispute) {
        return paymentOrderRepository.findByMarketplaceOrderPublicId(dispute.getOrderId())
                .map(this::isPayPalOrder)
                .orElse(false);
    }

    private boolean isPayPalOrder(PaymentOrder order) {
        return containsIgnoreCase(order.getPaymentProvider(), "paypal");
    }

    private boolean isPayPalPayout(ProviderPayout payout) {
        return containsIgnoreCase(payout.getPaymentProvider(), "paypal")
                || isPayPalOrder(payout.getPaymentOrder());
    }

    private boolean isBlockedPayout(ProviderPayout payout) {
        return firstNonBlank(payout.getPayoutStatus(), "").startsWith("BLOCKED");
    }

    private boolean isConfigured() {
        return !isBlank(payPalConfig.getClientId()) && !isBlank(payPalConfig.getClientSecret());
    }

    private boolean isWebhookVerificationConfigured() {
        String webhookId = System.getenv("PAYPAL_WEBHOOK_ID");
        return !isBlank(webhookId);
    }

    private boolean isSandboxMode() {
        return !"LIVE".equalsIgnoreCase(payPalConfig.getMode());
    }

    private String normalizedMode() {
        return firstNonBlank(payPalConfig.getMode(), "SANDBOX").toUpperCase(Locale.ROOT);
    }

    private String buildApproveUrl(PaymentOrder order) {
        String host = isSandboxMode() ? "https://www.sandbox.paypal.com/checkoutnow?token="
                : "https://www.paypal.com/checkoutnow?token=";
        return host + firstNonBlank(order.getProviderPaymentReference(), order.getPublicId());
    }

    private boolean requiresBuyerRedirect(PaymentOrder order) {
        return !"CAPTURED".equalsIgnoreCase(order.getPaymentStatus());
    }

    private String mapOrderCreationStatus(PaymentOrder order) {
        return "CAPTURED".equalsIgnoreCase(order.getPaymentStatus()) ? "READY_FOR_STATUS_CHECK" : order.getPaymentStatus();
    }

    private String mapAuthorizationStatus(PaymentOrder order) {
        String paymentStatus = firstNonBlank(order.getPaymentStatus(), "UNKNOWN");
        if ("CAPTURED".equalsIgnoreCase(paymentStatus)) {
            return "CAPTURED";
        }
        if ("DISPUTED".equalsIgnoreCase(paymentStatus)) {
            return "CAPTURED_UNDER_DISPUTE";
        }
        if ("REFUNDED".equalsIgnoreCase(paymentStatus)) {
            return "REFUNDED";
        }
        if ("CANCELLED".equalsIgnoreCase(paymentStatus)) {
            return "CANCELLED";
        }
        return paymentStatus;
    }

    private String relatedEntityType(String eventType) {
        String normalized = firstNonBlank(eventType, "UNKNOWN").toLowerCase(Locale.ROOT);
        if (normalized.contains("capture")) {
            return "PAYMENT_CAPTURE";
        }
        if (normalized.contains("checkout") || normalized.contains("order")) {
            return "PAYMENT_ORDER";
        }
        return "PAYPAL_EVENT";
    }

    private String orderRoute(PaymentOrder order) {
        return "/orders/" + order.getMarketplaceOrderPublicId();
    }

    private String statusRoute(PaymentOrder order) {
        return "/payments/paypal/status/" + order.getPublicId();
    }

    private LocalDateTime latestTimestamp(PaymentOrder order, ProviderPayout payout) {
        LocalDateTime orderTime = order == null ? null : order.getUpdatedAt();
        LocalDateTime payoutTime = payout == null ? null : payout.getUpdatedAt();
        if (orderTime == null) {
            return payoutTime;
        }
        if (payoutTime == null) {
            return orderTime;
        }
        return orderTime.isAfter(payoutTime) ? orderTime : payoutTime;
    }

    private String maskReference(String value) {
        if (isBlank(value)) {
            return "UNAVAILABLE";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= 6) {
            return "***" + trimmed.substring(Math.max(0, trimmed.length() - 2));
        }
        return trimmed.substring(0, 3) + "***" + trimmed.substring(trimmed.length() - 3);
    }

    private String requireValue(String value, String message) {
        if (isBlank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private boolean containsIgnoreCase(String value, String fragment) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(fragment.toLowerCase(Locale.ROOT));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String firstNonBlank(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private BigDecimal firstNonBlank(BigDecimal value, BigDecimal fallback) {
        return value == null ? fallback : value;
    }

    private LocalDateTime firstNonBlank(LocalDateTime value, LocalDateTime fallback) {
        return value == null ? fallback : value;
    }

    private record SellerSnapshot(PaymentOrder latestOrder, ProviderPayout latestPayout, String country) {
    }
}