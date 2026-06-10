package com.java.vinod.marketplace.service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Billing & Invoices Mock Controller
 * Provides mock billing, invoices, and payment management endpoints
 * For production, replace with real persistence layer
 */
@RestController
@RequestMapping("/api/v1/billing")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class BillingController {

    @GetMapping("/summary")
    public ResponseEntity<BillingResponse> getBillingSummary() {
        BillingResponse response = new BillingResponse(
                "ACTIVE",
                "COMPLETE",
                new BigDecimal("299.99"),
                "USD",
                LocalDate.now(),
                LocalDate.now().plusMonths(1),
                3,
                10
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices")
    public ResponseEntity<InvoiceListResponse> getInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        List<InvoiceResponse> invoices = generateMockInvoices();

        if (status != null) {
            invoices = invoices.stream()
                    .filter(inv -> inv.status().equalsIgnoreCase(status))
                    .toList();
        }

        InvoiceListResponse response = new InvoiceListResponse(
                invoices,
                invoices.size(),
                page,
                size,
                1
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceDetailResponse> getInvoiceDetails(
            @PathVariable String invoiceId) {

        InvoiceDetailResponse response = new InvoiceDetailResponse(
                invoiceId,
                "INV-001",
                LocalDate.of(2026, 5, 15),
                LocalDate.of(2026, 6, 15),
                LocalDate.of(2026, 5, 20),
                "PAID",
                "Premium Plan - Monthly Subscription",
                new BigDecimal("299.99"),
                new ArrayList<>(List.of(
                        new InvoiceLineItem(
                                "Premium Plan (1 month)",
                                1,
                                new BigDecimal("299.99"),
                                new BigDecimal("299.99")
                        )
                )),
                new BigDecimal("299.99"),
                new BigDecimal("0.00"),
                new BigDecimal("0.00"),
                new BigDecimal("299.99"),
                new BillToInfo(
                        "John Doe",
                        "john@example.com",
                        "123 Main St, Anytown, USA 12345"
                ),
                new FromInfo(
                        "Sharity Inc.",
                        "billing@sharity.com",
                        "456 Tech Ave, Silicon Valley, CA 94025"
                ),
                "Thank you for your subscription!",
                "Visa ending in 4242"
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<PaymentMethodListResponse> getPaymentMethods() {
        List<PaymentMethodResponse> methods = new ArrayList<>();
        methods.add(new PaymentMethodResponse(
                "pm_1",
                "card",
                "Visa",
                "4242",
                12,
                2026,
                true,
                "John Doe"
        ));

        PaymentMethodListResponse response = new PaymentMethodListResponse(methods);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment-methods")
    public ResponseEntity<PaymentMethodResponse> addPaymentMethod(
            @RequestBody AddPaymentMethodRequest request) {

        PaymentMethodResponse response = new PaymentMethodResponse(
                UUID.randomUUID().toString(),
                request.type(),
                request.brand(),
                "****" + request.lastFour(),
                request.expiryMonth(),
                request.expiryYear(),
                true,
                request.cardholderName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/payment-methods/{paymentMethodId}")
    public ResponseEntity<PaymentMethodResponse> updatePaymentMethod(
            @PathVariable String paymentMethodId,
            @RequestBody UpdatePaymentMethodRequest request) {

        PaymentMethodResponse response = new PaymentMethodResponse(
                paymentMethodId,
                "card",
                "Visa",
                "****4242",
                request.expiryMonth(),
                request.expiryYear(),
                request.isDefault(),
                request.cardholderName()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/payment-methods/{paymentMethodId}")
    public ResponseEntity<Void> deletePaymentMethod(
            @PathVariable String paymentMethodId) {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    public ResponseEntity<PaymentConfirmResponse> payInvoice(
            @PathVariable String invoiceId) {

        PaymentConfirmResponse response = new PaymentConfirmResponse(
                UUID.randomUUID().toString(),
                invoiceId,
                "PROCESSING",
                LocalDateTime.now(),
                new BigDecimal("299.99"),
                "USD"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invoices/{invoiceId}/download")
    public ResponseEntity<String> downloadInvoicePdf(
            @PathVariable String invoiceId) {

        // In production, generate actual PDF
        return ResponseEntity.ok("{\"downloadUrl\": \"https://example.com/invoices/" + invoiceId + ".pdf\"}");
    }

    @PostMapping("/billing/settings/auto-renew")
    public ResponseEntity<SettingResponse> toggleAutoRenew(
            @RequestBody AutoRenewRequest request) {

        SettingResponse response = new SettingResponse(
                "auto_renew",
                request.enabled(),
                LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/billing/settings/email-receipts")
    public ResponseEntity<SettingResponse> toggleEmailReceipts(
            @RequestBody EmailReceiptsRequest request) {

        SettingResponse response = new SettingResponse(
                "email_receipts",
                request.enabled(),
                LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscription/cancel")
    public ResponseEntity<CancellationResponse> cancelSubscription(
            @RequestBody CancelSubscriptionRequest request) {

        CancellationResponse response = new CancellationResponse(
                UUID.randomUUID().toString(),
                "PENDING",
                LocalDate.now(),
                LocalDate.now().plusDays(7),
                request.reason()
        );
        return ResponseEntity.ok(response);
    }

    // Helper methods
    private List<InvoiceResponse> generateMockInvoices() {
        List<InvoiceResponse> invoices = new ArrayList<>();

        invoices.add(new InvoiceResponse(
                "INV-001",
                LocalDate.of(2026, 5, 15),
                new BigDecimal("299.99"),
                "PAID",
                "Premium Plan - Monthly"
        ));

        invoices.add(new InvoiceResponse(
                "INV-002",
                LocalDate.of(2026, 4, 15),
                new BigDecimal("299.99"),
                "PAID",
                "Premium Plan - Monthly"
        ));

        invoices.add(new InvoiceResponse(
                "INV-003",
                LocalDate.of(2026, 3, 15),
                new BigDecimal("299.99"),
                "PAID",
                "Premium Plan - Monthly"
        ));

        invoices.add(new InvoiceResponse(
                "INV-004",
                LocalDate.of(2026, 6, 15),
                new BigDecimal("299.99"),
                "PENDING",
                "Premium Plan - Monthly"
        ));

        return invoices;
    }

    // DTOs
    record BillingResponse(
            String subscriptionStatus,
            String profileCompletionStatus,
            BigDecimal amountDue,
            String currencyCode,
            LocalDate billingStartDate,
            LocalDate billingEndDate,
            int activeInvoices,
            int totalInvoices
    ) {}

    record InvoiceResponse(
            String id,
            LocalDate date,
            BigDecimal amount,
            String status,
            String description
    ) {}

    record InvoiceListResponse(
            List<InvoiceResponse> invoices,
            int totalCount,
            int page,
            int pageSize,
            int totalPages
    ) {}

    record InvoiceDetailResponse(
            String publicId,
            String number,
            LocalDate issueDate,
            LocalDate dueDate,
            LocalDate paidDate,
            String status,
            String description,
            BigDecimal amount,
            List<InvoiceLineItem> items,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal total,
            BillToInfo billTo,
            FromInfo from,
            String notes,
            String paymentMethod
    ) {}

    record InvoiceLineItem(
            String description,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal total
    ) {}

    record BillToInfo(
            String name,
            String email,
            String address
    ) {}

    record FromInfo(
            String name,
            String email,
            String address
    ) {}

    record PaymentMethodResponse(
            String id,
            String type,
            String brand,
            String lastFour,
            int expiryMonth,
            int expiryYear,
            boolean isDefault,
            String cardholderName
    ) {}

    record PaymentMethodListResponse(
            List<PaymentMethodResponse> paymentMethods
    ) {}

    record AddPaymentMethodRequest(
            String type,
            String brand,
            String lastFour,
            int expiryMonth,
            int expiryYear,
            String cardholderName
    ) {}

    record UpdatePaymentMethodRequest(
            int expiryMonth,
            int expiryYear,
            boolean isDefault,
            String cardholderName
    ) {}

    record PaymentConfirmResponse(
            String transactionId,
            String invoiceId,
            String status,
            LocalDateTime timestamp,
            BigDecimal amount,
            String currencyCode
    ) {}

    record SettingResponse(
            String key,
            boolean value,
            LocalDateTime updatedAt
    ) {}

    record AutoRenewRequest(boolean enabled) {}
    record EmailReceiptsRequest(boolean enabled) {}
    record CancelSubscriptionRequest(String reason) {}

    record CancellationResponse(
            String cancellationId,
            String status,
            LocalDate effectiveDate,
            LocalDate refundDate,
            String reason
    ) {}
}
