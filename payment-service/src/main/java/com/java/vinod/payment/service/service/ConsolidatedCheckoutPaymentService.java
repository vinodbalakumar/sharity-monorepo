package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.dto.CheckoutPaymentDtos;
import com.java.vinod.payment.service.entity.CheckoutPayment;
import com.java.vinod.payment.service.entity.CheckoutPaymentAllocation;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.entity.PaymentTransaction;
import com.java.vinod.payment.service.gateway.PaymentGatewayRegistry;
import com.java.vinod.payment.service.repository.CheckoutPaymentAllocationRepository;
import com.java.vinod.payment.service.repository.CheckoutPaymentRepository;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Owns consolidated multi-seller checkout payments: one buyer charge, internal ledger allocations,
 * and ledger-only payout eligibility. No provider transfer is ever requested from this flow.
 *
 * <p>Charge durability: the parent ledger and allocations are committed in {@code CAPTURE_PENDING}
 * before the gateway is called, the gateway is always called with an idempotency key derived only
 * from the checkout id, and capture completion is applied under a row lock. If the gateway succeeds
 * but the completion transaction rolls back, a retry reuses the same key so the gateway can
 * deduplicate the charge.</p>
 */
@Service
public class ConsolidatedCheckoutPaymentService {
    static final BigDecimal PLATFORM_FEE_RATE = BigDecimal.valueOf(0.05);
    static final String PAYOUT_MODE_LEDGER_ONLY = "LEDGER_ONLY";
    static final String PARENT_PROVIDER_ACCOUNT = "CONSOLIDATED_MULTI_SELLER";
    static final int MAX_ALLOCATIONS = 100;
    private static final int MAX_RESERVATION_ATTEMPTS = 3;
    private static final int MAX_REASON_LENGTH = 255;
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("9999999999.99");
    private static final Pattern IDENTIFIER = Pattern.compile("[A-Za-z0-9][A-Za-z0-9_-]{0,35}");
    private static final Pattern CURRENCY = Pattern.compile("[A-Z]{3}");
    private static final Pattern COUNTRY = Pattern.compile("[A-Z]{2}");
    private static final Logger log = LoggerFactory.getLogger(ConsolidatedCheckoutPaymentService.class);

    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CheckoutPaymentRepository checkoutPaymentRepository;
    private final CheckoutPaymentAllocationRepository allocationRepository;
    private final PaymentGatewayRegistry paymentGatewayRegistry;
    private final PaymentEventOutboxService paymentEventOutboxService;
    private final TransactionTemplate requiresNew;

    public ConsolidatedCheckoutPaymentService(PaymentOrderRepository paymentOrderRepository,
                                              PaymentTransactionRepository paymentTransactionRepository,
                                              CheckoutPaymentRepository checkoutPaymentRepository,
                                              CheckoutPaymentAllocationRepository allocationRepository,
                                              PaymentGatewayRegistry paymentGatewayRegistry,
                                              PaymentEventOutboxService paymentEventOutboxService,
                                              PlatformTransactionManager transactionManager) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.checkoutPaymentRepository = checkoutPaymentRepository;
        this.allocationRepository = allocationRepository;
        this.paymentGatewayRegistry = paymentGatewayRegistry;
        this.paymentEventOutboxService = paymentEventOutboxService;
        this.requiresNew = new TransactionTemplate(transactionManager);
        this.requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Captures one buyer charge for the checkout, or replays the existing result for an identical retry.
     */
    public CheckoutPaymentDtos.CheckoutPaymentResponse createCheckoutPayment(CheckoutPaymentDtos.CreateCheckoutPaymentRequest request) {
        NormalizedCheckout checkout = validate(request);
        Reservation reservation = reserve(checkout);
        if (CheckoutPayment.STATUS_CAPTURED.equals(reservation.checkoutStatus())) {
            log.info("Consolidated checkout replayed: checkoutPublicId={}", checkout.checkoutPublicId());
            return requiresNew.execute(status -> toResponse(checkoutPaymentRepository
                    .findByCheckoutPublicId(checkout.checkoutPublicId()).orElseThrow()));
        }
        String reference = paymentGatewayRegistry.capture(reservation.gatewayMode(), reservation.gatewayIdempotencyKey(),
                checkout.amount(), checkout.currencyCode());
        if (reference == null || reference.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment confirmation unavailable");
        }
        return completeCapture(checkout.checkoutPublicId(), reference);
    }

