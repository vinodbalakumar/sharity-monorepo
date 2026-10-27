package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.BuyerCommerceFlowDtos;
import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.service.MarketplaceMasterService;
import com.java.vinod.marketplace.service.service.MarketplaceService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Mock buyer cart-to-order APIs for STORY-058, STORY-059, and STORY-060.
 */
@RestController
public class BuyerCommerceFlowController {
    private final MarketplaceService marketplaceService;
    private final MarketplaceMasterService marketplaceMasterService;

    public BuyerCommerceFlowController(MarketplaceService marketplaceService,
                                       MarketplaceMasterService marketplaceMasterService) {
        this.marketplaceService = marketplaceService;
        this.marketplaceMasterService = marketplaceMasterService;
    }

    @GetMapping("/api/profile/completion")
    public BuyerCommerceFlowDtos.ProfileCompletionResponse profileCompletion() {
        return BuyerCommerceFlowDtos.mockProfileCompletion();
    }

    @GetMapping("/api/profile/requirements")
    public java.util.List<BuyerCommerceFlowDtos.ProfileRequirement> profileRequirements() {
        return BuyerCommerceFlowDtos.mockProfileCompletion().requirements();
    }

    @PutMapping("/api/profile")
    public BuyerCommerceFlowDtos.ProfileCompletionActionResponse updateProfile(
            @RequestBody(required = false) BuyerCommerceFlowDtos.ProfileUpdateRequest request) {
        return BuyerCommerceFlowDtos.profileAction("PROFILE_SAVED", "Profile saved.", "/profile/completion");
    }

    @PostMapping("/api/profile/country")
    public BuyerCommerceFlowDtos.ProfileCompletionActionResponse updateCountry(@RequestBody(required = false) Object request) {
        return BuyerCommerceFlowDtos.profileAction("COUNTRY_UPDATED", "Country updated with backend validation.", "/profile/country");
    }

    @PostMapping("/api/profile/phone")
    public BuyerCommerceFlowDtos.ProfileCompletionActionResponse updatePhone(
            @RequestBody(required = false) BuyerCommerceFlowDtos.PhoneUpdateRequest request) {
        return BuyerCommerceFlowDtos.profileAction("PHONE_UPDATED", "Phone updated. Verification may be required.", "/profile/phone");
    }

    @PostMapping("/api/profile/phone/verify/start")
    public BuyerCommerceFlowDtos.PhoneVerificationStartResponse startPhoneVerification() {
        return new BuyerCommerceFlowDtos.PhoneVerificationStartResponse(true, "phone-verification-083",
                "STARTED", "Phone verification placeholder started.");
    }

    @PostMapping("/api/profile/phone/verify/complete")
    public BuyerCommerceFlowDtos.ProfileCompletionActionResponse completePhoneVerification() {
        return BuyerCommerceFlowDtos.profileAction("PHONE_VERIFIED", "Phone verified.", "/profile/completion");
    }

    @GetMapping("/api/profile/marketplace-preferences")
    public java.util.List<BuyerCommerceFlowDtos.MarketplacePreferenceItem> marketplacePreferences() {
        return BuyerCommerceFlowDtos.mockProfileCompletion().marketplacePreferences();
    }

    @PutMapping("/api/profile/marketplace-preferences")
    public BuyerCommerceFlowDtos.ProfileCompletionActionResponse updateMarketplacePreferences(
            @RequestBody(required = false) BuyerCommerceFlowDtos.MarketplacePreferencesUpdateRequest request) {
        return BuyerCommerceFlowDtos.profileAction("MARKETPLACE_PREFERENCES_UPDATED",
                "Marketplace preferences updated.", "/profile/preferences");
    }

    @GetMapping("/api/profile/currency-options")
    public java.util.List<BuyerCommerceFlowDtos.CurrencyDisplayOption> currencyOptions() {
        return BuyerCommerceFlowDtos.mockProfileCompletion().currencyOptions();
    }

    @PutMapping("/api/profile/currency-display")
    public BuyerCommerceFlowDtos.ProfileCompletionActionResponse updateCurrencyDisplay(@RequestBody(required = false) Object request) {
        return BuyerCommerceFlowDtos.profileAction("CURRENCY_DISPLAY_UPDATED",
                "Currency display preference updated.", "/profile/currency");
    }

