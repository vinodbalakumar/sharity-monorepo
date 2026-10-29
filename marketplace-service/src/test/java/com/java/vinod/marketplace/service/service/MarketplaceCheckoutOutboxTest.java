package com.java.vinod.marketplace.service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import com.java.vinod.marketplace.service.entity.MarketplaceEventOutbox;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.MarketplaceEventOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies consolidated checkout payment commands use the aggregate payment contract and are ordered after creation.
 */
class MarketplaceCheckoutOutboxTest {
    private final MarketplaceEventOutboxRepository repository = mock(MarketplaceEventOutboxRepository.class);
    private final Map<String, MarketplaceEventOutbox> events = new LinkedHashMap<>();
    private final List<String> postedUris = new ArrayList<>();
    private final List<Object> postedBodies = new ArrayList<>();
    private final AtomicLong sequence = new AtomicLong(1);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private boolean paymentAvailable = true;
    private MarketplaceEventOutboxService service;
    private MarketplaceCheckout checkout;
    private OrderHeader first;
    private OrderHeader second;

    @BeforeEach
    void setUp() {
        PlatformTransactionManager transactionManager = mock(PlatformTransactionManager.class);
        when(transactionManager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));
        service = new MarketplaceEventOutboxService(repository, objectMapper, transactionManager,
                "http://payment-service:8080/payment-service", "internal-token") {
            @Override
            protected void post(String uri, Object body) {
                if (!paymentAvailable) {
                    throw new IllegalStateException("payment unavailable");
                }
                postedUris.add(uri);
                postedBodies.add(body);
            }
        };
        when(repository.findByEventId(anyString())).thenAnswer(inv -> events.values().stream()
                .filter(event -> event.getEventId().equals(inv.getArgument(0))).findFirst());
        when(repository.save(any())).thenAnswer(inv -> {
            MarketplaceEventOutbox event = inv.getArgument(0);
            if (event.getId() == null) {
                event.setId(sequence.getAndIncrement());
            }
            events.put(event.getEventId(), event);
            return event;
        });
        when(repository.findForDispatchById(anyLong())).thenAnswer(inv -> events.values().stream()
                .filter(event -> event.getId().equals(inv.getArgument(0))).findFirst());
        when(repository.findDueEvents(any(), any(), any())).thenAnswer(inv -> {
            List<String> statuses = new ArrayList<>(inv.<java.util.Collection<String>>getArgument(0));
            return events.values().stream().filter(event -> statuses.contains(event.getProcessingStatus()))
                    .sorted(Comparator.comparing(MarketplaceEventOutbox::getId)).toList();
        });