    /**
     * Returns the aggregate charge and allocation ledger state for a checkout.
     */
    @Transactional(readOnly = true)
    public CheckoutPaymentDtos.CheckoutPaymentResponse checkoutPayment(String checkoutPublicId) {
        CheckoutPayment checkoutPayment = checkoutPaymentRepository.findByCheckoutPublicId(checkoutPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout payment not found"));
        return toResponse(checkoutPayment);
    }
    /**
     * Marks one allocation eligible in the internal ledger only. Never requests a provider payout.
     */
    @Transactional
    public CheckoutPaymentDtos.CheckoutAllocationResponse markAllocationPayoutEligible(String checkoutPublicId,
                                                                                      String marketplaceOrderPublicId) {
        CheckoutPayment checkoutPayment = lockCapturedCheckout(checkoutPublicId);
        CheckoutPaymentAllocation allocation = allocation(checkoutPayment, marketplaceOrderPublicId);
        String status = allocation.getAllocationStatus();
        if (CheckoutPaymentAllocation.STATUS_ELIGIBLE_LEDGER_ONLY.equals(status)) {
            return toAllocationResponse(checkoutPayment, allocation);
        }
        if (!CheckoutPaymentAllocation.STATUS_HELD.equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Allocation is not eligible for payout");
        }
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
        allocation.setAllocationStatus(CheckoutPaymentAllocation.STATUS_ELIGIBLE_LEDGER_ONLY);
        allocation.setHoldReason("Ledger-only eligibility; provider transfer not enabled");
        allocation.setEligibleAt(now);
        allocation.setUpdatedAt(now);
        log.info("Consolidated allocation marked ledger-eligible: checkoutPublicId={}, marketplaceOrderPublicId={}, providerAccountPublicId={}",
                checkoutPublicId, marketplaceOrderPublicId, allocation.getProviderAccountPublicId());
        return toAllocationResponse(checkoutPayment, allocation);
    }

    /**
     * Places a persisted ledger dispute hold on one allocation without moving money.
     */
    @Transactional
    public CheckoutPaymentDtos.CheckoutAllocationResponse disputeAllocation(String checkoutPublicId,
                                                                           String marketplaceOrderPublicId,
                                                                           CheckoutPaymentDtos.AllocationDisputeRequest request) {
        String reason = request == null || request.reason() == null || request.reason().isBlank()
                ? "Dispute opened" : request.reason().trim();
        if (reason.length() > MAX_REASON_LENGTH) {
            throw badRequest("Dispute reason is too long");
        }
        CheckoutPayment checkoutPayment = lockCapturedCheckout(checkoutPublicId);
        CheckoutPaymentAllocation allocation = allocation(checkoutPayment, marketplaceOrderPublicId);
        String status = allocation.getAllocationStatus();
        if (CheckoutPaymentAllocation.STATUS_DISPUTE_HOLD.equals(status)) {
            return toAllocationResponse(checkoutPayment, allocation);
        }
        if (!CheckoutPaymentAllocation.STATUS_HELD.equals(status)
                && !CheckoutPaymentAllocation.STATUS_ELIGIBLE_LEDGER_ONLY.equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Allocation cannot be disputed in its current state");
        }
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
        allocation.setAllocationStatus(CheckoutPaymentAllocation.STATUS_DISPUTE_HOLD);
        allocation.setHoldReason("Dispute hold");
        allocation.setDisputeReason(reason);
        allocation.setDisputedAt(now);
        allocation.setUpdatedAt(now);
        log.warn("Consolidated allocation dispute hold: checkoutPublicId={}, marketplaceOrderPublicId={}, providerAccountPublicId={}",
                checkoutPublicId, marketplaceOrderPublicId, allocation.getProviderAccountPublicId());
        return toAllocationResponse(checkoutPayment, allocation);
    }

    /**
     * Rejects refund or cancellation of a consolidated checkout or one of its allocations before any mutation.
     */
    @Transactional(readOnly = true)
    public void rejectUnsupportedReversal(String checkoutPublicId, String marketplaceOrderPublicId, String operation) {
        CheckoutPayment checkoutPayment = checkoutPaymentRepository.findByCheckoutPublicId(checkoutPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout payment not found"));
        if (marketplaceOrderPublicId != null) {
            allocation(checkoutPayment, marketplaceOrderPublicId);
        }
        log.warn("Consolidated checkout {} rejected: checkoutPublicId={}, marketplaceOrderPublicId={}",
                operation, checkoutPublicId, marketplaceOrderPublicId);
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Consolidated checkout " + operation + " is not supported; ledger left unchanged");
    }

    private Reservation reserve(NormalizedCheckout checkout) {
        for (int attempt = 1; ; attempt++) {
            try {
                return requiresNew.execute(status -> reserveInTransaction(checkout));
            } catch (DataIntegrityViolationException | ConcurrencyFailureException exception) {
                Optional<Reservation> existing = requiresNew.execute(status -> checkoutPaymentRepository
                        .findByCheckoutPublicId(checkout.checkoutPublicId())
                        .map(found -> existingReservation(found, checkout)));
                if (existing != null && existing.isPresent()) {
                    return existing.get();
                }
                if (attempt >= MAX_RESERVATION_ATTEMPTS) {
                    log.warn("Consolidated checkout identity conflict: checkoutPublicId={}, reason={}",
                            checkout.checkoutPublicId(), exception.getClass().getSimpleName());
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout or allocation identity already in use");
                }
                pause(attempt);
            }
        }
    }

    private Reservation reserveInTransaction(NormalizedCheckout checkout) {
        Optional<CheckoutPayment> existing = checkoutPaymentRepository.findByCheckoutPublicId(checkout.checkoutPublicId());
        if (existing.isPresent()) {
            return existingReservation(existing.get(), checkout);
        }
        ensureIdentityAvailable(checkout);
        String gatewayMode = resolveGatewayMode(checkout);
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);

        PaymentOrder order = new PaymentOrder();
        order.setPublicId(UUID.randomUUID().toString());
        order.setMarketplaceOrderPublicId(checkout.checkoutPublicId());
        order.setCustomerUserPublicId(checkout.customerUserPublicId());
        order.setProviderAccountPublicId(PARENT_PROVIDER_ACCOUNT);
        order.setCurrencyCode(checkout.currencyCode());
        order.setCustomerChargeAmount(checkout.amount());
        order.setPlatformFeeAmount(checkout.platformFeeAmount());
        order.setProviderPayableAmount(checkout.providerPayableAmount());
        order.setPaymentProvider(gatewayMode);
        order.setPaymentStatus("PENDING");
        order.setPayoutEligibilityStatus(PAYOUT_MODE_LEDGER_ONLY);
        order.setOrderKind(PaymentOrder.ORDER_KIND_CONSOLIDATED_CHECKOUT);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        PaymentOrder savedOrder = paymentOrderRepository.saveAndFlush(order);

        CheckoutPayment checkoutPayment = new CheckoutPayment();
        checkoutPayment.setPublicId(UUID.randomUUID().toString());
        checkoutPayment.setCheckoutPublicId(checkout.checkoutPublicId());
        checkoutPayment.setPaymentOrder(savedOrder);
        checkoutPayment.setCustomerUserPublicId(checkout.customerUserPublicId());
        checkoutPayment.setCurrencyCode(checkout.currencyCode());
        checkoutPayment.setCustomerChargeAmount(checkout.amount());
        checkoutPayment.setPlatformFeeAmount(checkout.platformFeeAmount());
        checkoutPayment.setProviderPayableAmount(checkout.providerPayableAmount());
        checkoutPayment.setAllocationCount(checkout.allocations().size());
        checkoutPayment.setGatewayMode(gatewayMode);
        checkoutPayment.setGatewayIdempotencyKey(gatewayIdempotencyKey(checkout.checkoutPublicId()));
        checkoutPayment.setRequestFingerprint(checkout.fingerprint());
        checkoutPayment.setCheckoutStatus(CheckoutPayment.STATUS_CAPTURE_PENDING);
        checkoutPayment.setCreatedAt(now);
        checkoutPayment.setUpdatedAt(now);
        CheckoutPayment savedCheckout = checkoutPaymentRepository.saveAndFlush(checkoutPayment);

        List<CheckoutPaymentAllocation> allocations = new ArrayList<>();
        int lineNumber = 1;
        for (NormalizedAllocation line : checkout.allocations()) {
            CheckoutPaymentAllocation allocation = new CheckoutPaymentAllocation();
            allocation.setPublicId(UUID.randomUUID().toString());
            allocation.setCheckoutPayment(savedCheckout);
            allocation.setLineNumber(lineNumber++);
            allocation.setMarketplaceOrderPublicId(line.marketplaceOrderPublicId());
            allocation.setProviderAccountPublicId(line.providerAccountPublicId());
            allocation.setProviderCountryCode(line.providerCountryCode());
            allocation.setCurrencyCode(checkout.currencyCode());
            allocation.setCustomerChargeAmount(line.amount());
            allocation.setPlatformFeeAmount(line.platformFeeAmount());
            allocation.setProviderPayableAmount(line.providerPayableAmount());
            allocation.setAllocationStatus(CheckoutPaymentAllocation.STATUS_PENDING_CAPTURE);
            allocation.setHoldReason("Waiting for buyer charge capture");
            allocation.setCreatedAt(now);
            allocation.setUpdatedAt(now);
            allocations.add(allocation);
        }
        allocationRepository.saveAllAndFlush(allocations);
        log.info("Consolidated checkout reserved: checkoutPublicId={}, paymentOrderPublicId={}, allocations={}, amount={}, gatewayMode={}",
                checkout.checkoutPublicId(), savedOrder.getPublicId(), allocations.size(), checkout.amount(), gatewayMode);
        return new Reservation(savedCheckout.getCheckoutStatus(), gatewayMode, savedCheckout.getGatewayIdempotencyKey());
    }

    private Reservation existingReservation(CheckoutPayment existing, NormalizedCheckout checkout) {
        if (!existing.getRequestFingerprint().equals(checkout.fingerprint())) {
            log.warn("Consolidated checkout payload mismatch on retry: checkoutPublicId={}", checkout.checkoutPublicId());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout payment already exists with a different payload");
        }
        return new Reservation(existing.getCheckoutStatus(), existing.getGatewayMode(), existing.getGatewayIdempotencyKey());
    }
    private CheckoutPaymentDtos.CheckoutPaymentResponse completeCapture(String checkoutPublicId, String reference) {
        return requiresNew.execute(status -> {
            CheckoutPayment checkoutPayment = checkoutPaymentRepository.findForUpdateByCheckoutPublicId(checkoutPublicId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout payment not found"));
            if (CheckoutPayment.STATUS_CAPTURED.equals(checkoutPayment.getCheckoutStatus())) {
                return toResponse(checkoutPayment);
            }
            LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
            PaymentOrder order = checkoutPayment.getPaymentOrder();
            checkoutPayment.setProviderPaymentReference(reference);
            checkoutPayment.setCheckoutStatus(CheckoutPayment.STATUS_CAPTURED);
            checkoutPayment.setCapturedAt(now);
            checkoutPayment.setUpdatedAt(now);
            order.setProviderPaymentReference(reference);
            order.setPaymentStatus("CAPTURED");
            order.setUpdatedAt(now);

            PaymentTransaction transaction = new PaymentTransaction();
            transaction.setPublicId(UUID.randomUUID().toString());
            transaction.setPaymentOrder(order);
            transaction.setTransactionType("CAPTURE");
            transaction.setAmount(order.getCustomerChargeAmount());
            transaction.setCurrencyCode(order.getCurrencyCode());
            transaction.setProviderTransactionReference(reference);
            transaction.setTransactionStatus("SUCCEEDED");
            transaction.setCreatedAt(now);
            paymentTransactionRepository.save(transaction);

            List<CheckoutPaymentAllocation> allocations = allocationRepository
                    .findByCheckoutPayment_IdOrderByLineNumberAsc(checkoutPayment.getId());
            for (CheckoutPaymentAllocation allocation : allocations) {
                allocation.setAllocationStatus(CheckoutPaymentAllocation.STATUS_HELD);
                allocation.setHoldReason("Waiting for customer acceptance");
                allocation.setUpdatedAt(now);
            }
            paymentEventOutboxService.queueWalletEvent("payment-captured", order, order.getCustomerUserPublicId(),
                    order.getCustomerChargeAmount());
            for (CheckoutPaymentAllocation allocation : allocations) {
                paymentEventOutboxService.queueAllocationWalletEvent("provider-pending-earning", allocation.getPublicId(),
                        order, allocation.getMarketplaceOrderPublicId(), allocation.getProviderAccountPublicId(),
                        allocation.getProviderPayableAmount());
            }
            log.info("Consolidated checkout captured: checkoutPublicId={}, paymentOrderPublicId={}, allocations={}, amount={}",
                    checkoutPublicId, order.getPublicId(), allocations.size(), order.getCustomerChargeAmount());
            return toResponse(checkoutPayment, allocations);
        });
    }

    private void ensureIdentityAvailable(NormalizedCheckout checkout) {
        String checkoutPublicId = checkout.checkoutPublicId();
        if (paymentOrderRepository.findByMarketplaceOrderPublicId(checkoutPublicId).isPresent()
                || allocationRepository.existsByMarketplaceOrderPublicId(checkoutPublicId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout identity already in use");
        }
        for (NormalizedAllocation allocation : checkout.allocations()) {
            String orderId = allocation.marketplaceOrderPublicId();
            if (paymentOrderRepository.findByMarketplaceOrderPublicId(orderId).isPresent()
                    || allocationRepository.existsByMarketplaceOrderPublicId(orderId)
                    || checkoutPaymentRepository.existsByCheckoutPublicId(orderId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Marketplace order already has a payment");
            }
        }
    }

    private String resolveGatewayMode(NormalizedCheckout checkout) {
        Set<String> modes = new HashSet<>();
        for (NormalizedAllocation allocation : checkout.allocations()) {
            modes.add(paymentGatewayRegistry.resolveGatewayMode(allocation.providerCountryCode()));
        }
        if (modes.size() != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout allocations resolve to different payment gateways");
        }
        return modes.iterator().next();
    }

    private CheckoutPayment lockCapturedCheckout(String checkoutPublicId) {
        CheckoutPayment checkoutPayment = checkoutPaymentRepository.findForUpdateByCheckoutPublicId(checkoutPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout payment not found"));
        if (!CheckoutPayment.STATUS_CAPTURED.equals(checkoutPayment.getCheckoutStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout payment is not captured");
        }
        return checkoutPayment;
    }

    private CheckoutPaymentAllocation allocation(CheckoutPayment checkoutPayment, String marketplaceOrderPublicId) {
        return allocationRepository.findByCheckoutPayment_IdAndMarketplaceOrderPublicId(checkoutPayment.getId(), marketplaceOrderPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout allocation not found"));
    }

    /**
     * Derives the gateway idempotency key only from the checkout identity so every retry reuses it.
     */
    static String gatewayIdempotencyKey(String checkoutPublicId) {
        return UUID.nameUUIDFromBytes(("consolidated-checkout-capture:" + checkoutPublicId)
                .getBytes(StandardCharsets.UTF_8)).toString();
    }

    /**
     * Applies the marketplace per-line platform fee rule: 5% of the item amount, half-up to cents.
     */
    static BigDecimal platformFee(BigDecimal itemAmount) {
        return itemAmount.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    NormalizedCheckout validate(CheckoutPaymentDtos.CreateCheckoutPaymentRequest request) {
        if (request == null) {
            throw badRequest("Checkout payment request is required");
        }
        String checkoutPublicId = identifier(request.checkoutPublicId(), "checkoutPublicId");
        String customerUserPublicId = identifier(request.customerUserPublicId(), "customerUserPublicId");
        String currencyCode = request.currencyCode() == null ? "" : request.currencyCode().trim();
        if (!CURRENCY.matcher(currencyCode).matches()) {
            throw badRequest("currencyCode must be an ISO 4217 uppercase code");
        }
        BigDecimal amount = money(request.amount(), "amount", true);
        BigDecimal platformFeeAmount = money(request.platformFeeAmount(), "platformFeeAmount", false);
        BigDecimal providerPayableAmount = money(request.providerPayableAmount(), "providerPayableAmount", true);
        List<CheckoutPaymentDtos.AllocationRequest> lines = request.allocations();
        if (lines == null || lines.isEmpty()) {
            throw badRequest("At least one allocation is required");
        }
        if (lines.size() > MAX_ALLOCATIONS) {
            throw badRequest("Too many allocations");
        }
        Set<String> orderIds = new HashSet<>();
        List<NormalizedAllocation> allocations = new ArrayList<>();
        BigDecimal amountSum = BigDecimal.ZERO;
        BigDecimal feeSum = BigDecimal.ZERO;
        BigDecimal payableSum = BigDecimal.ZERO;
        for (CheckoutPaymentDtos.AllocationRequest line : lines) {
            if (line == null) {
                throw badRequest("Allocation entries must not be null");
            }
            String orderId = identifier(line.marketplaceOrderPublicId(), "allocations.marketplaceOrderPublicId");
            if (orderId.equals(checkoutPublicId) || !orderIds.add(orderId)) {
                throw badRequest("Allocation marketplace order ids must be unique and differ from the checkout id");
            }
            String providerAccountPublicId = identifier(line.providerAccountPublicId(), "allocations.providerAccountPublicId");
            String country = line.providerCountryCode() == null ? "" : line.providerCountryCode().trim().toUpperCase(Locale.ROOT);
            if (!COUNTRY.matcher(country).matches()) {
                throw badRequest("allocations.providerCountryCode must be an ISO 3166 alpha-2 code");
            }
            BigDecimal lineAmount = money(line.amount(), "allocations.amount", true);
            BigDecimal lineFee = money(line.platformFeeAmount(), "allocations.platformFeeAmount", false);
            BigDecimal linePayable = money(line.providerPayableAmount(), "allocations.providerPayableAmount", true);
            if (lineFee.compareTo(platformFee(lineAmount)) != 0) {
                throw badRequest("Allocation platform fee must equal 5% of the item amount rounded half-up");
            }
            if (lineAmount.compareTo(lineFee.add(linePayable)) != 0) {
                throw badRequest("Allocation amount must equal platform fee plus provider payable amount");
            }
            amountSum = amountSum.add(lineAmount);
            feeSum = feeSum.add(lineFee);
            payableSum = payableSum.add(linePayable);
            allocations.add(new NormalizedAllocation(orderId, providerAccountPublicId, country, lineAmount, lineFee, linePayable));
        }
        if (amount.compareTo(platformFeeAmount.add(providerPayableAmount)) != 0) {
            throw badRequest("Checkout amount must equal platform fee plus provider payable amount");
        }
        if (amountSum.compareTo(amount) != 0 || feeSum.compareTo(platformFeeAmount) != 0
                || payableSum.compareTo(providerPayableAmount) != 0) {
            throw badRequest("Allocation totals must reconcile exactly with checkout totals");
        }
        String fingerprint = fingerprint(checkoutPublicId, customerUserPublicId, currencyCode, amount,
                platformFeeAmount, providerPayableAmount, allocations);
        return new NormalizedCheckout(checkoutPublicId, customerUserPublicId, currencyCode, amount, platformFeeAmount,
                providerPayableAmount, List.copyOf(allocations), fingerprint);
    }
    private String identifier(String value, String field) {
        String trimmed = value == null ? "" : value.trim();
        if (!IDENTIFIER.matcher(trimmed).matches()) {
            throw badRequest(field + " must be an identifier of 1-36 letters, digits, '-' or '_'");
        }
        return trimmed;
    }

    private BigDecimal money(BigDecimal value, String field, boolean positive) {
        if (value == null) {
            throw badRequest(field + " is required");
        }
        if (value.stripTrailingZeros().scale() > 2) {
            throw badRequest(field + " must have at most two decimal places");
        }
        int sign = value.signum();
        if (sign < 0 || (positive && sign == 0)) {
            throw badRequest(field + (positive ? " must be positive" : " must not be negative"));
        }
        if (value.compareTo(MAX_AMOUNT) > 0) {
            throw badRequest(field + " exceeds the supported maximum");
        }
        return value.setScale(2, RoundingMode.UNNECESSARY);
    }

    private String fingerprint(String checkoutPublicId, String customerUserPublicId, String currencyCode, BigDecimal amount,
                               BigDecimal platformFeeAmount, BigDecimal providerPayableAmount,
                               List<NormalizedAllocation> allocations) {
        StringBuilder canonical = new StringBuilder()
                .append(checkoutPublicId).append('|').append(customerUserPublicId).append('|').append(currencyCode)
                .append('|').append(amount.toPlainString()).append('|').append(platformFeeAmount.toPlainString())
                .append('|').append(providerPayableAmount.toPlainString());
        allocations.stream()
                .sorted(Comparator.comparing(NormalizedAllocation::marketplaceOrderPublicId))
                .forEach(line -> canonical.append("||").append(line.marketplaceOrderPublicId())
                        .append('|').append(line.providerAccountPublicId()).append('|').append(line.providerCountryCode())
                        .append('|').append(line.amount().toPlainString())
                        .append('|').append(line.platformFeeAmount().toPlainString())
                        .append('|').append(line.providerPayableAmount().toPlainString()));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private CheckoutPaymentDtos.CheckoutPaymentResponse toResponse(CheckoutPayment checkoutPayment) {
        return toResponse(checkoutPayment, allocationRepository.findByCheckoutPayment_IdOrderByLineNumberAsc(checkoutPayment.getId()));
    }

    private CheckoutPaymentDtos.CheckoutPaymentResponse toResponse(CheckoutPayment checkoutPayment,
                                                                  List<CheckoutPaymentAllocation> allocations) {
        List<CheckoutPaymentDtos.CheckoutAllocationResponse> lines = allocations.stream()
                .map(allocation -> toAllocationResponse(checkoutPayment, allocation))
                .toList();
        Set<String> statuses = new HashSet<>();
        lines.forEach(line -> statuses.add(line.allocationStatus()));
        String aggregate = statuses.size() == 1 ? statuses.iterator().next() : "MIXED";
        PaymentOrder order = checkoutPayment.getPaymentOrder();
        return new CheckoutPaymentDtos.CheckoutPaymentResponse(checkoutPayment.getCheckoutPublicId(), order.getPublicId(),
                checkoutPayment.getCustomerUserPublicId(), checkoutPayment.getCurrencyCode(),
                checkoutPayment.getCustomerChargeAmount(), checkoutPayment.getPlatformFeeAmount(),
                checkoutPayment.getProviderPayableAmount(), checkoutPayment.getCheckoutStatus(), order.getPaymentStatus(),
                aggregate, PAYOUT_MODE_LEDGER_ONLY, lines, checkoutPayment.getCapturedAt(),
                checkoutPayment.getCreatedAt(), checkoutPayment.getUpdatedAt());
    }

    private CheckoutPaymentDtos.CheckoutAllocationResponse toAllocationResponse(CheckoutPayment checkoutPayment,
                                                                               CheckoutPaymentAllocation allocation) {
        return new CheckoutPaymentDtos.CheckoutAllocationResponse(allocation.getPublicId(), checkoutPayment.getCheckoutPublicId(),
                allocation.getMarketplaceOrderPublicId(), allocation.getProviderAccountPublicId(),
                allocation.getProviderCountryCode(), allocation.getCurrencyCode(), allocation.getCustomerChargeAmount(),
                allocation.getPlatformFeeAmount(), allocation.getProviderPayableAmount(), allocation.getAllocationStatus(),
                allocation.getHoldReason(), allocation.getDisputeReason(), allocation.getEligibleAt(),
                allocation.getDisputedAt(), allocation.getUpdatedAt());
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }

    private static void pause(int attempt) {
        try {
            Thread.sleep(50L * attempt);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Checkout payment reservation interrupted");
        }
    }

    record NormalizedCheckout(String checkoutPublicId, String customerUserPublicId, String currencyCode,
                              BigDecimal amount, BigDecimal platformFeeAmount, BigDecimal providerPayableAmount,
                              List<NormalizedAllocation> allocations, String fingerprint) {
    }

    record NormalizedAllocation(String marketplaceOrderPublicId, String providerAccountPublicId,
                                String providerCountryCode, BigDecimal amount, BigDecimal platformFeeAmount,
                                BigDecimal providerPayableAmount) {
    }

    private record Reservation(String checkoutStatus, String gatewayMode, String gatewayIdempotencyKey) {
    }
}