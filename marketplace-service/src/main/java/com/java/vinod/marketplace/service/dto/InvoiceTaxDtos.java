package com.java.vinod.marketplace.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class InvoiceTaxDtos {
    private InvoiceTaxDtos() {
    }

    public record TaxDocumentListResponse(List<TaxDocumentSummary> documents, List<String> filters,
                                          String userSafeMessage, LocalDateTime updatedAt) {}
    public record TaxDocumentSummary(String documentId, String documentType, String orderId,
                                     String sellerOrderId, String documentNumber, String status,
                                     BigDecimal totalAmount, BigDecimal taxAmount, String currency,
                                     String route, String userSafeMessage, LocalDateTime issuedAt) {}
    public record TaxDocumentDetail(String documentId, String documentType, String documentNumber,
                                    String status, String buyerSafeParty, String sellerSafeParty,
                                    String sellerTaxIdMasked, String taxJurisdiction,
                                    List<TaxDocumentLineItem> lineItems, TaxBreakdown taxBreakdown,
                                    List<CreditNoteSummary> creditNotes,
                                    TaxDocumentActionEligibility actionEligibility,
                                    String userSafeMessage, LocalDateTime issuedAt) {}
    public record TaxDocumentLineItem(String lineItemId, String description, String marketplaceCode,
                                      BigDecimal quantity, BigDecimal unitAmount, BigDecimal discountAmount,
                                      BigDecimal taxableAmount, BigDecimal taxAmount,
                                      BigDecimal lineTotal, String currency) {}
    public record TaxBreakdown(List<TaxRow> rows, BigDecimal taxableSubtotal, BigDecimal taxTotal,
                               BigDecimal documentTotal, String currency, String userSafeMessage) {}
    public record TaxRow(String taxCode, String taxLabel, String jurisdiction, BigDecimal rate,
                         BigDecimal taxableAmount, BigDecimal taxAmount, String calculationSource) {}
    public record InvoiceSummary(String invoiceId, String invoiceNumber, String orderId,
                                 String sellerOrderId, String status, BigDecimal totalAmount,
                                 BigDecimal taxAmount, String currency, String route,
                                 String userSafeMessage, LocalDateTime issuedAt) {}
    public record ReceiptSummary(String receiptId, String orderId, String paymentProvider,
                                 String paymentReferenceMasked, BigDecimal paidAmount,
                                 String currency, String route, String userSafeMessage,
                                 LocalDateTime paidAt) {}
    public record CreditNoteSummary(String creditNoteId, String creditNoteNumber, String invoiceId,
                                    String refundRequestId, BigDecimal creditedAmount,
                                    BigDecimal creditedTaxAmount, String currency,
                                    String status, String route, LocalDateTime issuedAt) {}
    public record SellerTaxProfile(String sellerId, String legalNameMasked, String countryCode,
                                   String taxRegistrationStatus, String taxIdMasked,
                                   boolean taxProfileComplete, List<String> missingRequirements,
                                   List<String> supportedDocumentTypes, String userSafeMessage,
                                   LocalDateTime updatedAt) {}
    public record SellerTaxDocumentSummary(String sellerId, List<TaxDocumentSummary> documents,
                                           BigDecimal periodTaxableSales, BigDecimal periodTaxCollected,
                                           String currency, String userSafeMessage,
                                           LocalDateTime updatedAt) {}
    public record SellerPayoutStatement(String statementId, String sellerId, String period,
                                        BigDecimal grossSalesEstimate, BigDecimal refunds,
                                        BigDecimal taxesCollected, BigDecimal sellerSafeProceeds,
                                        BigDecimal payoutAmount, String currency, String status,
                                        String route, String userSafeMessage, LocalDateTime issuedAt) {}
    public record AdminTaxConfigDashboard(List<AdminTaxRule> rules,
                                          List<AdminCountryTaxConfig> countries,
                                          List<AdminCategoryTaxConfig> categories,
                                          List<String> legalReviewWarnings,
                                          String adminSafeMessage, LocalDateTime updatedAt) {}
    public record AdminTaxRule(String ruleId, String countryCode, String regionCode,
                               String marketplaceCode, String categoryCode, String taxType,
                               BigDecimal taxRate, boolean active, boolean legalReviewRequired,
                               String adminSafeSummary, LocalDateTime updatedAt) {}
    public record AdminCountryTaxConfig(String countryCode, String currency,
                                        boolean taxEnabled, boolean taxDocumentsEnabled,
                                        String registrationRequirement, String adminSafeSummary) {}
    public record AdminCategoryTaxConfig(String categoryCode, String marketplaceCode,
                                         String defaultTaxTreatment, boolean digitalGood,
                                         boolean physicalGood, String adminSafeSummary) {}
    public record InvoiceDownloadLinkResponse(boolean success, String documentId,
                                              String downloadUrlPlaceholder, LocalDateTime expiresAt,
                                              String userSafeMessage) {}
    public record TaxDocumentActionEligibility(boolean download, boolean requestSupport,
                                               boolean creditNoteAvailable, boolean voidPlaceholder,
                                               List<String> disabledReasons) {}
    public record TaxDocumentActionResponse(boolean success, String status, String message,
                                            String nextRoute, boolean auditLogged,
                                            LocalDateTime updatedAt) {}
    public record TaxCalculationResponse(String calculationId, String status, TaxBreakdown taxBreakdown,
                                         String userSafeMessage, LocalDateTime calculatedAt) {}

    public static TaxDocumentListResponse buyerDocuments(String orderId) {
        return new TaxDocumentListResponse(List.of(invoiceSummary(orderId, null), receiptSummary(orderId)),
                List.of("ALL", "INVOICE", "RECEIPT", "CREDIT_NOTE"),
                "Buyer tax documents are backend-generated. Tax IDs and seller private data are masked.",
                LocalDateTime.now());
    }

    public static TaxDocumentSummary invoiceSummary(String orderId, String sellerOrderId) {
        String sellerPart = sellerOrderId == null ? "parent" : sellerOrderId;
        return new TaxDocumentSummary("taxdoc-inv-" + sellerPart, "TAX_INVOICE", orderId,
                sellerOrderId, "INV-2026-000245", "ISSUED", new BigDecimal("54.49"),
                new BigDecimal("4.50"), "USD", "/tax-documents/taxdoc-inv-" + sellerPart,
                "Tax invoice is available. Official tax logic remains backend-owned.",
                LocalDateTime.now().minusDays(1));
    }

    public static TaxDocumentSummary receiptSummary(String orderId) {
        return new TaxDocumentSummary("taxdoc-receipt-" + orderId, "RECEIPT", orderId,
                null, "RCPT-2026-000245", "ISSUED", new BigDecimal("54.49"),
                new BigDecimal("4.50"), "USD", "/tax-documents/taxdoc-receipt-" + orderId,
                "Receipt confirms payment only; tax breakdown is provided by backend.",
                LocalDateTime.now().minusDays(1));
    }

    public static TaxDocumentDetail detail(String documentId) {
        return new TaxDocumentDetail(documentId, documentId.contains("credit") ? "CREDIT_NOTE" : "TAX_INVOICE",
                documentId.contains("credit") ? "CRN-2026-000067" : "INV-2026-000245",
                "ISSUED", "Buyer: masked", "Seller: Code Vault", "US-***-4521",
                "USA-AZ", lineItems(), taxBreakdown(), List.of(creditNote("refund-067")),
                actions(), "Document detail excludes raw tax IDs, provider payloads, and private party data.",
                LocalDateTime.now().minusDays(1));
    }

    public static List<TaxDocumentLineItem> lineItems() {
        return List.of(new TaxDocumentLineItem("line-1", "Premium digital code", "DIGITAL",
                BigDecimal.ONE, new BigDecimal("49.99"), BigDecimal.ZERO,
                new BigDecimal("49.99"), new BigDecimal("4.50"),
                new BigDecimal("54.49"), "USD"));
    }

    public static TaxBreakdown taxBreakdown() {
        return new TaxBreakdown(List.of(new TaxRow("US-AZ-TPT", "Sales tax", "Arizona",
                new BigDecimal("0.0900"), new BigDecimal("49.99"), new BigDecimal("4.50"),
                "BACKEND_TAX_RULE_PLACEHOLDER")), new BigDecimal("49.99"),
                new BigDecimal("4.50"), new BigDecimal("54.49"), "USD",
                "Tax is calculated by backend tax configuration; frontend must not recalculate.");
    }

    public static InvoiceSummary invoice(String orderId, String sellerOrderId) {
        return new InvoiceSummary("inv-" + orderId, "INV-2026-000245", orderId, sellerOrderId,
                "ISSUED", new BigDecimal("54.49"), new BigDecimal("4.50"), "USD",
                "/buyer/orders/" + orderId + "/invoice",
                "Official invoice generated by backend mock contract.", LocalDateTime.now().minusDays(1));
    }

    public static ReceiptSummary receipt(String orderId) {
        return new ReceiptSummary("receipt-" + orderId, orderId, "PAYPAL", "PAYPAL-***-8F2",
                new BigDecimal("54.49"), "USD", "/buyer/orders/" + orderId + "/receipt",
                "Receipt is buyer-safe and hides provider payloads.", LocalDateTime.now().minusDays(1));
    }

    public static CreditNoteSummary creditNote(String refundRequestId) {
        return new CreditNoteSummary("credit-note-" + refundRequestId, "CRN-2026-000067",
                "inv-order-060", refundRequestId, new BigDecimal("54.49"),
                new BigDecimal("4.50"), "USD", "PENDING_REVIEW",
                "/admin/refunds/" + refundRequestId + "/credit-note", LocalDateTime.now());
    }

    public static SellerTaxProfile sellerProfile(String sellerId) {
        return new SellerTaxProfile(sellerId, "Code V*** LLC", "USA", "PENDING_REVIEW",
                "US-***-4521", false, List.of("Confirm tax registration details", "Legal review pending"),
                List.of("TAX_INVOICE", "CREDIT_NOTE", "PAYOUT_STATEMENT"),
                "Seller tax profile is seller-safe and masks legal identifiers.", LocalDateTime.now());
    }

    public static SellerTaxDocumentSummary sellerDocuments() {
        return new SellerTaxDocumentSummary("seller-code-vault",
                List.of(invoiceSummary("order-060", "seller-order-060-a")),
                new BigDecimal("49.99"), new BigDecimal("4.50"), "USD",
                "Seller tax documents show seller-safe proceeds and tax summaries only.", LocalDateTime.now());
    }

    public static List<SellerPayoutStatement> statements() {
        return List.of(new SellerPayoutStatement("stmt-2026-06-seller-code-vault", "seller-code-vault",
                "2026-06", new BigDecimal("249.95"), new BigDecimal("54.49"),
                new BigDecimal("18.00"), new BigDecimal("176.46"), new BigDecimal("176.46"),
                "USD", "ISSUED", "/seller/payouts/statements/stmt-2026-06-seller-code-vault",
                "Statement is seller-safe and does not expose platform fee algorithms.", LocalDateTime.now()));
    }

    public static AdminTaxConfigDashboard adminConfig() {
        return new AdminTaxConfigDashboard(rules(), countries(), categories(),
                List.of("Production tax rules require legal/accounting review.",
                        "Tax provider integration and document storage are placeholders."),
                "Admin tax config is masked and excludes private tax IDs.", LocalDateTime.now());
    }

    public static List<AdminTaxRule> rules() {
        return List.of(new AdminTaxRule("tax-rule-us-az-digital", "USA", "AZ", "DIGITAL",
                "DIGITAL_CODES", "SALES_TAX", new BigDecimal("0.0900"), true, true,
                "Digital code sales tax placeholder for USA/AZ.", LocalDateTime.now()));
    }

    public static List<AdminCountryTaxConfig> countries() {
        return List.of(new AdminCountryTaxConfig("USA", "USD", true, true,
                "SELLER_TAX_PROFILE_REQUIRED", "US tax config placeholder."),
                new AdminCountryTaxConfig("CAN", "CAD", false, false,
                        "LEGAL_REVIEW_REQUIRED", "Canada tax config deferred."));
    }

    public static List<AdminCategoryTaxConfig> categories() {
        return List.of(new AdminCategoryTaxConfig("DIGITAL_CODES", "DIGITAL",
                "TAXABLE_DIGITAL_GOOD_PLACEHOLDER", true, false,
                "Digital codes do not require shipping."),
                new AdminCategoryTaxConfig("ELECTRONICS", "PHYSICAL",
                        "PHYSICAL_GOOD_TAX_PLACEHOLDER", false, true,
                        "Physical shipping/tax flow deferred to shipping story."));
    }

    public static TaxDocumentActionEligibility actions() {
        return new TaxDocumentActionEligibility(true, true, true, false, List.of());
    }

    public static InvoiceDownloadLinkResponse download(String documentId) {
        return new InvoiceDownloadLinkResponse(true, documentId,
                "/secure-downloads/tax-documents/" + documentId + "?placeholder=true",
                LocalDateTime.now().plusMinutes(15),
                "Download link placeholder is short-lived and backend-generated.");
    }

    public static TaxDocumentActionResponse action(String status, String route) {
        return new TaxDocumentActionResponse(true, status,
                "Mock tax document action recorded and audit logged.", route, true, LocalDateTime.now());
    }

    public static TaxCalculationResponse calculation() {
        return new TaxCalculationResponse("taxcalc-092", "CALCULATED", taxBreakdown(),
                "Tax calculation is backend-owned and suitable only for mock/API integration.",
                LocalDateTime.now());
    }
}