        checkout = new MarketplaceCheckout();
        checkout.setPublicId("checkout-1");
        checkout.setCustomerUserPublicId("buyer");
        checkout.setCurrencyCode("USD");
        checkout.setItemAmount(new BigDecimal("53.96"));
        checkout.setCustomerTotalAmount(new BigDecimal("53.96"));
        checkout.setPlatformFeeAmount(new BigDecimal("2.70"));
        checkout.setProviderAmount(new BigDecimal("51.26"));
        first = child("order-1", "store-1", "39.98", "2.00", "37.98");
        second = child("order-2", "store-2", "13.98", "0.70", "13.28");
    }

    @Test
    void retryableCreateCommandsExplainAMissingPayment() {
        MarketplaceEventOutbox event = new MarketplaceEventOutbox();
        event.setEventId(UUID.nameUUIDFromBytes(
                (MarketplaceEventOutboxService.EVENT_CREATE_CHECKOUT_PAYMENT + ":checkout-1").getBytes()).toString());
        events.put(event.getEventId(), event);
        for (String pending : List.of("PENDING", "PROCESSING", "FAILED")) {
            event.setProcessingStatus(pending);
            assertThat(service.isCheckoutPaymentCreatePending("checkout-1")).isTrue();
        }
        for (String completed : List.of("PROCESSED")) {
            event.setProcessingStatus(completed);
            assertThat(service.isCheckoutPaymentCreatePending("checkout-1")).isFalse();
        }
        assertThat(service.isCheckoutPaymentCreatePending("other-checkout")).isFalse();
    }

    @Test
    void createsOneAggregatePaymentCommandWithExactAllocations() throws Exception {
        service.queueCheckoutPaymentCreate(checkout, List.of(first, second));
        assertThat(postedUris).isEmpty();
        service.dispatchPendingEvents();

        assertThat(events).hasSize(1);
        MarketplaceEventOutbox event = events.values().iterator().next();
        assertThat(event.getEventType()).isEqualTo("payment-checkout-create-requested");
        assertThat(event.getAggregateType()).isEqualTo("MARKETPLACE_CHECKOUT");
        assertThat(event.getAggregatePublicId()).isEqualTo("checkout-1");
        assertThat(event.getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED);
        assertThat(postedUris).containsExactly("http://payment-service:8080/payment-service/payments/checkouts");

        JsonNode body = objectMapper.readTree(objectMapper.writeValueAsString(postedBodies.get(0)));
        assertThat(body.get("checkoutPublicId").asText()).isEqualTo("checkout-1");
        assertThat(body.get("customerUserPublicId").asText()).isEqualTo("buyer");
        assertThat(body.get("currencyCode").asText()).isEqualTo("USD");
        assertThat(body.get("amount").decimalValue()).isEqualByComparingTo("53.96");
        assertThat(body.get("platformFeeAmount").decimalValue()).isEqualByComparingTo("2.70");
        assertThat(body.get("providerPayableAmount").decimalValue()).isEqualByComparingTo("51.26");
        JsonNode allocation = body.get("allocations").get(0);
        assertThat(body.get("allocations")).hasSize(2);
        assertThat(allocation.get("marketplaceOrderPublicId").asText()).isEqualTo("order-1");
        assertThat(allocation.get("providerAccountPublicId").asText()).isEqualTo("store-1");
        assertThat(allocation.get("providerCountryCode").asText()).isEqualTo("US");
        assertThat(allocation.get("amount").decimalValue()).isEqualByComparingTo("39.98");
        assertThat(allocation.get("platformFeeAmount").decimalValue()).isEqualByComparingTo("2.00");
        assertThat(allocation.get("providerPayableAmount").decimalValue()).isEqualByComparingTo("37.98");

        service.queueCheckoutPaymentCreate(checkout, List.of(first, second));
        assertThat(postedUris).hasSize(1);
    }

    @Test
    void allocationsThatDoNotReconcileAreRejectedBeforeQueueing() {
        second.setPlatformFeeAmount(new BigDecimal("0.69"));
        assertThatThrownBy(() -> service.queueCheckoutPaymentCreate(checkout, List.of(first, second)))
                .isInstanceOf(IllegalStateException.class);
        assertThat(events).isEmpty();
    }

    @Test
    void allocationLifecycleWaitsForAggregateCreationThenUsesCheckoutPaths() throws Exception {
        paymentAvailable = false;
        service.queueCheckoutPaymentCreate(checkout, List.of(first, second));
        service.dispatchPendingEvents();
        paymentAvailable = true;
        // Simulate the scheduler not having retried the create yet by keeping it failed while lifecycle is queued.
        MarketplaceEventOutbox create = events.values().iterator().next();
        assertThat(create.getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_FAILED);
        create.setProcessingStatus("HOLD");

        service.queueCheckoutAllocationPayoutEligible(first);
        service.queueCheckoutAllocationDispute(second, "Item damaged");
        service.dispatchPendingEvents();
        assertThat(postedUris).isEmpty();
        assertThat(events.values()).filteredOn(event -> event.getEventType().startsWith("payment-checkout-allocation"))
                .allSatisfy(event -> assertThat(event.getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_FAILED));

        create.setProcessingStatus(MarketplaceEventOutboxService.STATUS_FAILED);
        events.values().forEach(event -> event.setNextAttemptAt(null));
        service.dispatchPendingEvents();

        assertThat(postedUris).containsExactly(
                "http://payment-service:8080/payment-service/payments/checkouts",
                "http://payment-service:8080/payment-service/payments/checkouts/checkout-1/allocations/order-1/mark-payout-eligible",
                "http://payment-service:8080/payment-service/payments/checkouts/checkout-1/allocations/order-2/dispute-request");
        assertThat(postedBodies.get(1)).isNull();
        JsonNode dispute = objectMapper.readTree(objectMapper.writeValueAsString(postedBodies.get(2)));
        assertThat(dispute.get("reason").asText()).isEqualTo("Item damaged");
        assertThat(postedUris).noneMatch(uri -> uri.contains("/payments/orders/"));
        assertThat(events.values()).allSatisfy(event ->
                assertThat(event.getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED));
    }

    @Test
    void allocationCommandsRequireAConsolidatedChild() {
        OrderHeader legacy = child("legacy", "store-1", "1.00", "0.05", "0.95");
        legacy.setCheckout(null);
        assertThatThrownBy(() -> service.queueCheckoutAllocationPayoutEligible(legacy)).isInstanceOf(IllegalStateException.class);
        assertThat(events).isEmpty();
        assertThat(postedUris).isEmpty();
    }

    private OrderHeader child(String publicId, String store, String amount, String fee, String payable) {
        OrderHeader order = new OrderHeader();
        order.setPublicId(publicId);
        order.setCheckout(checkout);
        order.setProviderAccountPublicId(store);
        order.setProviderCountryCode("US");
        order.setTransactionCurrencyCode("USD");
        order.setCustomerTotalAmount(new BigDecimal(amount));
        order.setItemAmount(new BigDecimal(amount));
        order.setPlatformFeeAmount(new BigDecimal(fee));
        order.setProviderExpectedAmount(new BigDecimal(payable));
        return order;
    }
}