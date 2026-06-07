package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.InvoiceTaxDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class InvoiceTaxMockController {
    @GetMapping("/api/buyer/orders/{orderId}/tax-documents")
    public InvoiceTaxDtos.TaxDocumentListResponse buyerOrderTaxDocuments(@PathVariable String orderId) {
        return InvoiceTaxDtos.buyerDocuments(orderId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/invoice")
    public InvoiceTaxDtos.InvoiceSummary buyerOrderInvoice(@PathVariable String orderId) {
        return InvoiceTaxDtos.invoice(orderId, null);
    }

    @GetMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}/invoice")
    public InvoiceTaxDtos.InvoiceSummary buyerSellerGroupInvoice(@PathVariable String orderId,
                                                                 @PathVariable String sellerOrderId) {
        return InvoiceTaxDtos.invoice(orderId, sellerOrderId);
    }

    @GetMapping("/api/buyer/tax-documents")
    public InvoiceTaxDtos.TaxDocumentListResponse buyerTaxDocuments() {
        return InvoiceTaxDtos.buyerDocuments("order-060");
    }

    @GetMapping("/api/buyer/tax-documents/{documentId}")
    public InvoiceTaxDtos.TaxDocumentDetail buyerTaxDocument(@PathVariable String documentId) {
        return InvoiceTaxDtos.detail(documentId);
    }

    @PostMapping("/api/buyer/tax-documents/{documentId}/download-link")
    public InvoiceTaxDtos.InvoiceDownloadLinkResponse buyerTaxDocumentDownload(@PathVariable String documentId) {
        return InvoiceTaxDtos.download(documentId);
    }

    @GetMapping("/api/seller/tax-documents")
    public InvoiceTaxDtos.SellerTaxDocumentSummary sellerTaxDocuments() {
        return InvoiceTaxDtos.sellerDocuments();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/invoice")
    public InvoiceTaxDtos.InvoiceSummary sellerOrderInvoice(@PathVariable String sellerOrderId) {
        return InvoiceTaxDtos.invoice("order-060", sellerOrderId);
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/tax-summary")
    public InvoiceTaxDtos.TaxBreakdown sellerOrderTaxSummary(@PathVariable String sellerOrderId) {
        return InvoiceTaxDtos.taxBreakdown();
    }

    @GetMapping("/api/seller/payouts/statements")
    public List<InvoiceTaxDtos.SellerPayoutStatement> sellerPayoutStatements() {
        return InvoiceTaxDtos.statements();
    }

    @GetMapping("/api/seller/payouts/statements/{statementId}")
    public InvoiceTaxDtos.SellerPayoutStatement sellerPayoutStatement(@PathVariable String statementId) {
        return InvoiceTaxDtos.statements().stream()
                .filter(statement -> statement.statementId().equals(statementId))
                .findFirst()
                .orElse(InvoiceTaxDtos.statements().get(0));
    }

    @GetMapping("/api/seller/tax-profile")
    public InvoiceTaxDtos.SellerTaxProfile sellerTaxProfile() {
        return InvoiceTaxDtos.sellerProfile("seller-code-vault");
    }

    @PutMapping("/api/seller/tax-profile")
    public InvoiceTaxDtos.TaxDocumentActionResponse updateSellerTaxProfile(@RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.action("SELLER_TAX_PROFILE_UPDATED", "/seller/tax-profile");
    }

    @PostMapping("/api/seller/tax-documents/{documentId}/download-link")
    public InvoiceTaxDtos.InvoiceDownloadLinkResponse sellerTaxDocumentDownload(@PathVariable String documentId) {
        return InvoiceTaxDtos.download(documentId);
    }

    @GetMapping("/api/admin/invoices")
    public InvoiceTaxDtos.TaxDocumentListResponse adminInvoices() {
        return InvoiceTaxDtos.buyerDocuments("order-060");
    }

    @GetMapping("/api/admin/invoices/{invoiceId}")
    public InvoiceTaxDtos.TaxDocumentDetail adminInvoice(@PathVariable String invoiceId) {
        return InvoiceTaxDtos.detail(invoiceId);
    }

    @GetMapping("/api/admin/tax-documents")
    public InvoiceTaxDtos.TaxDocumentListResponse adminTaxDocuments() {
        return InvoiceTaxDtos.buyerDocuments("order-060");
    }

    @GetMapping("/api/admin/tax-documents/{documentId}")
    public InvoiceTaxDtos.TaxDocumentDetail adminTaxDocument(@PathVariable String documentId) {
        return InvoiceTaxDtos.detail(documentId);
    }

    @GetMapping("/api/admin/tax-config")
    public InvoiceTaxDtos.AdminTaxConfigDashboard adminTaxConfig() {
        return InvoiceTaxDtos.adminConfig();
    }

    @PostMapping("/api/admin/tax-config/rules")
    public InvoiceTaxDtos.TaxDocumentActionResponse createTaxRule(@RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.action("TAX_RULE_CREATED_REQUIRES_REVIEW", "/admin/tax-config");
    }

    @PutMapping("/api/admin/tax-config/rules/{ruleId}")
    public InvoiceTaxDtos.TaxDocumentActionResponse updateTaxRule(@PathVariable String ruleId,
                                                                  @RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.action("TAX_RULE_UPDATED_REQUIRES_REVIEW", "/admin/tax-config/rules/" + ruleId);
    }

    @PostMapping("/api/admin/tax-config/rules/{ruleId}/enable")
    public InvoiceTaxDtos.TaxDocumentActionResponse enableTaxRule(@PathVariable String ruleId) {
        return InvoiceTaxDtos.action("TAX_RULE_ENABLE_REQUIRES_REVIEW", "/admin/tax-config/rules/" + ruleId);
    }

    @PostMapping("/api/admin/tax-config/rules/{ruleId}/disable")
    public InvoiceTaxDtos.TaxDocumentActionResponse disableTaxRule(@PathVariable String ruleId) {
        return InvoiceTaxDtos.action("TAX_RULE_DISABLE_REQUIRES_REVIEW", "/admin/tax-config/rules/" + ruleId);
    }

    @GetMapping("/api/admin/tax-config/countries")
    public List<InvoiceTaxDtos.AdminCountryTaxConfig> adminTaxCountries() {
        return InvoiceTaxDtos.countries();
    }

    @GetMapping("/api/admin/tax-config/categories")
    public List<InvoiceTaxDtos.AdminCategoryTaxConfig> adminTaxCategories() {
        return InvoiceTaxDtos.categories();
    }

    @GetMapping("/api/admin/sellers/{sellerId}/tax-profile")
    public InvoiceTaxDtos.SellerTaxProfile adminSellerTaxProfile(@PathVariable String sellerId) {
        return InvoiceTaxDtos.sellerProfile(sellerId);
    }

    @PutMapping("/api/admin/sellers/{sellerId}/tax-profile")
    public InvoiceTaxDtos.TaxDocumentActionResponse updateAdminSellerTaxProfile(@PathVariable String sellerId,
                                                                                @RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.action("ADMIN_SELLER_TAX_PROFILE_UPDATED", "/admin/sellers/" + sellerId + "/tax-profile");
    }

    @GetMapping("/api/admin/orders/{orderId}/tax-documents")
    public InvoiceTaxDtos.TaxDocumentListResponse adminOrderTaxDocuments(@PathVariable String orderId) {
        return InvoiceTaxDtos.buyerDocuments(orderId);
    }

    @PostMapping("/api/admin/invoices/{invoiceId}/void-placeholder")
    public InvoiceTaxDtos.TaxDocumentActionResponse voidInvoicePlaceholder(@PathVariable String invoiceId) {
        return InvoiceTaxDtos.action("INVOICE_VOID_PLACEHOLDER_RECORDED", "/admin/invoices/" + invoiceId);
    }

    @PostMapping("/api/admin/refunds/{refundRequestId}/credit-note")
    public InvoiceTaxDtos.CreditNoteSummary createCreditNote(@PathVariable String refundRequestId) {
        return InvoiceTaxDtos.creditNote(refundRequestId);
    }

    @GetMapping("/api/admin/tax-documents/export-placeholder")
    public InvoiceTaxDtos.TaxDocumentActionResponse exportTaxDocuments() {
        return InvoiceTaxDtos.action("TAX_DOCUMENT_EXPORT_REQUESTED", "/admin/tax-documents");
    }

    @PostMapping("/api/internal/invoices/generate")
    public InvoiceTaxDtos.InvoiceSummary generateInvoice(@RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.invoice("order-060", "seller-order-060-a");
    }

    @PostMapping("/api/internal/invoices/{invoiceId}/finalize")
    public InvoiceTaxDtos.TaxDocumentActionResponse finalizeInvoice(@PathVariable String invoiceId) {
        return InvoiceTaxDtos.action("INVOICE_FINALIZED", "/internal/invoices/" + invoiceId);
    }

    @PostMapping("/api/internal/invoices/{invoiceId}/credit-note")
    public InvoiceTaxDtos.CreditNoteSummary internalCreditNote(@PathVariable String invoiceId,
                                                               @RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.creditNote("refund-067");
    }

    @PostMapping("/api/internal/tax/calculate")
    public InvoiceTaxDtos.TaxCalculationResponse calculateTax(@RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.calculation();
    }

    @PostMapping("/api/internal/tax/recalculate")
    public InvoiceTaxDtos.TaxCalculationResponse recalculateTax(@RequestBody(required = false) Object request) {
        return InvoiceTaxDtos.calculation();
    }
}