    @GetMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}/receipt")
    public BuyerCommerceFlowDtos.ReceiptResponse sellerGroupReceipt(@PathVariable String orderId,
                                                                    @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockReceipt(orderId, sellerOrderId, "receipt-085-" + sellerOrderId);
    }

    @GetMapping("/api/buyer/receipts/{receiptId}")
    public BuyerCommerceFlowDtos.ReceiptResponse buyerReceiptById(@PathVariable String receiptId) {
        return BuyerCommerceFlowDtos.mockReceipt("order-085", null, receiptId);
    }

    @GetMapping("/api/buyer/receipts/{receiptId}/actions")
    public BuyerCommerceFlowDtos.ReceiptActionEligibility buyerReceiptActions(@PathVariable String receiptId) {
        return BuyerCommerceFlowDtos.mockReceipt("order-085", null, receiptId).actionEligibility();
    }

    @PostMapping("/api/buyer/receipts/{receiptId}/download-placeholder")
    public BuyerCommerceFlowDtos.ReceiptActionResponse receiptDownload(@PathVariable String receiptId) {
        return BuyerCommerceFlowDtos.receiptAction("RECEIPT_DOWNLOAD_PLACEHOLDER",
                "Receipt PDF download placeholder accepted.", "/receipts/" + receiptId);
    }

    @PostMapping("/api/buyer/receipts/{receiptId}/share-placeholder")
    public BuyerCommerceFlowDtos.ReceiptActionResponse receiptShare(@PathVariable String receiptId) {
        return BuyerCommerceFlowDtos.receiptAction("RECEIPT_SHARE_PLACEHOLDER",
                "Receipt share placeholder accepted.", "/receipts/" + receiptId);
    }

    @GetMapping("/api/seller/listings")
    public BuyerCommerceFlowDtos.SellerListingsResponse sellerListings(
            @RequestParam String providerAccountPublicId,
            @AuthenticationPrincipal Jwt jwt) {
        return toSellerListingsResponse(marketplaceService.sellerListings(providerAccountPublicId, jwt));
    }

    @GetMapping("/api/seller/listings/summary")
    public BuyerCommerceFlowDtos.SellerListingsSummary sellerListingsSummary(
            @RequestParam String providerAccountPublicId,
            @AuthenticationPrincipal Jwt jwt) {
        return summarize(toSellerListingsResponse(marketplaceService.sellerListings(providerAccountPublicId, jwt)).listings());
    }

    @GetMapping("/api/seller/listings/search")
    public BuyerCommerceFlowDtos.SellerListingsResponse searchSellerListings(
            @RequestParam String providerAccountPublicId,
            @AuthenticationPrincipal Jwt jwt) {
        return toSellerListingsResponse(marketplaceService.sellerListings(providerAccountPublicId, jwt));
    }

    @PostMapping("/api/seller/listings/refresh")
    public BuyerCommerceFlowDtos.SellerListingActionResponse refreshSellerListings() {
        return BuyerCommerceFlowDtos.sellerListingAction("SELLER_LISTINGS_REFRESHED",
                "Seller listings refreshed.", "/seller/listings");
    }

    @GetMapping("/api/seller/listings/{listingId}")
    public BuyerCommerceFlowDtos.SellerListingCard sellerListing(@PathVariable String listingId,
                                                                 @AuthenticationPrincipal Jwt jwt) {
        return toSellerListingCard(marketplaceService.sellerListing(listingId, jwt), categoryLookup());
    }

    @GetMapping("/api/seller/listings/{listingId}/actions")
    public BuyerCommerceFlowDtos.SellerListingActionEligibility sellerListingActions(@PathVariable String listingId) {
        return new BuyerCommerceFlowDtos.SellerListingActionEligibility(true, true, true, false,
                true, true, true, true, true, java.util.List.of());
    }

    @GetMapping("/api/seller/listings/{listingId}/orders-summary")
    public BuyerCommerceFlowDtos.SellerListingOrdersSummary sellerListingOrdersSummary(
            @PathVariable String listingId) {
        return new BuyerCommerceFlowDtos.SellerListingOrdersSummary(1, 1, 1, 4,
                "/seller/listings/" + listingId + "/orders");
    }

    @GetMapping("/api/seller/listings/{listingId}/analytics-placeholder")
    public BuyerCommerceFlowDtos.SellerListingAnalyticsPlaceholder sellerListingAnalyticsPlaceholder(
            @PathVariable String listingId) {
        return new BuyerCommerceFlowDtos.SellerListingAnalyticsPlaceholder(120, 18, 9, 4,
                true, "Analytics placeholder only; backend analytics can plug in later.");
    }

    @GetMapping("/api/seller/dashboard")
    public BuyerCommerceFlowDtos.SellerDashboardResponse sellerDashboard() {
        return BuyerCommerceFlowDtos.mockSellerDashboard();
    }

    @GetMapping("/api/seller/dashboard/store-status")
    public BuyerCommerceFlowDtos.SellerStoreStatusSummary sellerDashboardStoreStatus() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().storeStatus();
    }

    @GetMapping("/api/seller/dashboard/action-required")
    public java.util.List<BuyerCommerceFlowDtos.SellerActionRequiredItem> sellerDashboardActionRequired() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().actionRequired();
    }

    @GetMapping("/api/seller/dashboard/orders-summary")
    public BuyerCommerceFlowDtos.SellerOrdersDashboardSummary sellerDashboardOrdersSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().ordersSummary();
    }

    @GetMapping("/api/seller/dashboard/listings-summary")
    public BuyerCommerceFlowDtos.SellerListingsDashboardSummary sellerDashboardListingsSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().listingsSummary();
    }

    @GetMapping("/api/seller/dashboard/fulfillment-summary")
    public BuyerCommerceFlowDtos.SellerFulfillmentDashboardSummary sellerDashboardFulfillmentSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().fulfillmentSummary();
    }

    @GetMapping("/api/seller/dashboard/payout-summary")
    public BuyerCommerceFlowDtos.SellerPayoutDashboardSummary sellerDashboardPayoutSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().payoutSummary();
    }

    @GetMapping("/api/seller/dashboard/coupons-summary")
    public BuyerCommerceFlowDtos.SellerCouponsDashboardSummary sellerDashboardCouponsSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().couponsSummary();
    }

    @GetMapping("/api/seller/dashboard/messages-summary")
    public BuyerCommerceFlowDtos.SellerMessagesDashboardSummary sellerDashboardMessagesSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().messagesSummary();
    }

    @GetMapping("/api/seller/dashboard/alerts-summary")
    public BuyerCommerceFlowDtos.SellerAlertsDashboardSummary sellerDashboardAlertsSummary() {
        return BuyerCommerceFlowDtos.mockSellerDashboard().alertsSummary();
    }

    @PostMapping("/api/seller/dashboard/refresh")
    public BuyerCommerceFlowDtos.SellerDashboardActionResponse refreshSellerDashboard() {
        return BuyerCommerceFlowDtos.sellerDashboardAction("SELLER_DASHBOARD_REFRESHED",
                "Seller dashboard refreshed.", "/seller/dashboard");
    }

    @GetMapping("/api/navigation/session")
    public BuyerCommerceFlowDtos.NavigationSessionResponse navigationSession() {
        return BuyerCommerceFlowDtos.mockNavigationSession();
    }

    @GetMapping("/api/navigation/route-access")
    public BuyerCommerceFlowDtos.RouteAccessResponse navigationRouteAccess(
            @RequestParam(defaultValue = "/") String route) {
        return BuyerCommerceFlowDtos.mockRouteAccess(route);
    }

    @GetMapping("/api/navigation/badges")
    public BuyerCommerceFlowDtos.NavigationBadgesResponse navigationBadges() {
        return BuyerCommerceFlowDtos.mockNavigationSession().badges();
    }

    @GetMapping("/api/navigation/role-summary")
    public BuyerCommerceFlowDtos.UserRoleSummary navigationRoleSummary() {
        return BuyerCommerceFlowDtos.mockNavigationSession().roleSummary();
    }

    @PostMapping("/api/navigation/preferred-role")
    public BuyerCommerceFlowDtos.NavigationSessionResponse preferredRole(
            @RequestBody(required = false) BuyerCommerceFlowDtos.PreferredRoleRequest request) {
        return BuyerCommerceFlowDtos.mockNavigationSession();
    }

    @GetMapping("/api/navigation/deep-link/resolve")
    public BuyerCommerceFlowDtos.DeepLinkResolveResponse resolveDeepLink(
            @RequestParam(defaultValue = "/listing/listing-076-active") String url) {
        return BuyerCommerceFlowDtos.mockDeepLink(url);
    }

    @GetMapping("/api/seller/wallet")
    public BuyerCommerceFlowDtos.SellerWalletDashboardResponse sellerWallet() {
        return BuyerCommerceFlowDtos.mockSellerWallet();
    }

    @GetMapping("/api/seller/wallet/summary")
    public BuyerCommerceFlowDtos.SellerWalletSummary sellerWalletSummary() {
        return BuyerCommerceFlowDtos.mockSellerWallet().summary();
    }

    @GetMapping("/api/seller/wallet/projections")
    public java.util.List<BuyerCommerceFlowDtos.SellerBalanceProjection> sellerWalletProjections() {
        return BuyerCommerceFlowDtos.mockSellerWallet().projections();
    }

    @GetMapping("/api/seller/wallet/transactions")
    public java.util.List<BuyerCommerceFlowDtos.SellerWalletTransaction> sellerWalletTransactions() {
        return BuyerCommerceFlowDtos.mockSellerWallet().transactions();
    }

    @GetMapping("/api/seller/wallet/holds")
    public java.util.List<BuyerCommerceFlowDtos.SellerWalletHold> sellerWalletHolds() {
        return BuyerCommerceFlowDtos.mockSellerWallet().holds();
    }

    @GetMapping("/api/seller/wallet/payout-method/status")
    public BuyerCommerceFlowDtos.SellerPayoutMethodSummary sellerWalletPayoutMethod() {
        return BuyerCommerceFlowDtos.mockSellerWallet().payoutMethod();
    }

    @GetMapping("/api/seller/wallet/payout-history")
    public java.util.List<BuyerCommerceFlowDtos.SellerWalletPayoutHistoryItem> sellerWalletPayoutHistory() {
        return BuyerCommerceFlowDtos.mockSellerWallet().payoutHistory();
    }

    @GetMapping("/api/seller/wallet/actions")
    public BuyerCommerceFlowDtos.SellerWalletActionEligibility sellerWalletActions() {
        return BuyerCommerceFlowDtos.mockSellerWallet().actionEligibility();
    }

    @PostMapping("/api/seller/wallet/refresh")
    public BuyerCommerceFlowDtos.SellerWalletActionResponse refreshSellerWallet() {
        return BuyerCommerceFlowDtos.sellerWalletAction("SELLER_WALLET_REFRESHED",
                "Seller wallet projection refreshed.", "/seller/wallet");
    }

    @PostMapping("/api/seller/wallet/request-payout")
    public BuyerCommerceFlowDtos.SellerWalletActionResponse requestSellerPayout() {
        return BuyerCommerceFlowDtos.sellerWalletAction("PAYOUT_REQUEST_DISABLED",
                "Request payout is disabled until backend eligibility allows it.", "/seller/wallet");
    }

    @GetMapping("/api/coupons/available")
    public java.util.List<BuyerCommerceFlowDtos.CouponItem> availableCoupons() {
        return BuyerCommerceFlowDtos.mockCouponBreakdown("CART", "cart-057").availableCoupons();
    }

    @GetMapping("/api/coupons/saved")
    public java.util.List<BuyerCommerceFlowDtos.CouponItem> savedCoupons() {
        return BuyerCommerceFlowDtos.mockCouponBreakdown("CART", "cart-057").appliedCoupons();
    }

    @GetMapping("/api/checkout/{checkoutId}/coupons")
    public BuyerCommerceFlowDtos.CouponBreakdownPageResponse checkoutCoupons(@PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.mockCouponBreakdown("CHECKOUT", checkoutId);
    }

    @PostMapping("/api/coupons/{couponId}/save")
    public BuyerCommerceFlowDtos.CouponActionResponse saveCoupon(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.couponAction("COUPON_SAVED", "Coupon saved.", "/coupons");
    }

    @GetMapping("/api/coupons/{couponId}/details")
    public BuyerCommerceFlowDtos.CouponItem couponDetails(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.mockCouponBreakdown("CART", "cart-057").availableCoupons().get(0);
    }

    @GetMapping("/api/coupons/breakdown")
    public BuyerCommerceFlowDtos.CouponBreakdownPageResponse couponBreakdown() {
        return BuyerCommerceFlowDtos.mockCouponBreakdown("CART", "cart-057");
    }

    @GetMapping("/api/seller/coupons")
    public BuyerCommerceFlowDtos.SellerCouponsResponse sellerCoupons() {
        return BuyerCommerceFlowDtos.mockSellerCoupons();
    }

    @GetMapping("/api/seller/coupons/summary")
    public BuyerCommerceFlowDtos.SellerCouponSummary sellerCouponSummary() {
        return BuyerCommerceFlowDtos.mockSellerCoupons().summary();
    }

    @GetMapping("/api/seller/coupons/{couponId}")
    public BuyerCommerceFlowDtos.SellerCoupon sellerCoupon(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.mockSellerCoupons().coupons().stream()
                .filter(coupon -> coupon.couponId().equals(couponId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockSellerCoupons().coupons().get(0));
    }

    @PostMapping("/api/seller/coupons")
    public BuyerCommerceFlowDtos.SellerCouponActionResponse createSellerCoupon(
            @RequestBody(required = false) BuyerCommerceFlowDtos.SellerCouponForm request) {
        return BuyerCommerceFlowDtos.sellerCouponAction("SELLER_COUPON_CREATED",
                "Seller coupon created.", "/seller/coupons/seller-coupon-073");
    }

    @PutMapping("/api/seller/coupons/{couponId}")
    public BuyerCommerceFlowDtos.SellerCouponActionResponse updateSellerCoupon(
            @PathVariable String couponId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SellerCouponForm request) {
        return BuyerCommerceFlowDtos.sellerCouponAction("SELLER_COUPON_UPDATED",
                "Seller coupon updated.", "/seller/coupons/" + couponId);
    }

    @PostMapping("/api/seller/coupons/{couponId}/pause")
    public BuyerCommerceFlowDtos.SellerCouponActionResponse pauseSellerCoupon(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.sellerCouponAction("SELLER_COUPON_PAUSED",
                "Seller coupon paused.", "/seller/coupons/" + couponId);
    }

    @PostMapping("/api/seller/coupons/{couponId}/resume")
    public BuyerCommerceFlowDtos.SellerCouponActionResponse resumeSellerCoupon(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.sellerCouponAction("SELLER_COUPON_RESUMED",
                "Seller coupon resumed.", "/seller/coupons/" + couponId);
    }

    @PostMapping("/api/seller/coupons/{couponId}/archive")
    public BuyerCommerceFlowDtos.SellerCouponActionResponse archiveSellerCoupon(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.sellerCouponAction("SELLER_COUPON_ARCHIVED",
                "Seller coupon archived.", "/seller/coupons");
    }

    @GetMapping("/api/seller/coupons/{couponId}/analytics")
    public BuyerCommerceFlowDtos.SellerCouponAnalyticsPlaceholder sellerCouponAnalytics(@PathVariable String couponId) {
        return new BuyerCommerceFlowDtos.SellerCouponAnalyticsPlaceholder(couponId, 12,
                new java.math.BigDecimal("60.00"), "USD", "Analytics placeholder.");
    }

    @GetMapping("/api/seller/coupons/eligibility")
    public BuyerCommerceFlowDtos.SellerCouponEligibility sellerCouponEligibility() {
        return new BuyerCommerceFlowDtos.SellerCouponEligibility(true,
                java.util.List.of("STORE", "CATEGORY", "LISTING"), 10,
                new java.math.BigDecimal("50.00"), "USD", java.util.List.of(),
                "Seller can create seller-funded coupons.");
    }

    @GetMapping("/api/seller/coupons/listing-options")
    public java.util.List<java.util.Map<String, String>> sellerCouponListingOptions() {
        return java.util.List.of(java.util.Map.of("listingId", "listing-075", "title", "Premium Template Pack"));
    }

    @GetMapping("/api/buyer/rewards")
    public BuyerCommerceFlowDtos.RewardsDashboardResponse rewards() {
        return BuyerCommerceFlowDtos.mockRewards();
    }

    @GetMapping("/api/buyer/rewards/credits")
    public java.util.List<BuyerCommerceFlowDtos.SharityCreditItem> rewardCredits() {
        return BuyerCommerceFlowDtos.mockRewards().credits();
    }

    @GetMapping("/api/buyer/rewards/summary")
    public BuyerCommerceFlowDtos.SharityCreditSummary rewardSummary() {
        return BuyerCommerceFlowDtos.mockRewards().summary();
    }

    @GetMapping("/api/buyer/rewards/giveaways")
    public java.util.List<BuyerCommerceFlowDtos.GiveawayRewardItem> rewardGiveaways() {
        return BuyerCommerceFlowDtos.mockRewards().giveaways();
    }

    @GetMapping("/api/buyer/rewards/history")
    public java.util.List<BuyerCommerceFlowDtos.RewardHistoryItem> rewardHistory() {
        return BuyerCommerceFlowDtos.mockRewards().history();
    }

    @GetMapping("/api/buyer/rewards/credits/{creditId}")
    public BuyerCommerceFlowDtos.SharityCreditItem rewardCredit(@PathVariable String creditId) {
        return BuyerCommerceFlowDtos.mockRewards().credits().get(0);
    }

    @GetMapping("/api/buyer/rewards/credits/{creditId}/eligibility")
    public BuyerCommerceFlowDtos.CreditEligibility rewardCreditEligibility(@PathVariable String creditId) {
        return new BuyerCommerceFlowDtos.CreditEligibility(creditId, true,
                java.util.List.of("DIGITAL"), java.util.List.of("TEMPLATES"),
                new java.math.BigDecimal("20.00"), "Eligible in checkout when backend allows.");
    }

    @GetMapping("/api/buyer/rewards/actions")
    public BuyerCommerceFlowDtos.RewardsActionEligibility rewardActions() {
        return BuyerCommerceFlowDtos.mockRewards().actionEligibility();
    }

    @GetMapping("/api/seller/listings/create/eligibility")
    public BuyerCommerceFlowDtos.SellerListingCreateEligibility listingCreateEligibility(
            @RequestParam String providerAccountPublicId,
            @AuthenticationPrincipal Jwt jwt) {
        marketplaceService.sellerListings(providerAccountPublicId, jwt);
        return new BuyerCommerceFlowDtos.SellerListingCreateEligibility(true, true, true, true,
                java.util.List.of(), "Seller can create digital listings.");
    }

    @GetMapping("/api/seller/listings/create/marketplaces")
    public java.util.List<BuyerCommerceFlowDtos.ListingMarketplaceOption> listingMarketplaces() {
        return listingFormConfig().marketplaces();
    }

    @GetMapping("/api/seller/listings/create/categories")
    public java.util.List<BuyerCommerceFlowDtos.ListingCategoryOption> listingCategories() {
        return listingFormConfig().categories();
    }

    @GetMapping("/api/seller/listings/create/form-config")
    public BuyerCommerceFlowDtos.ListingFormConfig listingFormConfig() {
        String marketplaceVerticalCode = marketplaceService.defaultVerticalCode();
        String marketplaceDisplayName = marketplaceDisplayName(marketplaceVerticalCode);
        List<BuyerCommerceFlowDtos.ListingProductTypeOption> productTypes = marketplaceMasterService.productTypes().stream()
                .map(productType -> new BuyerCommerceFlowDtos.ListingProductTypeOption(
                        productType.productTypeCode(),
                        productType.displayLabel(),
                        productType.description(),
                        productType.active(),
                        productType.sortOrder()))
                .toList();
        List<BuyerCommerceFlowDtos.ListingDeliveryTypeOption> deliveryTypes = marketplaceMasterService.deliveryTypes().stream()
                .map(deliveryType -> new BuyerCommerceFlowDtos.ListingDeliveryTypeOption(
                        deliveryType.deliveryTypeCode(),
                        deliveryType.displayLabel(),
                        deliveryType.description(),
                        deliveryType.digitalDelivery(),
                        deliveryType.active(),
                        deliveryType.sortOrder()))
                .toList();
        List<BuyerCommerceFlowDtos.ListingCategoryOption> categories = marketplaceService.activeCategories(marketplaceVerticalCode).stream()
            .map(category -> new BuyerCommerceFlowDtos.ListingCategoryOption(
                category.code(),
                category.name(),
                marketplaceVerticalCode,
                category.active(),
                true,
                null))
            .toList();
        return new BuyerCommerceFlowDtos.ListingFormConfig(
            List.of(new BuyerCommerceFlowDtos.ListingMarketplaceOption(marketplaceVerticalCode, marketplaceDisplayName, true, null)),
            categories,
            productTypes,
            deliveryTypes,
            List.of("USD", "EUR", "GBP", "INR"),
            List.of(
                new BuyerCommerceFlowDtos.ListingReachScopeOption("NATIONAL", "National Seller", "Visible to buyers in the seller's operating country."),
                new BuyerCommerceFlowDtos.ListingReachScopeOption("GLOBAL", "Global Seller", "Visible to buyers across supported markets.")
            ),
            List.of(
                new BuyerCommerceFlowDtos.ListingPolicyRequirement("NO_CHAT_CODE_SHARING", "Do not share digital codes in chat", true, true, "/seller/policies/digital-delivery"),
                new BuyerCommerceFlowDtos.ListingPolicyRequirement("SELLER_MODERATION", "Listings may be reviewed before activation", true, true, "/seller/policies/moderation")
            ),
            "Listing options loaded from the live marketplace catalog.");
    }

    @PostMapping("/api/seller/listings/drafts")
        public BuyerCommerceFlowDtos.ListingDraft createListingDraft(
            @Valid @RequestBody BuyerCommerceFlowDtos.SellerListingDraftRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        MarketplaceDtos.ListingResponse listing = marketplaceService.createListing(toListingRequest(request, "DRAFT"), jwt);
        return toListingDraft(listing);
    }

    @PatchMapping("/api/seller/listings/drafts/{draftId}")
    public BuyerCommerceFlowDtos.ListingDraft updateListingDraft(@PathVariable String draftId,
                                     @Valid @RequestBody BuyerCommerceFlowDtos.SellerListingDraftRequest request,
                                     @AuthenticationPrincipal Jwt jwt) {
        MarketplaceDtos.ListingResponse listing = marketplaceService.updateListing(draftId, toListingRequest(request, "DRAFT"), jwt);
        return toListingDraft(listing);
    }

    @PostMapping("/api/seller/listings/drafts/{draftId}/media")
    public BuyerCommerceFlowDtos.ListingMediaUploadResponse uploadListingMedia(@PathVariable String draftId) {
        return new BuyerCommerceFlowDtos.ListingMediaUploadResponse(true, "media-075",
                "marketplace/placeholders/gift_cards.png", "UPLOADED", "Media uploaded.");
    }

    @DeleteMapping("/api/seller/listings/drafts/{draftId}/media/{mediaId}")
    public BuyerCommerceFlowDtos.ListingCreateActionResponse deleteListingMedia(@PathVariable String draftId,
                                                                                @PathVariable String mediaId) {
        return BuyerCommerceFlowDtos.listingAction("LISTING_MEDIA_DELETED",
                "Listing media deleted.", "/seller/listings/create/media");
    }

    @PostMapping("/api/seller/listings/drafts/{draftId}/preview")
    public BuyerCommerceFlowDtos.ListingCreateActionResponse previewListingDraft(@PathVariable String draftId,
                                                                                 @AuthenticationPrincipal Jwt jwt) {
        marketplaceService.sellerListing(draftId, jwt);
        return BuyerCommerceFlowDtos.listingAction("LISTING_PREVIEW_READY",
                "Listing preview ready.", "/seller/listings/create/review");
    }

    @PostMapping("/api/seller/listings/drafts/{draftId}/publish")
    public BuyerCommerceFlowDtos.ListingPublishResponse publishListingDraft(
            @PathVariable String draftId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.ListingPublishRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        MarketplaceDtos.ListingResponse listing = marketplaceService.submitListingForModeration(draftId, jwt);
        return new BuyerCommerceFlowDtos.ListingPublishResponse(true, listing.publicId(),
            listing.listingStatus(), "/seller/listings/" + listing.publicId(),
                "Listing submitted and may enter moderation.", java.time.LocalDateTime.now());
    }

    @GetMapping("/api/seller/listings/policy-requirements")
    public java.util.List<BuyerCommerceFlowDtos.ListingPolicyRequirement> listingPolicyRequirements() {
        return listingFormConfig().policyRequirements();
    }

    @GetMapping("/api/buyer/digital-library")
    public BuyerCommerceFlowDtos.DigitalLibraryResponse digitalLibrary() {
        return BuyerCommerceFlowDtos.mockDigitalLibrary();
    }

    @GetMapping("/api/buyer/digital-library/summary")
    public BuyerCommerceFlowDtos.DigitalLibrarySummary digitalLibrarySummary() {
        return BuyerCommerceFlowDtos.mockDigitalLibrary().summary();
    }

    @GetMapping("/api/buyer/digital-library/items/{orderItemId}")
    public BuyerCommerceFlowDtos.DigitalLibraryItem digitalLibraryItem(@PathVariable String orderItemId) {
        return BuyerCommerceFlowDtos.mockDigitalLibrary().items().stream()
                .filter(item -> item.orderItemId().equals(orderItemId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockDigitalLibrary().items().get(0));
    }

    @GetMapping("/api/buyer/digital-library/search")
    public BuyerCommerceFlowDtos.DigitalLibraryResponse searchDigitalLibrary() {
        return BuyerCommerceFlowDtos.mockDigitalLibrary();
    }

    @PostMapping("/api/buyer/digital-library/refresh")
    public BuyerCommerceFlowDtos.DigitalLibraryActionResponse refreshDigitalLibrary() {
        return BuyerCommerceFlowDtos.digitalLibraryAction("DIGITAL_LIBRARY_REFRESHED",
                "Digital library refreshed.", "/digital-library");
    }

    @GetMapping("/api/buyer/digital-library/items/{orderItemId}/actions")
    public BuyerCommerceFlowDtos.DigitalLibraryActionEligibility digitalLibraryItemActions(
            @PathVariable String orderItemId) {
        return BuyerCommerceFlowDtos.mockDigitalLibraryActions(orderItemId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/refund/eligibility")
    public BuyerCommerceFlowDtos.RefundEligibilityResponse orderRefundEligibility(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockRefundEligibility(orderId, "ORDER", orderId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/refund/form")
    public BuyerCommerceFlowDtos.RefundRequestFormResponse orderRefundForm(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockRefundForm(orderId, "ORDER", orderId);
    }

    @PostMapping("/api/buyer/orders/{orderId}/refund/request")
    public BuyerCommerceFlowDtos.RefundRequestResponse submitOrderRefund(
            @PathVariable String orderId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SubmitRefundRequest request) {
        return BuyerCommerceFlowDtos.refundRequestAction("REFUND_REQUEST_SUBMITTED",
                "Refund request submitted for review.", "/refunds/refund-067");
    }

    @GetMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}/refund/eligibility")
    public BuyerCommerceFlowDtos.RefundEligibilityResponse sellerGroupRefundEligibility(
            @PathVariable String orderId, @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockRefundEligibility(orderId, "SELLER_GROUP", sellerOrderId);
    }

    @PostMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}/refund/request")
    public BuyerCommerceFlowDtos.RefundRequestResponse submitSellerGroupRefund(
            @PathVariable String orderId, @PathVariable String sellerOrderId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SubmitRefundRequest request) {
        return BuyerCommerceFlowDtos.refundRequestAction("REFUND_REQUEST_SUBMITTED",
                "Seller group refund request submitted.", "/refunds/refund-067");
    }

    @GetMapping("/api/buyer/orders/{orderId}/items/{orderItemId}/refund/eligibility")
    public BuyerCommerceFlowDtos.RefundEligibilityResponse itemRefundEligibility(
            @PathVariable String orderId, @PathVariable String orderItemId) {
        return BuyerCommerceFlowDtos.mockRefundEligibility(orderId, "ITEM", orderItemId);
    }

    @PostMapping("/api/buyer/orders/{orderId}/items/{orderItemId}/refund/request")
    public BuyerCommerceFlowDtos.RefundRequestResponse submitItemRefund(
            @PathVariable String orderId, @PathVariable String orderItemId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SubmitRefundRequest request) {
        return BuyerCommerceFlowDtos.refundRequestAction("REFUND_REQUEST_SUBMITTED",
                "Item refund request submitted.", "/refunds/refund-067");
    }

    @GetMapping("/api/buyer/refund-policy")
    public java.util.Map<String, Object> refundPolicy() {
        return java.util.Map.of("policyVersion", "REFUND_POLICY_2026_06",
                "digitalRevealWarning", "Reveal/access may reduce refund eligibility.",
                "route", "/policies/refunds");
    }

    @GetMapping("/api/buyer/refunds/{refundRequestId}")
    public BuyerCommerceFlowDtos.RefundStatusResponse refundStatus(@PathVariable String refundRequestId) {
        return BuyerCommerceFlowDtos.mockRefundStatus(refundRequestId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/refunds")
    public java.util.List<BuyerCommerceFlowDtos.RefundSummary> orderRefunds(@PathVariable String orderId) {
        return java.util.List.of(BuyerCommerceFlowDtos.mockRefundStatus("refund-067").summary());
    }

    @GetMapping("/api/buyer/refunds/{refundRequestId}/timeline")
    public java.util.List<BuyerCommerceFlowDtos.RefundTimelineItem> refundTimeline(
            @PathVariable String refundRequestId) {
        return BuyerCommerceFlowDtos.mockRefundStatus(refundRequestId).timeline();
    }

    @PostMapping("/api/buyer/refunds/{refundRequestId}/add-details")
    public BuyerCommerceFlowDtos.RefundActionResponse addRefundDetails(@PathVariable String refundRequestId) {
        return BuyerCommerceFlowDtos.refundAction("REFUND_DETAILS_ADDED",
                "Additional refund details added.", "/refunds/" + refundRequestId);
    }

    @PostMapping("/api/buyer/refunds/{refundRequestId}/cancel")
    public BuyerCommerceFlowDtos.RefundActionResponse cancelRefund(@PathVariable String refundRequestId) {
        return BuyerCommerceFlowDtos.refundAction("REFUND_CANCEL_REQUESTED",
                "Refund cancellation requested.", "/refunds/" + refundRequestId);
    }

    @GetMapping("/api/buyer/refunds/{refundRequestId}/actions")
    public BuyerCommerceFlowDtos.RefundActionEligibility refundActions(@PathVariable String refundRequestId) {
        return BuyerCommerceFlowDtos.mockRefundStatus(refundRequestId).actionEligibility();
    }

    @PostMapping("/api/buyer/refunds/{refundRequestId}/refresh")
    public BuyerCommerceFlowDtos.RefundActionResponse refreshRefund(@PathVariable String refundRequestId) {
        return BuyerCommerceFlowDtos.refundAction("REFUND_STATUS_REFRESHED",
                "Refund status refreshed.", "/refunds/" + refundRequestId);
    }

    @GetMapping("/api/buyer/disputes/{disputeId}")
    public BuyerCommerceFlowDtos.DisputeDetailResponse disputeDetail(@PathVariable String disputeId) {
        return BuyerCommerceFlowDtos.mockDispute(disputeId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/dispute/eligibility")
    public BuyerCommerceFlowDtos.DisputeEligibilityResponse disputeEligibility(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockDispute("dispute-069").eligibility();
    }

    @PostMapping("/api/buyer/orders/{orderId}/dispute")
    public BuyerCommerceFlowDtos.DisputeActionResponse submitOrderDispute(
            @PathVariable String orderId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SubmitDisputeRequest request) {
        return BuyerCommerceFlowDtos.disputeAction("DISPUTE_SUBMITTED",
                "Sharity Review submitted.", "/disputes/dispute-069");
    }

    @PostMapping("/api/buyer/orders/{orderId}/items/{orderItemId}/dispute")
    public BuyerCommerceFlowDtos.DisputeActionResponse submitItemDispute(
            @PathVariable String orderId, @PathVariable String orderItemId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SubmitDisputeRequest request) {
        return BuyerCommerceFlowDtos.disputeAction("DISPUTE_SUBMITTED",
                "Item Sharity Review submitted.", "/disputes/dispute-069");
    }

    @GetMapping("/api/buyer/disputes/{disputeId}/timeline")
    public java.util.List<BuyerCommerceFlowDtos.DisputeTimelineItem> disputeTimeline(
            @PathVariable String disputeId) {
        return BuyerCommerceFlowDtos.mockDispute(disputeId).timeline();
    }

    @PostMapping("/api/buyer/disputes/{disputeId}/add-details")
    public BuyerCommerceFlowDtos.DisputeActionResponse addDisputeDetails(@PathVariable String disputeId) {
        return BuyerCommerceFlowDtos.disputeAction("DISPUTE_DETAILS_ADDED",
                "Additional Sharity Review details added.", "/disputes/" + disputeId);
    }

    @PostMapping("/api/buyer/disputes/{disputeId}/close")
    public BuyerCommerceFlowDtos.DisputeActionResponse closeDispute(@PathVariable String disputeId) {
        return BuyerCommerceFlowDtos.disputeAction("DISPUTE_CLOSE_REQUESTED",
                "Sharity Review close requested.", "/disputes/" + disputeId);
    }

    @GetMapping("/api/buyer/disputes/{disputeId}/actions")
    public BuyerCommerceFlowDtos.DisputeActionEligibility disputeActions(@PathVariable String disputeId) {
        return BuyerCommerceFlowDtos.mockDispute(disputeId).actionEligibility();
    }

    @PostMapping("/api/buyer/disputes/{disputeId}/refresh")
    public BuyerCommerceFlowDtos.DisputeActionResponse refreshDispute(@PathVariable String disputeId) {
        return BuyerCommerceFlowDtos.disputeAction("DISPUTE_REFRESHED",
                "Sharity Review refreshed.", "/disputes/" + disputeId);
    }

    @GetMapping("/api/seller/payouts/dashboard")
    public BuyerCommerceFlowDtos.SellerPayoutDashboardResponse sellerPayoutDashboard() {
        return BuyerCommerceFlowDtos.mockSellerPayouts();
    }

    @GetMapping("/api/seller/payouts/summary")
    public BuyerCommerceFlowDtos.SellerPayoutSummary sellerPayoutSummary() {
        return BuyerCommerceFlowDtos.mockSellerPayouts().summary();
    }

    @GetMapping("/api/seller/payouts/eligibility")
    public BuyerCommerceFlowDtos.SellerPayoutEligibility sellerPayoutEligibility() {
        return BuyerCommerceFlowDtos.mockSellerPayouts().eligibility();
    }

    @GetMapping("/api/seller/payouts/orders")
    public java.util.List<BuyerCommerceFlowDtos.SellerPayoutOrderRow> sellerPayoutOrders() {
        return BuyerCommerceFlowDtos.mockSellerPayouts().orders();
    }

    @GetMapping("/api/seller/payouts/orders/{sellerOrderId}")
    public BuyerCommerceFlowDtos.SellerPayoutOrderRow sellerPayoutOrder(@PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerPayouts().orders().stream()
                .filter(order -> order.sellerOrderId().equals(sellerOrderId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockSellerPayouts().orders().get(0));
    }

    @GetMapping("/api/seller/payouts/method/status")
    public BuyerCommerceFlowDtos.SellerPayoutMethodStatus sellerPayoutMethodStatus() {
        return BuyerCommerceFlowDtos.mockSellerPayouts().methodStatus();
    }

    @GetMapping("/api/seller/payouts/holds")
    public java.util.List<BuyerCommerceFlowDtos.SellerPayoutHold> sellerPayoutHolds() {
        return BuyerCommerceFlowDtos.mockSellerPayouts().holds();
    }

    @GetMapping("/api/seller/payouts/history")
    public java.util.List<BuyerCommerceFlowDtos.SellerPayoutHistoryItem> sellerPayoutHistory() {
        return BuyerCommerceFlowDtos.mockSellerPayouts().history();
    }

    @PostMapping("/api/seller/payouts/refresh")
    public BuyerCommerceFlowDtos.SellerPayoutActionResponse refreshSellerPayouts() {
        return BuyerCommerceFlowDtos.sellerPayoutAction("SELLER_PAYOUTS_REFRESHED",
                "Seller payouts refreshed.", "/seller/payouts");
    }

    @GetMapping("/api/seller/orders")
    public BuyerCommerceFlowDtos.SellerOrdersResponse sellerOrders() {
        return BuyerCommerceFlowDtos.mockSellerOrders();
    }

    @GetMapping("/api/seller/orders/summary")
    public BuyerCommerceFlowDtos.SellerOrdersSummary sellerOrdersSummary() {
        return BuyerCommerceFlowDtos.mockSellerOrders().summary();
    }

    @GetMapping("/api/seller/orders/search")
    public BuyerCommerceFlowDtos.SellerOrdersResponse searchSellerOrders() {
        return BuyerCommerceFlowDtos.mockSellerOrders();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}")
    public BuyerCommerceFlowDtos.SellerOrderDetail sellerOrderDetail(@PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerOrderDetail(sellerOrderId);
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/items")
    public java.util.List<BuyerCommerceFlowDtos.SellerOrderItem> sellerOrderItems(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerOrderDetail(sellerOrderId).items();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/actions")
    public BuyerCommerceFlowDtos.SellerOrderActionEligibility sellerOrderActions(@PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerOrderDetail(sellerOrderId).actionEligibility();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/digital-delivery-preparation")
    public BuyerCommerceFlowDtos.SellerDigitalDeliveryPreparation sellerDigitalDeliveryPreparation(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerOrderDetail(sellerOrderId).digitalDeliveryPreparation();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/messaging-availability")
    public BuyerCommerceFlowDtos.SellerOrderMessagingAvailability sellerMessagingAvailability(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerOrderDetail(sellerOrderId).messagingAvailability();
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/refresh")
    public BuyerCommerceFlowDtos.SellerOrderActionResponse refreshSellerOrder(@PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.sellerOrderAction("SELLER_ORDER_REFRESHED",
                "Seller order status refreshed.", "/seller/orders/" + sellerOrderId);
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/fulfillment")
    public BuyerCommerceFlowDtos.SellerFulfillmentDetailResponse sellerFulfillment(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerFulfillment(sellerOrderId);
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/payment-status")
    public BuyerCommerceFlowDtos.SellerPaymentCaptureStatus sellerPaymentStatus(@PathVariable String sellerOrderId) {
        return new BuyerCommerceFlowDtos.SellerPaymentCaptureStatus(true, true, false, false,
                false, false, false, false, "Payment is authorized; capture waits for acceptance/rules.");
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/digital-delivery/preparation")
    public BuyerCommerceFlowDtos.SellerDigitalDeliveryPreparation sellerFulfillmentDigitalPreparation(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerFulfillment(sellerOrderId).digitalDeliveryPreparation();
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/digital-delivery/payload")
    public BuyerCommerceFlowDtos.SellerFulfillmentActionResponse submitDigitalPayload(
            @PathVariable String sellerOrderId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SecureDigitalDeliveryPayloadRequest request) {
        return BuyerCommerceFlowDtos.sellerFulfillmentAction("DIGITAL_PAYLOAD_SUBMITTED",
                "Secure delivery payload submitted. Raw payload is not returned.", "/seller/orders/" + sellerOrderId + "/digital-delivery");
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/digital-delivery/validate")
    public BuyerCommerceFlowDtos.DigitalDeliveryValidationResponse validateDigitalPayload(
            @PathVariable String sellerOrderId) {
        return new BuyerCommerceFlowDtos.DigitalDeliveryValidationResponse(true, "VALID",
                java.util.List.of(), java.util.List.of("Do not share codes in chat."),
                "Delivery payload passed validation.");
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/digital-delivery/mark-ready")
    public BuyerCommerceFlowDtos.SellerFulfillmentActionResponse markDigitalReady(
            @PathVariable String sellerOrderId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.MarkDigitalDeliveryReadyRequest request) {
        return BuyerCommerceFlowDtos.sellerFulfillmentAction("DIGITAL_DELIVERY_READY",
                "Digital delivery marked ready for buyer reveal.", "/seller/orders/" + sellerOrderId + "/fulfillment");
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/digital-delivery/replace")
    public BuyerCommerceFlowDtos.SellerFulfillmentActionResponse replaceDigitalPayload(
            @PathVariable String sellerOrderId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SecureDigitalDeliveryPayloadRequest request) {
        return BuyerCommerceFlowDtos.sellerFulfillmentAction("DIGITAL_PAYLOAD_REPLACED",
                "Secure delivery payload replaced before buyer reveal.", "/seller/orders/" + sellerOrderId + "/digital-delivery");
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/digital-delivery/report-issue")
    public BuyerCommerceFlowDtos.SellerFulfillmentActionResponse reportSellerDeliveryIssue(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.sellerFulfillmentAction("DIGITAL_DELIVERY_ISSUE_REPORTED",
                "Delivery issue reported.", "/seller/orders/" + sellerOrderId + "/issue");
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/policy-warnings")
    public java.util.List<BuyerCommerceFlowDtos.SellerOrderPolicyWarning> sellerPolicyWarnings(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerFulfillment(sellerOrderId).policyWarnings();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/payout-estimate")
    public BuyerCommerceFlowDtos.SellerSafePayoutEstimate sellerPayoutEstimate(@PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerFulfillment(sellerOrderId).payoutEstimate();
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/cancellation-eligibility")
    public BuyerCommerceFlowDtos.SellerOrderCancellationEligibility sellerCancellationEligibility(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockSellerFulfillment(sellerOrderId).cancellationEligibility();
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/cancel")
    public BuyerCommerceFlowDtos.SellerFulfillmentActionResponse cancelSellerOrder(@PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.sellerFulfillmentAction("SELLER_ORDER_CANCEL_REQUESTED",
                "Seller order cancellation requested.", "/seller/orders/" + sellerOrderId);
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/fulfillment/refresh")
    public BuyerCommerceFlowDtos.SellerFulfillmentActionResponse refreshSellerFulfillment(
            @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.sellerFulfillmentAction("SELLER_FULFILLMENT_REFRESHED",
                "Fulfillment status refreshed.", "/seller/orders/" + sellerOrderId + "/fulfillment");
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryResponse buyerDigitalDelivery(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery/items")
    public java.util.List<BuyerCommerceFlowDtos.BuyerDigitalDeliveryItem> buyerDigitalDeliveryItems(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId).items();
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery/items/{orderItemId}")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryItem buyerDigitalDeliveryItem(
            @PathVariable String orderId, @PathVariable String orderItemId) {
        return BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId).items().stream()
                .filter(item -> item.orderItemId().equals(orderItemId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId).items().get(0));
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery/items/{orderItemId}/eligibility")
    public BuyerCommerceFlowDtos.BuyerDigitalRevealEligibility buyerRevealEligibility(
            @PathVariable String orderId, @PathVariable String orderItemId) {
        return new BuyerCommerceFlowDtos.BuyerDigitalRevealEligibility(true, "ELIGIBLE",
                null, true, true, true, true, false, true, true, true,
                "Reveal is eligible after acknowledgement.");
    }

    @PostMapping("/api/buyer/orders/{orderId}/digital-delivery/items/{orderItemId}/acknowledge-reveal")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryActionResponse acknowledgeReveal(
            @PathVariable String orderId, @PathVariable String orderItemId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.BuyerRevealAcknowledgementRequest request) {
        return BuyerCommerceFlowDtos.buyerDigitalDeliveryAction("REVEAL_ACKNOWLEDGED",
                "Reveal warnings acknowledged.", "/orders/" + orderId + "/digital-delivery/items/" + orderItemId + "/reveal");
    }

    @PostMapping("/api/buyer/orders/{orderId}/digital-delivery/items/{orderItemId}/reveal")
    public BuyerCommerceFlowDtos.BuyerRevealResponse revealDigitalItem(
            @PathVariable String orderId, @PathVariable String orderItemId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.BuyerRevealRequest request) {
        return new BuyerCommerceFlowDtos.BuyerRevealResponse(true, orderItemId, "REVEALED_ACCESSED",
                java.time.LocalDateTime.now(),
                new BuyerCommerceFlowDtos.BuyerRevealPayload("LICENSE_KEY", "XXXX-XXXX-7890",
                        "SHARITY-DEMO-KEY-7890", null,
                        "Use this key only in the vendor activation flow.",
                        java.time.LocalDateTime.now().plusMinutes(15), "MASKED_WITH_TOGGLE"),
                true, false, true, "Secure reveal succeeded. Payload is volatile and must not be stored.");
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery/items/{orderItemId}/history")
    public java.util.List<BuyerCommerceFlowDtos.BuyerDigitalDeliveryHistoryItem> buyerDigitalItemHistory(
            @PathVariable String orderId, @PathVariable String orderItemId) {
        return BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId).timeline();
    }

    @PostMapping("/api/buyer/orders/{orderId}/digital-delivery/items/{orderItemId}/report-issue")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryActionResponse reportBuyerDeliveryIssue(
            @PathVariable String orderId, @PathVariable String orderItemId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.BuyerDigitalDeliveryIssueRequest request) {
        return BuyerCommerceFlowDtos.buyerDigitalDeliveryAction("DIGITAL_DELIVERY_ISSUE_REPORTED",
                "Delivery issue submitted for review.", "/orders/" + orderId + "/digital-delivery");
    }

    @PostMapping("/api/buyer/orders/{orderId}/digital-delivery/refresh")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryActionResponse refreshBuyerDigitalDelivery(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.buyerDigitalDeliveryAction("DIGITAL_DELIVERY_REFRESHED",
                "Digital delivery status refreshed.", "/orders/" + orderId + "/digital-delivery");
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery/policy-warning")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryPolicyWarning buyerDigitalPolicyWarning(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId).policyWarning();
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery/actions")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliveryActionEligibility buyerDigitalActions(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerDigitalDelivery(orderId).actionEligibility();
    }

    @GetMapping("/api/buyer/orders")
    public BuyerCommerceFlowDtos.BuyerOrdersResponse buyerOrders() {
        return BuyerCommerceFlowDtos.mockBuyerOrders();
    }

    @GetMapping("/api/buyer/orders/summary")
    public BuyerCommerceFlowDtos.BuyerOrdersSummary buyerOrdersSummary() {
        return BuyerCommerceFlowDtos.mockBuyerOrders().summary();
    }

    @PostMapping("/api/buyer/orders/refresh")
    public BuyerCommerceFlowDtos.BuyerOrdersActionResponse refreshBuyerOrders() {
        return BuyerCommerceFlowDtos.buyerOrdersAction("BUYER_ORDERS_REFRESHED",
                "Order statuses refreshed.", "/orders");
    }

    @GetMapping("/api/buyer/orders/search")
    public BuyerCommerceFlowDtos.BuyerOrdersResponse searchBuyerOrders() {
        return BuyerCommerceFlowDtos.mockBuyerOrders();
    }

    @GetMapping("/api/buyer/orders/{orderId}/card")
    public BuyerCommerceFlowDtos.BuyerOrderCard buyerOrderCard(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrders().orders().stream()
                .filter(order -> order.orderId().equals(orderId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockBuyerOrders().orders().get(0));
    }

    @GetMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}/summary")
    public BuyerCommerceFlowDtos.BuyerSellerOrderGroupSummary buyerSellerGroupSummary(
            @PathVariable String orderId, @PathVariable String sellerOrderId) {
        return buyerOrderCard(orderId).sellerGroups().stream()
                .filter(group -> group.sellerOrderId().equals(sellerOrderId))
                .findFirst()
                .orElse(buyerOrderCard(orderId).sellerGroups().get(0));
    }

    @GetMapping("/api/buyer/orders/{orderId}/actions")
    public BuyerCommerceFlowDtos.BuyerOrderActionEligibility buyerOrderActions(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).actionEligibility();
    }

    @GetMapping("/api/buyer/orders/{orderId}/receipt")
    public BuyerCommerceFlowDtos.ReceiptResponse buyerOrderReceipt(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockReceipt(orderId, null, "receipt-085");
    }

    @GetMapping("/api/buyer/orders/{orderId}/digital-delivery-summary")
    public BuyerCommerceFlowDtos.BuyerDigitalDeliverySummary buyerOrderDigitalDeliverySummary(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).digitalDeliverySummary();
    }

    @PostMapping("/api/buyer/orders/{orderId}/cancel")
    public BuyerCommerceFlowDtos.BuyerOrderDetailActionResponse cancelBuyerOrder(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.buyerOrderDetailAction("BUYER_ORDER_CANCEL_REQUESTED",
                "Order cancellation requested.", "/orders/" + orderId);
    }

    @PostMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}/cancel")
    public BuyerCommerceFlowDtos.BuyerOrderDetailActionResponse cancelBuyerSellerGroup(
            @PathVariable String orderId, @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.buyerOrderDetailAction("BUYER_SELLER_GROUP_CANCEL_REQUESTED",
                "Seller group cancellation requested.", "/orders/" + orderId + "/seller-groups/" + sellerOrderId);
    }

    @GetMapping("/api/buyer/orders/{orderId}")
    public BuyerCommerceFlowDtos.BuyerOrderDetailResponse buyerOrderDetail(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId);
    }

    @GetMapping("/api/buyer/orders/{orderId}/seller-groups")
    public java.util.List<BuyerCommerceFlowDtos.BuyerSellerOrderGroupDetail> buyerOrderSellerGroups(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).sellerGroups();
    }

    @GetMapping("/api/buyer/orders/{orderId}/seller-groups/{sellerOrderId}")
    public BuyerCommerceFlowDtos.BuyerSellerOrderGroupDetail buyerOrderSellerGroup(
            @PathVariable String orderId, @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).sellerGroups().stream()
                .filter(group -> group.sellerOrderId().equals(sellerOrderId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).sellerGroups().get(0));
    }

    @GetMapping("/api/buyer/orders/{orderId}/items/{orderItemId}")
    public BuyerCommerceFlowDtos.BuyerOrderItemDetail buyerOrderItem(
            @PathVariable String orderId, @PathVariable String orderItemId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).items().stream()
                .filter(item -> item.orderItemId().equals(orderItemId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).items().get(0));
    }

    @GetMapping("/api/buyer/orders/{orderId}/payment-summary")
    public BuyerCommerceFlowDtos.BuyerOrderPaymentSummary buyerOrderPaymentSummary(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).paymentSummary();
    }

    @GetMapping("/api/buyer/orders/{orderId}/timeline")
    public java.util.List<BuyerCommerceFlowDtos.BuyerOrderTimelineItem> buyerOrderTimeline(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).timeline();
    }

    @GetMapping("/api/buyer/orders/{orderId}/messaging-availability")
    public BuyerCommerceFlowDtos.BuyerOrderMessagingAvailability buyerMessagingAvailability(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).messagingAvailability();
    }

    @GetMapping("/api/buyer/orders/{orderId}/cancellation-eligibility")
    public BuyerCommerceFlowDtos.BuyerOrderCancellationEligibility buyerCancellationEligibility(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockBuyerOrderDetail(orderId).cancellationEligibility();
    }

    @PostMapping("/api/buyer/orders/{orderId}/refresh")
    public BuyerCommerceFlowDtos.BuyerOrderDetailActionResponse refreshBuyerOrder(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.buyerOrderDetailAction("BUYER_ORDER_REFRESHED",
                "Order detail refreshed.", "/orders/" + orderId);
    }

    @PostMapping("/api/checkout/from-cart")
    public BuyerCommerceFlowDtos.CheckoutReviewResponse createCheckoutFromCart(
            @RequestBody(required = false) BuyerCommerceFlowDtos.CreateCheckoutFromCartRequest request) {
        return BuyerCommerceFlowDtos.mockCheckout("checkout-058");
    }

    @GetMapping("/api/checkout/{checkoutId}")
    public BuyerCommerceFlowDtos.CheckoutReviewResponse checkoutReview(@PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.mockCheckout(checkoutId);
    }

    @PostMapping("/api/checkout/{checkoutId}/refresh")
    public BuyerCommerceFlowDtos.CheckoutActionResponse refreshCheckout(@PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.checkoutAction(checkoutId, "CHECKOUT_REFRESHED",
                "Checkout refreshed and final totals recalculated.");
    }

    @PostMapping("/api/checkout/{checkoutId}/coupons/apply")
    public BuyerCommerceFlowDtos.CheckoutActionResponse applyCheckoutCoupon(
            @PathVariable String checkoutId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.ApplyCheckoutCouponRequest request) {
        return BuyerCommerceFlowDtos.checkoutAction(checkoutId, "CHECKOUT_COUPON_APPLIED",
                "Checkout coupon applied and totals recalculated.");
    }

    @PostMapping("/api/checkout/{checkoutId}/coupons/remove")
    public BuyerCommerceFlowDtos.CheckoutActionResponse removeCheckoutCoupon(
            @PathVariable String checkoutId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.RemoveCheckoutCouponRequest request) {
        return BuyerCommerceFlowDtos.checkoutAction(checkoutId, "CHECKOUT_COUPON_REMOVED",
                "Checkout coupon removed and totals recalculated.");
    }

    @GetMapping("/api/checkout/{checkoutId}/payment-methods")
    public java.util.List<BuyerCommerceFlowDtos.CheckoutPaymentMethod> paymentMethods(@PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.mockCheckout(checkoutId).paymentMethods();
    }

    @PostMapping("/api/checkout/{checkoutId}/payment-method")
    public BuyerCommerceFlowDtos.CheckoutActionResponse selectPaymentMethod(
            @PathVariable String checkoutId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.SelectPaymentMethodRequest request) {
        return BuyerCommerceFlowDtos.checkoutAction(checkoutId, "CHECKOUT_PAYMENT_METHOD_SELECTED",
                "Payment method selected.");
    }

    @GetMapping("/api/checkout/{checkoutId}/seller-acceptance-summary")
    public BuyerCommerceFlowDtos.CheckoutSellerAcceptanceSummary sellerAcceptanceSummary(
            @PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.mockCheckout(checkoutId).sellerAcceptanceSummary();
    }

    @GetMapping("/api/checkout/{checkoutId}/digital-delivery-warnings")
    public java.util.List<BuyerCommerceFlowDtos.CheckoutDigitalDeliveryWarning> digitalDeliveryWarnings(
            @PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.mockCheckout(checkoutId).digitalDeliveryWarnings();
    }

    @GetMapping("/api/checkout/{checkoutId}/policy-summary")
    public BuyerCommerceFlowDtos.CheckoutPolicySummary policySummary(@PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.mockCheckout(checkoutId).policySummary();
    }

    @PostMapping("/api/checkout/{checkoutId}/authorize-payment")
    public BuyerCommerceFlowDtos.AuthorizePaymentResponse authorizePayment(
            @PathVariable String checkoutId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.AuthorizePaymentRequest request) {
        return new BuyerCommerceFlowDtos.AuthorizePaymentResponse(true, checkoutId, "payauth-059",
                "PAYPAL", "/payment/paypal/redirect", true, "REDIRECT_REQUIRED",
                "/payment/paypal", "Redirect to PayPal authorization.");
    }

    @GetMapping("/api/checkout/{checkoutId}/authorization-status")
    public BuyerCommerceFlowDtos.CheckoutAuthorizationStatusResponse checkoutAuthorizationStatus(
            @PathVariable String checkoutId) {
        return new BuyerCommerceFlowDtos.CheckoutAuthorizationStatusResponse(checkoutId, "payauth-059",
                "PAYPAL", "AUTHORIZED_PENDING_SELLER_ACCEPTANCE", true, false, false,
                "/order-status/order-060", "Authorization is confirmed by backend status.");
    }

    @PostMapping("/api/checkout/{checkoutId}/cancel")
    public BuyerCommerceFlowDtos.CheckoutActionResponse cancelCheckout(@PathVariable String checkoutId) {
        return BuyerCommerceFlowDtos.checkoutAction(checkoutId, "CHECKOUT_CANCELLED",
                "Checkout cancelled and buyer can return to cart.");
    }

    @PostMapping("/api/payments/paypal/authorize")
    public BuyerCommerceFlowDtos.StartPayPalAuthorizationResponse startPayPalAuthorization(
            @RequestBody(required = false) BuyerCommerceFlowDtos.StartPayPalAuthorizationRequest request) {
        String checkoutId = request == null || request.checkoutId() == null ? "checkout-058" : request.checkoutId();
        return new BuyerCommerceFlowDtos.StartPayPalAuthorizationResponse(true, checkoutId,
                "payauth-059", "payattempt-001", "PAYPAL", "/payment/paypal/redirect",
                true, "REDIRECTING_TO_PAYPAL", "Opening PayPal to authorize payment.");
    }

    @GetMapping("/api/payments/paypal/authorize/{authorizationAttemptId}/redirect")
    public BuyerCommerceFlowDtos.StartPayPalAuthorizationResponse paypalRedirect(
            @PathVariable String authorizationAttemptId) {
        return new BuyerCommerceFlowDtos.StartPayPalAuthorizationResponse(true, "checkout-058",
                "payauth-059", authorizationAttemptId, "PAYPAL", "/payment/paypal/return",
                true, "WAITING_FOR_PAYPAL", "Complete authorization in PayPal.");
    }

    @PostMapping("/api/payments/paypal/return")
    public BuyerCommerceFlowDtos.PaymentAuthorizationStatusResponse paypalReturn(
            @RequestBody(required = false) BuyerCommerceFlowDtos.PayPalReturnRequest request) {
        return BuyerCommerceFlowDtos.mockPaymentStatus(request == null ? "payauth-059" : request.paymentAuthorizationId());
    }

    @PostMapping("/api/payments/paypal/cancel")
    public BuyerCommerceFlowDtos.PaymentActionResponse paypalCancel(
            @RequestBody(required = false) BuyerCommerceFlowDtos.PayPalCancelRequest request) {
        return BuyerCommerceFlowDtos.paymentAction("PAYMENT_AUTHORIZATION_CANCELLED",
                "Payment authorization was cancelled.", "/checkout/checkout-058");
    }

    @GetMapping("/api/payments/authorizations/{paymentAuthorizationId}/status")
    public BuyerCommerceFlowDtos.PaymentAuthorizationStatusResponse paymentStatus(
            @PathVariable String paymentAuthorizationId) {
        return BuyerCommerceFlowDtos.mockPaymentStatus(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/authorizations/{paymentAuthorizationId}/retry")
    public BuyerCommerceFlowDtos.RetryPaymentAuthorizationResponse retryPayment(
            @PathVariable String paymentAuthorizationId) {
        return new BuyerCommerceFlowDtos.RetryPaymentAuthorizationResponse(true, "payattempt-002",
                "/payment/paypal/redirect", true, "REDIRECTING_TO_PAYPAL",
                "Retry started with a duplicate-safe backend attempt.");
    }

    @PostMapping("/api/payments/authorizations/{paymentAuthorizationId}/cancel")
    public BuyerCommerceFlowDtos.CancelPaymentAuthorizationResponse cancelPayment(
            @PathVariable String paymentAuthorizationId) {
        return new BuyerCommerceFlowDtos.CancelPaymentAuthorizationResponse(true,
                "PAYMENT_AUTHORIZATION_CANCELLED", "/checkout/checkout-058",
                "Payment authorization cancelled.");
    }

    @GetMapping("/api/payments/providers/availability")
    public BuyerCommerceFlowDtos.PaymentProviderAvailabilityResponse providerAvailability() {
        return BuyerCommerceFlowDtos.mockPayment("checkout-058").providerAvailability();
    }

    @GetMapping("/api/payments/authorizations/{paymentAuthorizationId}/seller-acceptance-next-step")
    public BuyerCommerceFlowDtos.SellerAcceptanceNextStepResponse sellerAcceptanceNextStep(
            @PathVariable String paymentAuthorizationId) {
        return BuyerCommerceFlowDtos.mockPayment("checkout-058").sellerAcceptanceNextStep();
    }

    @GetMapping("/api/payments/authorizations/{paymentAuthorizationId}/digital-delivery-next-step")
    public BuyerCommerceFlowDtos.DigitalDeliveryNextStepResponse digitalDeliveryNextStep(
            @PathVariable String paymentAuthorizationId) {
        return BuyerCommerceFlowDtos.mockPayment("checkout-058").digitalDeliveryNextStep();
    }

    @PostMapping("/api/payments/mock/authorize")
    public BuyerCommerceFlowDtos.PaymentAuthorizationStatusResponse mockAuthorize(
            @RequestBody(required = false) BuyerCommerceFlowDtos.MockPaymentAuthorizationRequest request) {
        return BuyerCommerceFlowDtos.mockPaymentStatus("payauth-mock-059");
    }

    @PostMapping("/api/payments/stripe/authorize")
    public BuyerCommerceFlowDtos.PaymentActionResponse stripeAuthorize() {
        return BuyerCommerceFlowDtos.paymentAction("STRIPE_AUTHORIZATION_NOT_ENABLED",
                "Stripe authorization is coming later.", "/payment");
    }

    @GetMapping("/api/orders/payment-status/{paymentAuthorizationId}")
    public BuyerCommerceFlowDtos.OrderPaymentStatusResponse orderStatusByPayment(
            @PathVariable String paymentAuthorizationId) {
        return BuyerCommerceFlowDtos.mockOrderStatus("order-060", paymentAuthorizationId);
    }

    @GetMapping("/api/orders/{orderId}/status")
    public BuyerCommerceFlowDtos.OrderPaymentStatusResponse orderStatus(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059");
    }

    @GetMapping("/api/orders/{orderId}/seller-groups")
    public java.util.List<BuyerCommerceFlowDtos.SellerOrderGroupStatus> sellerGroups(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").sellerGroups();
    }

    @GetMapping("/api/orders/{orderId}/seller-groups/{sellerOrderId}/status")
    public BuyerCommerceFlowDtos.SellerOrderGroupStatus sellerGroupStatus(
            @PathVariable String orderId, @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").sellerGroups().stream()
                .filter(group -> group.sellerOrderId().equals(sellerOrderId))
                .findFirst()
                .orElse(BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").sellerGroups().get(0));
    }

    @PostMapping("/api/orders/{orderId}/status/refresh")
    public BuyerCommerceFlowDtos.OrderResultActionResponse refreshOrderStatus(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.orderAction("ORDER_STATUS_REFRESHED",
                "Order and payment status refreshed.", "/orders/" + orderId + "/status");
    }

    @PostMapping("/api/orders/payment-status/{paymentAuthorizationId}/retry")
    public BuyerCommerceFlowDtos.OrderResultActionResponse retryFromResult(
            @PathVariable String paymentAuthorizationId) {
        return BuyerCommerceFlowDtos.orderAction("PAYMENT_RETRY_STARTED",
                "Retry payment started from order result.", "/payment/authorize");
    }

    @PostMapping("/api/orders/payment-status/{paymentAuthorizationId}/return-to-checkout")
    public BuyerCommerceFlowDtos.OrderResultActionResponse returnToCheckout(
            @PathVariable String paymentAuthorizationId) {
        return BuyerCommerceFlowDtos.orderAction("RETURN_TO_CHECKOUT",
                "Return to checkout is available.", "/checkout/checkout-058");
    }

    @GetMapping("/api/orders/{orderId}/cancellation-eligibility")
    public BuyerCommerceFlowDtos.OrderCancellationEligibility cancellationEligibility(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").cancellationEligibility();
    }

    @PostMapping("/api/orders/{orderId}/cancel")
    public BuyerCommerceFlowDtos.OrderResultActionResponse cancelOrder(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.orderAction("ORDER_CANCEL_REQUESTED",
                "Order cancellation requested.", "/orders/" + orderId + "/status");
    }

    @PostMapping("/api/orders/{orderId}/seller-groups/{sellerOrderId}/cancel")
    public BuyerCommerceFlowDtos.OrderResultActionResponse cancelSellerGroup(
            @PathVariable String orderId, @PathVariable String sellerOrderId) {
        return BuyerCommerceFlowDtos.orderAction("SELLER_GROUP_CANCEL_REQUESTED",
                "Seller group cancellation requested.", "/orders/" + orderId + "/seller-groups");
    }

    @GetMapping("/api/orders/{orderId}/messaging-availability")
    public BuyerCommerceFlowDtos.OrderSafeMessagingAvailability messagingAvailability(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").safeMessagingAvailability();
    }

    @GetMapping("/api/orders/{orderId}/digital-delivery-status")
    public BuyerCommerceFlowDtos.DigitalDeliveryNextStepSummary orderDigitalDeliveryStatus(
            @PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").digitalDeliveryNextStep();
    }

    @GetMapping("/api/orders/{orderId}/receipt")
    public BuyerCommerceFlowDtos.ReceiptPlaceholderResponse receipt(@PathVariable String orderId) {
        return BuyerCommerceFlowDtos.mockOrderStatus(orderId, "payauth-059").receiptPlaceholder();
    }

    private BuyerCommerceFlowDtos.SellerListingsResponse toSellerListingsResponse(List<MarketplaceDtos.ListingResponse> listings) {
        Map<String, String> categories = categoryLookup();
        List<BuyerCommerceFlowDtos.SellerListingCard> cards = listings.stream()
                .map(listing -> toSellerListingCard(listing, categories))
                .toList();
        BuyerCommerceFlowDtos.SellerListingsSummary summary = summarize(cards);
        return new BuyerCommerceFlowDtos.SellerListingsResponse(
                cards,
                summary,
                new BuyerCommerceFlowDtos.SellerListingFilters(null, null, null, null, null, null, null, null),
                new BuyerCommerceFlowDtos.SellerListingSort("UPDATED_DESC", "Last updated", "DESC"),
                1,
                cards.size(),
                cards.size(),
                1,
                List.of("REFRESH", "CREATE"),
                LocalDateTime.now());
    }

    private BuyerCommerceFlowDtos.SellerListingCard toSellerListingCard(MarketplaceDtos.ListingResponse listing,
                                                                        Map<String, String> categories) {
        String categoryName = categories.getOrDefault(listing.categoryCode(), listing.categoryCode() == null ? "General" : listing.categoryCode());
        String listingStatus = listing.listingStatus() == null ? "DRAFT" : listing.listingStatus();
        boolean active = "ACTIVE".equalsIgnoreCase(listingStatus) || "PUBLISHED".equalsIgnoreCase(listingStatus);
        boolean paused = "PAUSED".equalsIgnoreCase(listingStatus) || "INACTIVE".equalsIgnoreCase(listingStatus);
        boolean rejected = "REJECTED".equalsIgnoreCase(listingStatus);
        boolean draft = "DRAFT".equalsIgnoreCase(listingStatus);
        boolean pendingModeration = "PENDING_MODERATION".equalsIgnoreCase(listingStatus);
        boolean needsAttention = rejected || paused;
        String availabilityStatus = active ? "AVAILABLE" : paused ? "PAUSED" : draft ? "DRAFT" : pendingModeration ? "UNDER_REVIEW" : listingStatus;
        return new BuyerCommerceFlowDtos.SellerListingCard(
                listing.publicId(),
                listing.publicId(),
                listing.title(),
                listing.imageUrl() == null || listing.imageUrl().isBlank() ? "marketplace/placeholders/gift_cards.png" : listing.imageUrl(),
                listing.verticalCode(),
                marketplaceDisplayName(listing.verticalCode()),
                listing.categoryCode(),
                categoryName,
                "",
                "",
                listing.productType(),
                true,
                listing.fulfillmentScope(),
                listing.priceAmount() == null ? BigDecimal.ZERO : listing.priceAmount(),
                listing.currencyCode(),
                listingStatus,
                availabilityStatus,
                pendingModeration ? "PENDING_REVIEW" : rejected ? "REJECTED" : "CLEAR",
                false,
                0,
                needsAttention,
                primaryStatusMessage(listingStatus),
                availableActions(listingStatus),
                "/seller/listings/" + listing.publicId());
    }

    private BuyerCommerceFlowDtos.ListingDraft toListingDraft(MarketplaceDtos.ListingResponse listing) {
        return new BuyerCommerceFlowDtos.ListingDraft(
                listing.publicId(),
                listing.listingStatus(),
                listing.title(),
                listing.verticalCode(),
                listing.categoryCode(),
                listing.fulfillmentScope(),
                listing.priceAmount() == null ? BigDecimal.ZERO : listing.priceAmount(),
                listing.currencyCode(),
                listing.imageUrl() == null || listing.imageUrl().isBlank() ? List.of() : List.of(listing.imageUrl()),
                List.of("SAVE", "PREVIEW", "PUBLISH"),
                listing.createdAt() == null ? LocalDateTime.now() : listing.createdAt());
    }

    private String marketplaceDisplayName(String marketplaceCode) {
        return marketplaceService.activeVerticals().stream()
                .filter(vertical -> vertical.moduleCode().equalsIgnoreCase(marketplaceCode))
                .map(MarketplaceDtos.VerticalResponse::moduleName)
                .findFirst()
                .orElseGet(() -> marketplaceCode == null || marketplaceCode.isBlank()
                        ? "Marketplace"
                        : marketplaceCode.replace('_', ' '));
    }

    private BuyerCommerceFlowDtos.SellerListingsSummary summarize(List<BuyerCommerceFlowDtos.SellerListingCard> listings) {
        int activeCount = 0;
        int draftCount = 0;
        int pendingModerationCount = 0;
        int pausedCount = 0;
        int rejectedCount = 0;
        int archivedCount = 0;
        int digitalListingsCount = 0;
        int needsAttentionCount = 0;
        for (BuyerCommerceFlowDtos.SellerListingCard listing : listings) {
            String status = listing.listingStatus() == null ? "DRAFT" : listing.listingStatus().toUpperCase();
            switch (status) {
                case "ACTIVE", "PUBLISHED" -> activeCount++;
                case "DRAFT" -> draftCount++;
                case "PENDING_MODERATION" -> pendingModerationCount++;
                case "PAUSED", "INACTIVE" -> pausedCount++;
                case "REJECTED" -> rejectedCount++;
                case "ARCHIVED" -> archivedCount++;
                default -> {
                }
            }
            if (listing.digitalProduct()) {
                digitalListingsCount++;
            }
            if (listing.needsAttention()) {
                needsAttentionCount++;
            }
        }
        return new BuyerCommerceFlowDtos.SellerListingsSummary(activeCount, draftCount, pendingModerationCount,
                pausedCount, rejectedCount, archivedCount, digitalListingsCount, needsAttentionCount, LocalDateTime.now());
    }

    private Map<String, String> categoryLookup() {
        Map<String, String> categories = new LinkedHashMap<>();
        for (MarketplaceDtos.CategoryResponse category : marketplaceService.activeCategories(marketplaceService.defaultVerticalCode())) {
            categories.put(category.code(), category.name());
        }
        return categories;
    }

    private String primaryStatusMessage(String listingStatus) {
        return switch (listingStatus == null ? "DRAFT" : listingStatus.toUpperCase()) {
            case "ACTIVE", "PUBLISHED" -> "Listing is live for buyers.";
            case "PENDING_MODERATION" -> "Listing submitted and waiting for moderation.";
            case "REJECTED" -> "Listing requires changes before it can go live.";
            case "PAUSED", "INACTIVE" -> "Listing is paused and hidden from buyers.";
            default -> "Draft saved and ready for review.";
        };
    }

    private List<String> availableActions(String listingStatus) {
        return switch (listingStatus == null ? "DRAFT" : listingStatus.toUpperCase()) {
            case "ACTIVE", "PUBLISHED" -> List.of("EDIT", "PAUSE", "VIEW_ORDERS", "VIEW_ANALYTICS");
            case "PAUSED", "INACTIVE" -> List.of("EDIT", "RESUME", "ARCHIVE");
            case "PENDING_MODERATION" -> List.of("EDIT", "PREVIEW");
            case "REJECTED" -> List.of("EDIT", "PREVIEW", "ARCHIVE");
            default -> List.of("EDIT", "PREVIEW", "PUBLISH");
        };
    }

    private MarketplaceDtos.ListingRequest toListingRequest(BuyerCommerceFlowDtos.SellerListingDraftRequest request, String listingStatus) {
        String description = request.longDescription() != null && !request.longDescription().isBlank()
                ? request.longDescription().trim()
                : request.shortDescription();
        return new MarketplaceDtos.ListingRequest(
                request.title(),
                description,
                request.categoryCode(),
                request.productType(),
                request.deliveryType(),
                request.fulfillmentScope(),
                request.currency(),
                request.price(),
                request.providerAccountPublicId(),
                null,
                null,
                listingStatus,
                request.marketplaceCode(),
                request.stockQuantity());
    }
}
