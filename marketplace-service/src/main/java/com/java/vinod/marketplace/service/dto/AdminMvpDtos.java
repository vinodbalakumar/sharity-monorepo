package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class AdminMvpDtos {
    private AdminMvpDtos() {
    }

    public record AdminAccessStatus(boolean admin, List<String> roles, boolean accessGranted,
                                    String accessDeniedReason, String userSafeMessage) {}
    public record AdminConfigDashboardResponse(AdminAccessStatus adminAccess, AdminConfigSummary summary,
                                               List<AdminConfigAreaCard> configAreas,
                                               AdminConfigDetail selectedConfig,
                                               AdminConfigActionEligibility availableActions,
                                               String userSafeMessage, LocalDateTime updatedAt) {}
    public record AdminConfigSummary(int enabledAreaCount, int placeholderAreaCount, int backendRequiredCount,
                                     int disabledWriteActionCount, LocalDateTime updatedAt) {}
    public record AdminConfigAreaCard(String configAreaCode, String title, String description, String status,
                                      boolean enabled, boolean backendRequired, LocalDateTime lastUpdatedAt,
                                      String route, String userSafeMessage) {}
    public record AdminConfigDetail(String configAreaCode, String title, String status, boolean enabled,
                                    boolean readonly, boolean placeholder, List<String> summaryRows,
                                    AdminConfigActionEligibility availableActions, String userSafeMessage,
                                    LocalDateTime updatedAt) {}
    public record AdminConfigActionEligibility(boolean viewConfig, boolean refreshConfig, boolean editPlaceholder,
                                               boolean enableDisablePlaceholder, boolean viewAuditPlaceholder,
                                               List<String> disabledReasons) {}
    public record AdminConfigActionResponse(boolean success, String status, String message, String nextRoute,
                                            LocalDateTime updatedAt) {}

    public record AdminReviewDashboardResponse(AdminReviewSummary summary, List<AdminReviewQueueItem> queueItems,
                                               AdminReviewItemDetail selectedReviewItem, List<String> filters,
                                               AdminReviewActionEligibility availableActions,
                                               String userSafeMessage, LocalDateTime updatedAt) {}
    public record AdminReviewSummary(int ordersNeedingReviewCount, int refundRequestsCount, int disputesCount,
                                     int digitalDeliveryIssuesCount, int paymentIssuesCount, int policyReportsCount,
                                     int criticalCount, LocalDateTime updatedAt) {}
    public record AdminReviewQueueItem(String reviewItemId, String reviewType, String relatedEntityId,
                                       String relatedEntityReference, String status, String severity, String title,
                                       String summary, LocalDateTime createdAt, String route,
                                       AdminReviewActionEligibility availableActions) {}
    public record AdminReviewItemDetail(String reviewItemId, String reviewType, String relatedOrderId,
                                        String relatedSellerOrderId, String relatedRefundRequestId,
                                        String relatedDisputeId, String relatedIssueId, String status,
                                        String severity, String buyerSafeSummary, String sellerSafeSummary,
                                        List<String> maskedDetails, List<String> timeline,
                                        AdminReviewActionEligibility availableActions, String userSafeMessage,
                                        LocalDateTime updatedAt) {}
    public record AdminReviewActionEligibility(boolean viewReviewItem, boolean refreshQueue,
                                               boolean assignPlaceholder, boolean addInternalNotePlaceholder,
                                               boolean resolvePlaceholder, boolean escalatePlaceholder,
                                               boolean openRelatedEntity, List<String> disabledReasons) {}
    public record AdminReviewActionResponse(boolean success, String status, String message, String nextRoute,
                                            LocalDateTime updatedAt) {}

    public record AdminMarketplaceCountryConfigResponse(List<AdminCountryConfig> countries,
                                                        List<AdminMarketplaceConfig> marketplaces,
                                                        List<AdminMarketplaceCountryRule> rules,
                                                        AdminCountryConfig selectedCountry,
                                                        AdminMarketplaceConfig selectedMarketplace,
                                                        AdminMarketplaceCountryActionEligibility availableActions,
                                                        String userSafeMessage, LocalDateTime updatedAt) {}
    public record AdminCountryConfig(String countryCode, String countryName, boolean supported,
                                     String defaultCurrency, boolean buyerEnabled, boolean sellerEnabled,
                                     String paymentProviderStatus, String digitalDeliveryStatus,
                                     List<String> enabledMarketplaceCodes, List<String> disabledMarketplaceCodes,
                                     String policyVersionRequired, String status, String userSafeMessage) {}
    public record AdminMarketplaceConfig(String marketplaceCode, String marketplaceName, String marketplaceType,
                                         boolean enabledGlobally, boolean buyerSupported, boolean sellerSupported,
                                         boolean listingCreationSupported, boolean checkoutSupported,
                                         boolean digitalDeliverySupported, boolean futurePlaceholder,
                                         String userSafeMessage) {}
    public record AdminMarketplaceCountryRule(String countryCode, String marketplaceCode, boolean buyerEnabled,
                                              boolean sellerEnabled, boolean listingCreationEnabled,
                                              boolean checkoutEnabled, boolean paymentProviderEnabled,
                                              boolean digitalDeliveryEnabled, String status, String disabledReason,
                                              String userSafeMessage, LocalDateTime updatedAt) {}
    public record AdminMarketplaceCountryActionEligibility(boolean viewCountryConfig,
                                                          boolean viewMarketplaceConfig,
                                                          boolean enableMarketplacePlaceholder,
                                                          boolean disableMarketplacePlaceholder,
                                                          boolean editBuyerSellerAccessPlaceholder,
                                                          boolean refreshConfig,
                                                          boolean viewAuditPlaceholder,
                                                          List<String> disabledReasons) {}
    public record AdminMarketplaceCountryActionResponse(boolean success, String status, String message,
                                                        String nextRoute, LocalDateTime updatedAt) {}

    public record AdminFeeCouponConfigResponse(AdminFeeCouponSummary summary, List<AdminConfigRuleCard> ruleCards,
                                               AdminConfigRuleDetail selectedRule,
                                               AdminFeeCouponActionEligibility availableActions,
                                               String userSafeMessage, LocalDateTime updatedAt) {}
    public record AdminFeeCouponSummary(int platformCouponRulesCount, int buyerServiceFeeRulesCount,
                                        int sellerCommissionRulesCount, int sellerWaiverRulesCount,
                                        int sellerHoldRulesCount, int refundApprovalRulesCount,
                                        int riskRulePlaceholderCount, LocalDateTime updatedAt) {}
    public record AdminConfigRuleCard(String ruleId, String ruleName, String ruleType, String marketplaceCode,
                                      String countryCode, String status, boolean enabled, int priority,
                                      String adminSafeSummary, String route, LocalDateTime updatedAt) {}
    public record AdminConfigRuleDetail(String ruleId, String ruleName, String ruleType, String scope,
                                        boolean enabled, boolean readonly, boolean placeholder,
                                        List<String> summaryRows, List<String> warnings,
                                        AdminFeeCouponActionEligibility availableActions,
                                        String adminSafeMessage, LocalDateTime updatedAt) {}
    public record AdminSellerWaiverConfig(String waiverId, String sellerStoreId, String sellerDisplayName,
                                          String waiverType, boolean active, LocalDateTime expiresAt,
                                          String adminSafeReason, String userSafeMessage) {}
    public record AdminSellerHoldRule(String holdRuleId, String ruleName, String triggerType, String holdType,
                                      String sellerSafeDisplayMode, boolean active, String adminSafeSummary) {}
    public record AdminRefundApprovalRule(String ruleId, String marketplaceCode,
                                          boolean requiresAdminApprovalAfterShipment,
                                          boolean requiresAdminApprovalAfterDigitalReveal, boolean active,
                                          String adminSafeSummary) {}
    public record AdminRiskRulePlaceholder(String ruleId, String ruleName, boolean privateInternalOnly,
                                           boolean displayToSeller, boolean displayToBuyer, boolean active,
                                           String adminSafeSummary) {}
    public record AdminFeeCouponActionEligibility(boolean viewRule, boolean createRulePlaceholder,
                                                  boolean editRulePlaceholder, boolean enableDisablePlaceholder,
                                                  boolean viewAffectedSellersPlaceholder,
                                                  boolean viewAuditPlaceholder, boolean refreshConfig,
                                                  List<String> disabledReasons) {}
    public record AdminFeeCouponActionResponse(boolean success, String status, String message, String nextRoute,
                                               LocalDateTime updatedAt) {}

    public record FinalMvpQaResponse(List<MvpMockUser> mockUsers, List<MvpRouteGuardRule> routeGuards,
                                     List<MvpMockDataBundle> mockDataBundles, List<MvpQaCheck> checks,
                                     List<String> knownPlaceholders, String userSafeMessage,
                                     LocalDateTime updatedAt) {}
    public record MvpMockUser(String userKey, String displayName, List<String> roles, boolean guest,
                              boolean sellerEligible, boolean profileComplete, boolean emailVerified,
                              boolean accessDenied) {}
    public record MvpRouteGuardRule(String routePattern, String guardType, List<String> allowedRoles,
                                    String deniedRoute, boolean hiddenFromNav, String userSafeMessage) {}
    public record MvpMockDataBundle(String bundleKey, String title, String status, List<String> coveredStates,
                                    boolean containsSensitivePayloads) {}
    public record MvpQaCheck(String checkCode, String title, String status, String evidence,
                             boolean blocksRelease) {}

    public static AdminAccessStatus accessGranted() {
        return new AdminAccessStatus(true, List.of("USER", "ADMIN"), true, null,
                "Admin placeholder access granted for safe mock data.");
    }

    public static AdminAccessStatus accessDenied() {
        return new AdminAccessStatus(false, List.of("USER", "CUSTOMER"), false,
                "ADMIN_ROLE_REQUIRED", "Admin routes are hidden for normal buyer and seller users.");
    }

    public static AdminConfigActionEligibility configActions() {
        return new AdminConfigActionEligibility(true, true, false, false, true,
                List.of("Write actions are disabled until the admin backend enables them.",
                        "Secrets and provider credentials are never returned by this placeholder."));
    }

    public static AdminConfigDashboardResponse configDashboard(String area) {
        List<AdminConfigAreaCard> cards = configAreas();
        AdminConfigDetail selected = configDetail(area == null ? "marketplaces" : area);
        return new AdminConfigDashboardResponse(accessGranted(),
                new AdminConfigSummary(7, 10, 10, 3, LocalDateTime.now()), cards, selected,
                configActions(), "Read-only admin configuration placeholders use admin-safe mock data.",
                LocalDateTime.now());
    }

    public static List<AdminConfigAreaCard> configAreas() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                configArea("marketplaces", "Marketplace modules", "Country-scoped marketplace module readiness.", true, now),
                configArea("countries", "Country/region rules", "Supported country, currency, and policy readiness.", true, now),
                configArea("payments", "Payment provider settings", "PayPal first, Stripe later placeholder.", true, now),
                configArea("coupons", "Coupon/promo rules", "Platform coupon and promo placeholder summaries.", true, now),
                configArea("fees", "Fee rules", "Buyer fee and seller-side rule placeholders for admins only.", true, now),
                configArea("sellers", "Seller eligibility rules", "Seller onboarding, holds, and eligibility placeholders.", true, now),
                configArea("digital-delivery", "Digital delivery rules", "Secure reveal and no-chat-code policy summaries.", true, now),
                configArea("policies", "Policy versions", "Versioned buyer, seller, refund, dispute, and payout policies.", true, now),
                configArea("notifications", "Notification rules", "In-app alert and channel placeholder summaries.", true, now),
                configArea("security", "Security/rate limits", "Safe rate-limit placeholder without risk model output.", false, now));
    }

    public static AdminConfigDetail configDetail(String area) {
        String code = area == null ? "marketplaces" : area;
        return new AdminConfigDetail(code, titleize(code), "PLACEHOLDER_READONLY", true, true, true,
                List.of("Backend required for writes", "Audit detail placeholder only",
                        "No secrets, provider payloads, private user data, or internal risk scores are shown"),
                configActions(), "This configuration summary is safe for admin-readiness review only.",
                LocalDateTime.now());
    }

    public static AdminConfigActionResponse adminAction(String route) {
        return new AdminConfigActionResponse(true, "REFRESHED",
                "Mock refresh completed. Write actions remain disabled for MVP.", route, LocalDateTime.now());
    }

    public static AdminReviewActionEligibility reviewActions() {
        return new AdminReviewActionEligibility(true, true, false, false, false, false, true,
                List.of("Operational admin actions are placeholders.",
                        "Internal notes, raw provider payloads, risk model output, and raw digital payloads are hidden."));
    }

    public static AdminReviewDashboardResponse reviewDashboard() {
        List<AdminReviewQueueItem> queue = reviewQueue();
        return new AdminReviewDashboardResponse(new AdminReviewSummary(2, 2, 2, 1, 1, 1, 1, LocalDateTime.now()),
                queue, reviewDetail(queue.get(0).reviewItemId()),
                List.of("ALL", "REFUNDS", "DISPUTES", "DIGITAL_DELIVERY", "PAYMENT", "CRITICAL"),
                reviewActions(), "Review queues are read-only and masked for MVP.", LocalDateTime.now());
    }

    public static List<AdminReviewQueueItem> reviewQueue() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                reviewItem("review-refund-001", "REFUND", "refund-067", "RFD-067", "UNDER_REVIEW", "WARNING",
                        "Refund request after digital reveal", "Buyer reports invalid code; raw payload hidden.", now),
                reviewItem("review-dispute-001", "DISPUTE", "dispute-069", "DSP-069", "WAITING_FOR_SELLER", "CRITICAL",
                        "Sharity Review needs seller response", "Masked timeline only; no admin private notes.", now),
                reviewItem("review-delivery-001", "DIGITAL_DELIVERY_ISSUE", "issue-065", "DDI-065", "NEW", "WARNING",
                        "Digital delivery issue reported", "Secure reveal status shown without code or raw URL.", now),
                reviewItem("review-payment-001", "PAYMENT_ISSUE", "order-060", "ORD-060", "NEW", "INFO",
                        "Payment authorization pending", "Provider payload hidden; buyer-safe status only.", now));
    }

    public static AdminReviewItemDetail reviewDetail(String id) {
        return new AdminReviewItemDetail(id, typeFromId(id), "order-060", "seller-order-063",
                "refund-067", "dispute-069", "issue-065", "UNDER_REVIEW", "WARNING",
                "Buyer-safe summary: order issue is being reviewed.",
                "Seller-safe summary: respond in Safe Messaging or review queue if requested.",
                List.of("Buyer contact: masked", "Seller contact: masked", "Payment provider data: hidden",
                        "Digital payload: hidden", "Risk model output: hidden"),
                List.of("Request created", "Seller notified", "Admin placeholder review opened"),
                reviewActions(), "Admin detail is masked and excludes private operational notes.", LocalDateTime.now());
    }

    public static AdminReviewActionResponse reviewAction(String route) {
        return new AdminReviewActionResponse(true, "REFRESHED",
                "Mock review refresh completed; resolve/escalate actions remain disabled.", route, LocalDateTime.now());
    }

    public static AdminMarketplaceCountryActionEligibility marketplaceActions() {
        return new AdminMarketplaceCountryActionEligibility(true, true, false, false, false, true, true,
                List.of("Enable/disable and access edits are disabled until backend config is live."));
    }

    public static AdminMarketplaceCountryConfigResponse marketplaceCountryConfig() {
        List<AdminCountryConfig> countries = countries();
        List<AdminMarketplaceConfig> marketplaces = marketplaces();
        return new AdminMarketplaceCountryConfigResponse(countries, marketplaces, marketplaceRules(),
                countries.get(0), marketplaces.get(0), marketplaceActions(),
                "Country marketplace matrix is read-only and admin-safe.", LocalDateTime.now());
    }

    public static List<AdminCountryConfig> countries() {
        return List.of(
                new AdminCountryConfig("USA", "United States", true, "USD", true, true, "PAYPAL_AVAILABLE",
                        "DIGITAL_READY", List.of("DIGITAL", "IMITATION_JEWELLERY"),
                        List.of("AUTOMOTIVE", "FRESH_GROCERY", "RENTAL"), "POLICY-2026-06", "SUPPORTED",
                        "Buying and selling are enabled for MVP digital flows."),
                new AdminCountryConfig("CAN", "Canada", true, "CAD", true, false, "PAYPAL_AVAILABLE",
                        "DIGITAL_READY", List.of("DIGITAL"), List.of("IMITATION_JEWELLERY", "AUTOMOTIVE"),
                        "POLICY-2026-06", "BUYER_ONLY", "Seller access is not enabled yet."),
                new AdminCountryConfig("GBR", "United Kingdom", false, "GBP", false, false, "UNAVAILABLE",
                        "UNAVAILABLE", List.of(), List.of("DIGITAL", "IMITATION_JEWELLERY"),
                        "POLICY_REQUIRED_LATER", "UNSUPPORTED", "Marketplace launch is not available yet."));
    }

    public static List<AdminMarketplaceConfig> marketplaces() {
        return List.of(
                new AdminMarketplaceConfig("DIGITAL", "Digital marketplace", "DIGITAL", true, true, true,
                        true, true, true, false, "Secure reveal and digital library enabled."),
                new AdminMarketplaceConfig("IMITATION_JEWELLERY", "One gram gold / imitation jewellery", "PHYSICAL_LATER",
                        true, true, true, true, true, false, false, "Physical fulfillment details later."),
                new AdminMarketplaceConfig("AUTOMOTIVE", "Automotive later", "FUTURE", false, false, false,
                        false, false, false, true, "Future marketplace placeholder."),
                new AdminMarketplaceConfig("FRESH_GROCERY", "Fresh grocery later", "FUTURE", false, false, false,
                        false, false, false, true, "Future marketplace placeholder."),
                new AdminMarketplaceConfig("RENTAL", "Rental marketplace later", "FUTURE", false, false, false,
                        false, false, false, true, "Future marketplace placeholder."));
    }

    public static List<AdminMarketplaceCountryRule> marketplaceRules() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                new AdminMarketplaceCountryRule("USA", "DIGITAL", true, true, true, true, true, true,
                        "ENABLED", null, "Digital marketplace is enabled.", now),
                new AdminMarketplaceCountryRule("CAN", "DIGITAL", true, false, false, true, true, true,
                        "BUYER_ENABLED", "Seller onboarding not enabled in country.", "Buyer digital access only.", now),
                new AdminMarketplaceCountryRule("GBR", "DIGITAL", false, false, false, false, false, false,
                        "DISABLED", "Country unsupported.", "Marketplace unavailable in this country.", now),
                new AdminMarketplaceCountryRule("USA", "AUTOMOTIVE", false, false, false, false, false, false,
                        "COMING_SOON", "Future module.", "Automotive is a later marketplace.", now));
    }

    public static AdminMarketplaceCountryActionResponse marketplaceAction() {
        return new AdminMarketplaceCountryActionResponse(true, "REFRESHED",
                "Marketplace-country mock matrix refreshed.", "/admin/config/marketplace-country-rules",
                LocalDateTime.now());
    }

    public static AdminFeeCouponActionEligibility feeCouponActions() {
        return new AdminFeeCouponActionEligibility(true, false, false, false, true, true, true,
                List.of("Create/edit/enable actions disabled for MVP.",
                        "Buyer screens must never receive seller commission or waiver configuration."));
    }

    public static AdminFeeCouponConfigResponse feeCouponConfig(String ruleId) {
        List<AdminConfigRuleCard> cards = ruleCards();
        return new AdminFeeCouponConfigResponse(
                new AdminFeeCouponSummary(2, 1, 1, 1, 1, 1, 1, LocalDateTime.now()),
                cards, ruleDetail(ruleId == null ? cards.get(0).ruleId() : ruleId), feeCouponActions(),
                "Admin-only fee, coupon, waiver, hold, refund, and risk placeholders.", LocalDateTime.now());
    }

    public static List<AdminConfigRuleCard> ruleCards() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                rule("rule-platform-coupon", "Platform coupon cap", "PLATFORM_COUPON", "DIGITAL", "USA", true, 10,
                        "Platform-funded promo credits are backend controlled.", now),
                rule("rule-buyer-service-fee", "Buyer service fee", "BUYER_SERVICE_FEE", "DIGITAL", "USA", true, 20,
                        "Buyer-facing fee summary only; internal split hidden.", now),
                rule("rule-seller-commission", "Seller commission", "SELLER_COMMISSION", "DIGITAL", "USA", true, 30,
                        "Admin-only seller commission placeholder; never sent to buyer UI.", now),
                rule("rule-seller-waiver", "Launch seller waiver", "SELLER_WAIVER", "DIGITAL", "USA", true, 40,
                        "Admin-only seller waiver placeholder.", now),
                rule("rule-free-promo", "Free promotional product flow", "FREE_PRODUCT_PROMO", "DIGITAL", "USA", false, 50,
                        "Checkout/payment restrictions remain backend controlled.", now),
                rule("rule-credit-giveaway", "Sharity Credit giveaway", "CREDIT_GIVEAWAY", "DIGITAL", "USA", true, 60,
                        "Non-withdrawable credits and giveaway limits.", now),
                rule("rule-seller-hold", "Seller reserve hold", "SELLER_HOLD", "DIGITAL", "USA", true, 70,
                        "Seller-safe hold indicators only; raw algorithm hidden.", now),
                rule("rule-refund-reveal", "Refund after digital reveal", "REFUND_APPROVAL", "DIGITAL", "USA", true, 80,
                        "Admin approval placeholder for revealed digital items.", now),
                rule("rule-new-seller-max", "New seller max order value", "NEW_SELLER_LIMIT", "DIGITAL", "USA", true, 90,
                        "Order value limit placeholder for new sellers.", now),
                rule("rule-seller-abuse", "Seller abuse/suspension", "RISK_RULE_PLACEHOLDER", "DIGITAL", "USA", true, 100,
                        "Private internal risk placeholder; no score exposed.", now));
    }

    public static AdminConfigRuleDetail ruleDetail(String ruleId) {
        return new AdminConfigRuleDetail(ruleId, titleize(ruleId), typeFromRule(ruleId), "USA / DIGITAL",
                true, true, true,
                List.of("Admin-only configuration", "Backend is source of truth",
                        "Provider payloads, risk scores, and private notes are hidden"),
                List.of("Do not expose seller commission or seller waiver configuration to buyer screens."),
                feeCouponActions(), "Rule details are admin-safe placeholders only.", LocalDateTime.now());
    }

    public static AdminFeeCouponActionResponse feeCouponAction() {
        return new AdminFeeCouponActionResponse(true, "REFRESHED",
                "Fee/coupon/waiver placeholder config refreshed.", "/admin/config/fees-coupons",
                LocalDateTime.now());
    }

    public static FinalMvpQaResponse finalQa() {
        return new FinalMvpQaResponse(mockUsers(), routeGuards(), mockDataBundles(), qaChecks(),
                List.of("Full invoice/tax logic deferred", "Full admin operations deferred",
                        "Refund/dispute operations partially placeholder", "Stripe later",
                        "Physical/grocery/meat/automotive/rental marketplaces later",
                        "Push/email/SMS notification channels later", "Full analytics later"),
                "Final MVP mock QA contract covers users, guards, data bundles, and sensitive-data checks.",
                LocalDateTime.now());
    }

    public static List<MvpMockUser> mockUsers() {
        return List.of(
                new MvpMockUser("guest", "Guest user", List.of(), true, false, false, false, false),
                new MvpMockUser("buyer", "Buyer only user", List.of("USER", "CUSTOMER"), false, false, true, true, false),
                new MvpMockUser("buyer-incomplete", "Buyer with incomplete profile", List.of("USER", "CUSTOMER"), false, false, false, true, false),
                new MvpMockUser("buyer-unverified", "Buyer with unverified email", List.of("USER", "CUSTOMER"), false, false, true, false, false),
                new MvpMockUser("dual-role", "Buyer-seller dual-role user", List.of("USER", "CUSTOMER", "SELLER"), false, true, true, true, false),
                new MvpMockUser("seller-eligible", "Seller eligible user", List.of("USER", "SELLER"), false, true, true, true, false),
                new MvpMockUser("seller-blocked", "Seller not eligible user", List.of("USER", "SELLER"), false, false, true, true, false),
                new MvpMockUser("admin", "Admin user", List.of("USER", "ADMIN"), false, false, true, true, false),
                new MvpMockUser("access-denied", "Access denied user", List.of("USER"), false, false, true, true, true));
    }

    public static List<MvpRouteGuardRule> routeGuards() {
        return List.of(
                new MvpRouteGuardRule("/app/**", "AUTH", List.of("USER", "CUSTOMER", "SELLER", "ADMIN"),
                        "/login", false, "Guest users redirect to login."),
                new MvpRouteGuardRule("/seller/**", "SELLER", List.of("SELLER"), "/seller/onboarding",
                        true, "Seller routes are hidden or blocked for non-sellers."),
                new MvpRouteGuardRule("/admin/**", "ADMIN", List.of("ADMIN"), "/access-denied",
                        true, "Admin routes are hidden from buyer and seller navigation."),
                new MvpRouteGuardRule("/orders/**", "OWNERSHIP", List.of("CUSTOMER", "SELLER", "ADMIN"),
                        "/access-denied", false, "Order routes require backend ownership checks."),
                new MvpRouteGuardRule("/digital-delivery/**", "OWNERSHIP_SECURE_REVEAL", List.of("CUSTOMER"),
                        "/access-denied", false, "Digital payloads are available only through secure reveal."));
    }

    public static List<MvpMockDataBundle> mockDataBundles() {
        return List.of(
                bundle("marketplace", "Marketplace catalog", "READY", "empty, digital listings, available/unavailable PDP"),
                bundle("cart-checkout", "Cart and checkout", "READY", "multi-seller cart, checkout ready, checkout blocked"),
                bundle("payment", "Payment authorization", "READY", "PayPal success, pending, failed, cancelled"),
                bundle("orders", "Orders", "READY", "parent order, seller groups, receipt placeholder"),
                bundle("digital", "Digital delivery", "READY", "ready, pending, revealed, issue; no raw payload in lists"),
                bundle("refunds-disputes", "Refunds and disputes", "READY", "requested, pending, refunded, active, resolved"),
                bundle("seller", "Seller flows", "READY", "incoming orders, fulfillment, payouts, wallet, coupons"),
                bundle("messages-notifications", "Messages and notifications", "READY", "policy warnings, unread alerts, settings placeholder"),
                bundle("admin", "Admin placeholders", "READY", "config, review, country matrix, fees/coupons"));
    }

    public static List<MvpQaCheck> qaChecks() {
        return List.of(
                new MvpQaCheck("COMPILE", "Marketplace service compiles", "READY_FOR_VERIFY",
                        "Run mvn -q -DskipTests compile in marketplace-service.", true),
                new MvpQaCheck("ADMIN_GUARD", "Admin routes guarded", "MOCK_READY",
                        "Admin route contract hides /admin/** from normal users.", true),
                new MvpQaCheck("SELLER_GUARD", "Seller routes guarded", "MOCK_READY",
                        "Seller route contract blocks non-seller users.", true),
                new MvpQaCheck("SENSITIVE_DATA", "Sensitive data absent", "MOCK_READY",
                        "DTOs use masked summaries and contain no tokens, raw provider payloads, or raw digital payloads.", true),
                new MvpQaCheck("EMPTY_ERROR_LOADING", "UI state coverage", "DOCUMENTED",
                        "State requirements documented for frontend implementation.", false));
    }

    private static AdminConfigAreaCard configArea(String code, String title, String description, boolean enabled,
                                                  LocalDateTime now) {
        return new AdminConfigAreaCard(code, title, description, enabled ? "PLACEHOLDER_READY" : "COMING_SOON",
                enabled, true, now, "/admin/config/" + code,
                "Read-only admin placeholder. Backend required for edits.");
    }

    private static AdminReviewQueueItem reviewItem(String id, String type, String entityId, String reference,
                                                   String status, String severity, String title, String summary,
                                                   LocalDateTime now) {
        return new AdminReviewQueueItem(id, type, entityId, reference, status, severity, title, summary, now,
                "/admin/review/items/" + id, reviewActions());
    }

    private static AdminConfigRuleCard rule(String id, String name, String type, String marketplace, String country,
                                            boolean enabled, int priority, String summary, LocalDateTime now) {
        return new AdminConfigRuleCard(id, name, type, marketplace, country, enabled ? "ENABLED" : "DISABLED",
                enabled, priority, summary, "/admin/config/fees-coupons/" + id, now);
    }

    private static MvpMockDataBundle bundle(String key, String title, String status, String states) {
        return new MvpMockDataBundle(key, title, status, List.of(states.split(", ")), false);
    }

    private static String titleize(String code) {
        if (code == null || code.isBlank()) {
            return "Admin Placeholder";
        }
        String normalized = code.replace("rule-", "").replace('-', ' ').replace('_', ' ');
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private static String typeFromId(String id) {
        if (id == null) {
            return "ORDER";
        }
        if (id.contains("refund")) {
            return "REFUND";
        }
        if (id.contains("dispute")) {
            return "DISPUTE";
        }
        if (id.contains("delivery")) {
            return "DIGITAL_DELIVERY_ISSUE";
        }
        if (id.contains("payment")) {
            return "PAYMENT_ISSUE";
        }
        return "ORDER";
    }

    private static String typeFromRule(String ruleId) {
        if (ruleId == null) {
            return "PLATFORM_COUPON";
        }
        if (ruleId.contains("commission")) {
            return "SELLER_COMMISSION";
        }
        if (ruleId.contains("waiver")) {
            return "SELLER_WAIVER";
        }
        if (ruleId.contains("hold")) {
            return "SELLER_HOLD";
        }
        if (ruleId.contains("refund")) {
            return "REFUND_APPROVAL";
        }
        if (ruleId.contains("risk") || ruleId.contains("abuse")) {
            return "RISK_RULE_PLACEHOLDER";
        }
        if (ruleId.contains("fee")) {
            return "BUYER_SERVICE_FEE";
        }
        return "PLATFORM_COUPON";
    }
}
