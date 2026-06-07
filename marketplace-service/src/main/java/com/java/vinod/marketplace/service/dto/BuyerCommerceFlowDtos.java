package com.java.vinod.marketplace.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Buyer-safe mock contracts for STORY-057 through STORY-060.
 */
public final class BuyerCommerceFlowDtos {
    private BuyerCommerceFlowDtos() {
    }

    public record CartResponse(String cartId, String userId, String currency, CartSummary cartSummary,
                               List<CartSellerGroup> sellerGroups, List<CartItem> unavailableItems,
                               List<CartCoupon> appliedCoupons, List<CartCoupon> availableCoupons,
                               CartFeePreview feePreview, CartPaymentAuthorizationSummary paymentAuthorizationSummary,
                               CartCheckoutEligibility checkoutEligibility, List<CartWarning> warnings,
                               List<String> availableActions, LocalDateTime updatedAt) {
    }

    public record CartSummary(int totalItems, int eligibleItems, int unavailableItems, int sellerGroupCount,
                              int digitalItemCount, BigDecimal subtotal, BigDecimal sellerCouponDiscountTotal,
                              BigDecimal platformCouponDiscountTotal, BigDecimal estimatedServiceFee,
                              BigDecimal estimatedTaxes, BigDecimal estimatedTotal,
                              boolean finalCalculatedAtCheckout, int priceChangeCount) {
    }

    public record CartSellerGroup(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                  boolean sellerVerifiedBadgeVisible, String storeAvailabilityStatus,
                                  List<CartItem> items, BigDecimal groupSubtotal, BigDecimal groupCouponDiscount,
                                  BigDecimal platformCouponDiscountAllocation, BigDecimal estimatedServiceFee,
                                  BigDecimal estimatedTaxes, BigDecimal estimatedTotal,
                                  boolean sellerAcceptanceRequired, boolean paymentAuthorizationFirst,
                                  CartCheckoutEligibility checkoutEligibility, List<CartWarning> warnings,
                                  List<String> availableActions) {
    }

    public record CartItem(String cartItemId, String listingId, String productId, String title, String imageUrl,
                           String marketplaceCode, String marketplaceName, String categoryCode, String categoryName,
                           String productType, boolean digitalProduct, int quantity, boolean quantityEditable,
                           CartQuantityRule quantityRule, BigDecimal currentPrice, BigDecimal cartAddedPrice,
                           String currency, boolean priceChanged, CartItemAvailability availability,
                           CartCouponEligibility couponEligibility, String digitalDeliveryStatus,
                           boolean sellerAcceptanceRequired, boolean paymentAuthorizationFirst,
                           List<String> availableActions) {
    }

    public record CartItemAvailability(boolean available, String status, boolean soldOut, boolean removed,
                                       boolean sellerUnavailable, boolean marketplaceUnavailable,
                                       boolean countryRestricted, boolean digitalDeliveryUnavailable,
                                       boolean quantityUnavailable, boolean checkoutBlocked,
                                       String userSafeReason) {
    }

    public record CartQuantityRule(int minQuantity, int maxQuantity, boolean fixedQuantity, int increment,
                                   boolean editable, String userSafeMessage) {
    }

    public record CartCoupon(String couponId, String couponType, String title, String discountSummary,
                             String sellerStoreId, String marketplaceCode, String categoryCode,
                             String expiryDate, String eligibilityStatus, boolean applied,
                             boolean stackable, String conflictReason, boolean saveAvailable,
                             String userSafeMessage) {
    }

    public record CartCouponEligibility(boolean eligible, List<String> appliedCouponIds,
                                        List<String> availableCouponIds, List<String> ineligibleCouponIds,
                                        String userSafeMessage) {
    }

    public record CartFeePreview(BigDecimal subtotal, BigDecimal sellerCouponDiscountTotal,
                                 BigDecimal platformCouponDiscountTotal, BigDecimal estimatedBuyerServiceFee,
                                 BigDecimal estimatedTaxes, BigDecimal estimatedOtherFees,
                                 BigDecimal estimatedTotal, String buyerServiceFeeDisplayMode,
                                 boolean finalCalculatedAtCheckout, String userSafeMessage) {
    }

    public record CartPaymentAuthorizationSummary(boolean sellerAcceptanceRequired,
                                                 boolean authorizeFirstPaymentFlow,
                                                 boolean captureAfterSellerAcceptance,
                                                 List<String> affectedSellerGroups,
                                                 String userSafeExplanation) {
    }

    public record CartCheckoutEligibility(boolean checkoutAllEligible, boolean checkoutSellerGroupEligible,
                                          List<String> eligibleCartItemIds, List<String> ineligibleCartItemIds,
                                          List<String> eligibleSellerGroupIds, List<String> blockedReasons,
                                          boolean priceChangedConfirmationRequired,
                                          boolean couponConflictResolutionRequired,
                                          String userSafeMessage, String checkoutRoute) {
    }

    public record CartWarning(String warningCode, String severity, String title, String message,
                              String cartItemId, String sellerStoreId, String actionLabel, String route) {
    }

    public record UpdateCartQuantityRequest(int quantity) {
    }

    public record ApplyCartCouponRequest(String couponCode, String couponId, String sellerStoreId, String applyScope) {
    }

    public record RemoveCartCouponRequest(String couponId, String sellerStoreId, String applyScope) {
    }

    public record CartActionResponse(boolean success, String status, String message, CartResponse cart,
                                     LocalDateTime updatedAt) {
    }

    public record StartCheckoutResponse(boolean success, String checkoutId, String checkoutRoute,
                                        List<String> selectedCartItemIds, List<String> sellerGroupIds,
                                        String userSafeMessage) {
    }

    public record CheckoutReviewResponse(String checkoutId, String cartId, String currency, String status,
                                         List<CheckoutSellerGroup> sellerGroups,
                                         CheckoutFeeBreakdown finalFeeBreakdown, List<CheckoutCoupon> coupons,
                                         List<CheckoutPaymentMethod> paymentMethods,
                                         CheckoutPaymentMethod selectedPaymentMethod,
                                         CheckoutSellerAcceptanceSummary sellerAcceptanceSummary,
                                         List<CheckoutDigitalDeliveryWarning> digitalDeliveryWarnings,
                                         CheckoutPolicySummary policySummary,
                                         List<CheckoutBlockingReason> blockingReasons,
                                         List<String> availableActions, String userSafeMessage,
                                         LocalDateTime updatedAt) {
    }

    public record CheckoutSellerGroup(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                      boolean sellerVerifiedBadgeVisible, boolean sellerAcceptanceRequired,
                                      LocalDateTime sellerResponseDeadline, List<CheckoutItem> items,
                                      CheckoutSellerGroupFeeBreakdown feeBreakdown, List<String> availableActions) {
    }

    public record CheckoutItem(String checkoutItemId, String cartItemId, String listingId, String productId,
                               String title, String imageUrl, String marketplaceCode, String categoryCode,
                               String productType, boolean digitalProduct, int quantity, BigDecimal unitPrice,
                               BigDecimal lineTotal, String currency, String availabilityStatus,
                               String digitalDeliveryStatus, List<String> availableActions) {
    }

    public record CheckoutFeeBreakdown(BigDecimal itemSubtotal, BigDecimal sellerCouponDiscountTotal,
                                       BigDecimal platformCouponDiscountTotal, BigDecimal buyerServiceFee,
                                       BigDecimal taxes, BigDecimal otherFees, BigDecimal finalBuyerTotal,
                                       BigDecimal authorizationAmount, String currency,
                                       boolean authorizationOnly, String userSafeMessage) {
    }

    public record CheckoutSellerGroupFeeBreakdown(BigDecimal subtotal, BigDecimal sellerCouponDiscount,
                                                  BigDecimal platformCouponAllocation,
                                                  BigDecimal buyerServiceFeeAllocation, BigDecimal taxes,
                                                  BigDecimal groupTotal, String currency) {
    }

    public record CheckoutCoupon(String couponId, String couponCode, String couponType, String title,
                                 String discountSummary, String sellerStoreId, String applyScope,
                                 String expiryDate, String eligibilityStatus, boolean applied,
                                 String conflictReason, String userSafeMessage) {
    }

    public record CheckoutPaymentMethod(String paymentMethodId, String provider, String label, boolean available,
                                        boolean selected, boolean futurePlaceholder, String disabledReason,
                                        String userSafeMessage) {
    }

    public record PaymentProviderAvailability(boolean paypalAvailable, boolean stripeLater,
                                              boolean mockPaymentAvailable, String selectedProvider,
                                              String userSafeMessage) {
    }

    public record CheckoutSellerAcceptanceSummary(boolean required, List<String> affectedSellerGroups,
                                                 boolean captureAfterSellerAcceptance,
                                                 LocalDateTime nextSellerResponseDeadline,
                                                 String sellerRejectOutcome, String sellerNoResponseOutcome,
                                                 String buyerVoidRefundExplanation, String userSafeExplanation) {
    }

    public record CheckoutDigitalDeliveryWarning(String warningCode, String title, String message,
                                                boolean acknowledgementRequired, boolean acknowledged,
                                                String route) {
    }

    public record CheckoutPolicySummary(String policyVersion, List<String> summaryRows,
                                        boolean acknowledgementRequired, String route,
                                        String userSafeMessage) {
    }

    public record CheckoutBlockingReason(String reasonCode, String severity, String title, String message,
                                         List<String> affectedCheckoutItemIds,
                                         List<String> affectedSellerStoreIds, String suggestedAction,
                                         String route) {
    }

    public record CreateCheckoutFromCartRequest(List<String> cartItemIds, List<String> sellerStoreIds,
                                                String checkoutScope) {
    }

    public record ApplyCheckoutCouponRequest(String couponCode, String couponId, String sellerStoreId,
                                             String applyScope) {
    }

    public record RemoveCheckoutCouponRequest(String couponId, String sellerStoreId, String applyScope) {
    }

    public record SelectPaymentMethodRequest(String paymentMethodId, String provider) {
    }

    public record AuthorizePaymentRequest(String selectedPaymentMethodId,
                                          boolean buyerAcknowledgedSellerAcceptance,
                                          boolean buyerAcknowledgedDigitalDeliveryWarnings,
                                          boolean buyerAcknowledgedFinalTotal, String returnUrl, String cancelUrl) {
    }

    public record AuthorizePaymentResponse(boolean success, String checkoutId, String authorizationId,
                                           String provider, String authorizationUrl, boolean redirectRequired,
                                           String status, String nextRoute, String userSafeMessage) {
    }

    public record CheckoutAuthorizationStatusResponse(String checkoutId, String authorizationId, String provider,
                                                     String status, boolean authorized, boolean failed,
                                                     boolean pending, String nextRoute,
                                                     String userSafeMessage) {
    }

    public record CheckoutActionResponse(boolean success, String status, String message,
                                         CheckoutReviewResponse checkout, LocalDateTime updatedAt) {
    }

    public record PaymentAuthorizationPageResponse(String checkoutId, String paymentAuthorizationId,
                                                   String authorizationAttemptId, String provider,
                                                   BigDecimal authorizationAmount, String currency,
                                                   int itemCount, int sellerGroupCount, String paymentMode,
                                                   String captureMode,
                                                   PaymentProviderAvailabilityResponse providerAvailability,
                                                   String paymentStatus,
                                                   List<PaymentStatusTimelineItem> statusTimeline,
                                                   SellerAcceptanceNextStepResponse sellerAcceptanceNextStep,
                                                   DigitalDeliveryNextStepResponse digitalDeliveryNextStep,
                                                   List<String> availableActions, String userSafeMessage) {
    }

    public record PaymentProviderAvailabilityResponse(List<ProviderAvailabilityItem> providers,
                                                      String selectedProvider, String userSafeMessage) {
    }

    public record ProviderAvailabilityItem(String provider, boolean available, boolean guestCardAvailable,
                                           boolean futurePlaceholder, String disabledReason,
                                           String userSafeMessage) {
    }

    public record StartPayPalAuthorizationRequest(String checkoutId, String selectedPaymentMethodId,
                                                  boolean buyerAcknowledgedFinalAmount,
                                                  boolean buyerAcknowledgedSellerAcceptance,
                                                  boolean buyerAcknowledgedDigitalDelivery,
                                                  String returnUrl, String cancelUrl) {
    }

    public record StartPayPalAuthorizationResponse(boolean success, String checkoutId,
                                                   String paymentAuthorizationId,
                                                   String authorizationAttemptId, String provider,
                                                   String approvalUrl, boolean redirectRequired,
                                                   String status, String userSafeMessage) {
    }

    public record PayPalReturnRequest(String checkoutId, String paymentAuthorizationId,
                                      String authorizationAttemptId, String paypalToken, String payerId,
                                      String rawReturnParamsReference) {
    }

    public record PayPalCancelRequest(String checkoutId, String paymentAuthorizationId,
                                      String authorizationAttemptId, String reason) {
    }

    public record PaymentAuthorizationStatusResponse(String paymentAuthorizationId, String checkoutId,
                                                     String provider, String status, boolean authorized,
                                                     boolean failed, boolean cancelled, boolean pending,
                                                     boolean duplicateAttemptBlocked, boolean retryAvailable,
                                                     boolean cancelAvailable, String orderReference,
                                                     String nextRoute, String userSafeMessage,
                                                     LocalDateTime updatedAt) {
    }

    public record PaymentStatusTimelineItem(String statusCode, String label, String description,
                                            LocalDateTime timestamp, boolean current, boolean completed,
                                            boolean failed, String userSafeMessage) {
    }

    public record RetryPaymentAuthorizationResponse(boolean success, String newAuthorizationAttemptId,
                                                   String approvalUrl, boolean redirectRequired, String status,
                                                   String userSafeMessage) {
    }

    public record CancelPaymentAuthorizationResponse(boolean success, String status, String returnRoute,
                                                    String userSafeMessage) {
    }

    public record SellerAcceptanceNextStepResponse(boolean required, List<String> affectedSellerGroups,
                                                  boolean captureAfterSellerAccepts,
                                                  LocalDateTime sellerResponseDeadline,
                                                  String sellerRejectOutcome, String sellerNoResponseOutcome,
                                                  String buyerVoidReleaseExplanation, String nextRoute,
                                                  String userSafeMessage) {
    }

    public record DigitalDeliveryNextStepResponse(boolean hasDigitalItems,
                                                 boolean secureDeliveryThroughSharity,
                                                 boolean noCodeSharingInChat,
                                                 boolean revealAfterPaymentOrderRules,
                                                 boolean refundEligibilityMayChangeAfterReveal,
                                                 boolean deliveryStatusInOrderDetail,
                                                 boolean issueRefundPathAvailable, String nextRoute,
                                                 String userSafeMessage) {
    }

    public record MockPaymentAuthorizationRequest(String checkoutId, String outcome) {
    }

    public record PaymentActionResponse(boolean success, String status, String message, String nextRoute,
                                        LocalDateTime updatedAt) {
    }

    public record OrderPaymentStatusResponse(String paymentAuthorizationId, String checkoutId, String orderId,
                                             String resultStatus, String authorizationStatus, String orderStatus,
                                             String orderCreationStatus, String paymentStatus,
                                             ParentOrderSummary parentOrder,
                                             List<SellerOrderGroupStatus> sellerGroups,
                                             OrderPaymentSummary paymentSummary,
                                             SellerAcceptanceSummary sellerAcceptanceSummary,
                                             DigitalDeliveryNextStepSummary digitalDeliveryNextStep,
                                             ReceiptPlaceholderResponse receiptPlaceholder,
                                             OrderSafeMessagingAvailability safeMessagingAvailability,
                                             OrderCancellationEligibility cancellationEligibility,
                                             List<OrderStatusTimelineItem> statusTimeline,
                                             List<String> availableActions, String nextRoute,
                                             String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record ParentOrderSummary(String orderId, String orderReference, String orderStatus,
                                     String paymentStatus, BigDecimal finalBuyerTotal,
                                     BigDecimal authorizedAmount, BigDecimal capturedAmount,
                                     String currency, int sellerGroupCount, int itemCount,
                                     LocalDateTime createdAt, String nextStepMessage) {
    }

    public record SellerOrderGroupStatus(String sellerOrderId, String sellerStoreId, String storeDisplayName,
                                         String storeLogoUrl, boolean sellerVerifiedBadgeVisible,
                                         String sellerAcceptanceStatus, LocalDateTime sellerResponseDeadline,
                                         String paymentCaptureStatus, String authorizationReleaseStatus,
                                         BigDecimal groupBuyerTotal, String currency, List<OrderStatusItem> items,
                                         List<String> availableActions, String userSafeMessage) {
    }

    public record OrderStatusItem(String orderItemId, String listingId, String productId, String title,
                                  String imageUrl, String marketplaceCode, String categoryCode,
                                  String productType, boolean digitalProduct, int quantity,
                                  BigDecimal buyerItemTotal, String currency, String itemStatus,
                                  String digitalDeliveryStatus, String route) {
    }

    public record OrderPaymentSummary(String provider, BigDecimal authorizedAmount, BigDecimal capturedAmount,
                                      BigDecimal refundedAmount, BigDecimal voidedReleasedAmount, String currency,
                                      String paymentStatus, String captureStatus, BigDecimal buyerServiceFee,
                                      BigDecimal sellerCouponDiscount, BigDecimal platformCouponDiscount,
                                      BigDecimal taxes, BigDecimal otherFees, BigDecimal finalBuyerTotal,
                                      String userSafeMessage) {
    }

    public record SellerAcceptanceSummary(boolean required, List<String> pendingSellerGroups,
                                          List<String> acceptedSellerGroups, List<String> rejectedSellerGroups,
                                          List<String> expiredSellerGroups, LocalDateTime nextDeadline,
                                          String userSafeExplanation) {
    }

    public record DigitalDeliveryNextStepSummary(boolean hasDigitalItems, boolean digitalDeliveryPending,
                                                 boolean digitalDeliveryReady,
                                                 boolean waitingForSellerAcceptance,
                                                 boolean waitingForPaymentCapture,
                                                 String viewDigitalDeliveryStatusRoute,
                                                 String userSafeMessage) {
    }

    public record ReceiptPlaceholderResponse(boolean receiptAvailable, String receiptId, String receiptRoute,
                                             boolean invoiceAvailableLater, String userSafeMessage,
                                             List<ReceiptSummaryRow> summaryRows) {
    }

    public record ReceiptSummaryRow(String label, String value, String rowType, String userSafeMessage) {
    }

    public record OrderSafeMessagingAvailability(boolean available, String route, String disabledReason,
                                                 String userSafeMessage) {
    }

    public record OrderCancellationEligibility(boolean cancelOrderAvailable, boolean cancelSellerGroupAvailable,
                                               String cancellationMode, String blockedReason,
                                               List<String> affectedSellerGroups, String userSafeMessage) {
    }

    public record OrderStatusTimelineItem(String statusCode, String label, String description,
                                          LocalDateTime timestamp, boolean current, boolean completed,
                                          boolean failed, String userSafeMessage) {
    }

    public record OrderResultActionResponse(boolean success, String status, String message, String nextRoute,
                                            LocalDateTime updatedAt) {
    }

    public record BuyerOrdersResponse(List<BuyerOrderCard> orders, BuyerOrdersSummary summary,
                                      BuyerOrderFilters filters, BuyerOrderSort sort, int page, int size,
                                      long totalElements, int totalPages, List<String> availableActions,
                                      LocalDateTime updatedAt) {
    }

    public record BuyerOrdersSummary(int totalOrders, int awaitingSellerAcceptanceCount,
                                     int digitalDeliveryReadyCount, int refundDisputeActiveCount,
                                     int failedCancelledCount, int completedCount,
                                     LocalDateTime lastUpdatedAt) {
    }

    public record BuyerOrderCard(String orderId, String orderReference, LocalDateTime orderDate,
                                 String orderStatus, String paymentStatus, BigDecimal finalBuyerTotal,
                                 BigDecimal authorizedAmount, BigDecimal capturedAmount, String currency,
                                 int sellerGroupCount, int itemCount, String marketplaceSummary,
                                 int digitalItemCount, String primaryStatusMessage,
                                 List<BuyerSellerOrderGroupSummary> sellerGroups,
                                 List<BuyerOrderItemPreview> itemPreviews, String receiptStatus,
                                 List<String> availableActions, String route) {
    }

    public record BuyerSellerOrderGroupSummary(String sellerOrderId, String sellerStoreId,
                                               String storeDisplayName, String storeLogoUrl,
                                               boolean sellerVerifiedBadgeVisible,
                                               String sellerAcceptanceStatus, String paymentCaptureStatus,
                                               String authorizationReleaseStatus,
                                               String digitalDeliveryStatus, String refundDisputeStatus,
                                               BigDecimal groupBuyerTotal, String currency, int itemCount,
                                               List<String> availableActions, String userSafeMessage,
                                               String route) {
    }

    public record BuyerOrderItemPreview(String orderItemId, String listingId, String productId, String title,
                                        String imageUrl, String marketplaceCode, String categoryCode,
                                        String productType, boolean digitalProduct, int quantity,
                                        BigDecimal buyerItemTotal, String currency, String itemStatus,
                                        String digitalDeliveryStatus, String route) {
    }

    public record BuyerOrderFilters(String q, String marketplaceCode, String orderStatus, String paymentStatus,
                                    String digitalDeliveryStatus, String refundDisputeStatus,
                                    String dateFrom, String dateTo) {
    }

    public record BuyerOrderSort(String sortCode, String label, String direction) {
    }

    public record BuyerOrderActionEligibility(boolean viewOrderDetails, boolean viewSellerGroup,
                                              boolean viewDigitalDelivery, boolean contactSeller,
                                              boolean cancelOrder, boolean requestRefund,
                                              boolean openDispute, boolean viewReceipt,
                                              boolean buyAgainLater, boolean rateOrderLater,
                                              List<String> disabledReasons) {
    }

    public record BuyerOrderReceiptPlaceholder(boolean receiptAvailable, String receiptId,
                                               String receiptRoute, boolean invoiceAvailableLater,
                                               String userSafeMessage) {
    }

    public record BuyerOrderDigitalDeliverySummary(boolean hasDigitalItems, String digitalDeliveryStatus,
                                                   int readyItemCount, int pendingItemCount,
                                                   String viewDigitalDeliveryRoute, String userSafeMessage) {
    }

    public record BuyerOrdersActionResponse(boolean success, String status, String message, String nextRoute,
                                            LocalDateTime updatedAt) {
    }

    public record BuyerOrderDetailResponse(BuyerParentOrderDetail parentOrder,
                                           List<BuyerSellerOrderGroupDetail> sellerGroups,
                                           List<BuyerOrderItemDetail> items,
                                           BuyerOrderPaymentSummary paymentSummary,
                                           List<BuyerOrderTimelineItem> timeline,
                                           BuyerDigitalDeliverySummary digitalDeliverySummary,
                                           BuyerReceiptPlaceholder receiptPlaceholder,
                                           BuyerOrderActionEligibility actionEligibility,
                                           BuyerOrderMessagingAvailability messagingAvailability,
                                           BuyerOrderCancellationEligibility cancellationEligibility,
                                           List<String> availableActions, String userSafeMessage,
                                           LocalDateTime updatedAt) {
    }

    public record BuyerParentOrderDetail(String orderId, String orderReference, LocalDateTime orderDate,
                                         String orderStatus, String paymentStatus, BigDecimal finalBuyerTotal,
                                         BigDecimal authorizedAmount, BigDecimal capturedAmount, String currency,
                                         int sellerGroupCount, int itemCount, int digitalItemCount,
                                         String nextStepMessage) {
    }

    public record BuyerSellerOrderGroupDetail(String sellerOrderId, String sellerStoreId,
                                              String sellerOrderReference, String storeDisplayName,
                                              String storeLogoUrl, boolean sellerVerifiedBadgeVisible,
                                              String sellerAcceptanceStatus, LocalDateTime sellerResponseDeadline,
                                              String paymentCaptureStatus, String authorizationReleaseStatus,
                                              String refundDisputeStatus, BigDecimal groupBuyerTotal,
                                              String currency, List<BuyerOrderItemDetail> items,
                                              List<String> availableActions, String userSafeMessage,
                                              String route) {
    }

    public record BuyerOrderItemDetail(String orderItemId, String listingId, String productId, String title,
                                       String imageUrl, String marketplaceCode, String categoryCode,
                                       String productType, boolean digitalProduct, int quantity,
                                       BigDecimal buyerItemTotal, String currency, String itemStatus,
                                       String digitalDeliveryStatus, boolean listingPublic, String listingRoute,
                                       String userSafeMessage) {
    }

    public record BuyerOrderPaymentSummary(String provider, String paymentStatus, String captureStatus,
                                           String authorizationReleaseStatus, BigDecimal authorizedAmount,
                                           BigDecimal capturedAmount, BigDecimal refundedAmount,
                                           BigDecimal voidedReleasedAmount, BigDecimal finalBuyerTotal,
                                           String currency, String userSafeMessage) {
    }

    public record BuyerOrderTimelineItem(String statusCode, String label, String description,
                                         LocalDateTime timestamp, boolean current, boolean completed,
                                         boolean failed, String userSafeMessage) {
    }

    public record BuyerDigitalDeliverySummary(boolean hasDigitalItems, String digitalDeliveryStatus,
                                             int readyItemCount, int pendingItemCount,
                                             boolean waitingForSellerAcceptance,
                                             boolean waitingForPaymentCapture,
                                             String viewDigitalDeliveryRoute, String userSafeMessage) {
    }

    public record BuyerReceiptPlaceholder(boolean receiptAvailable, String receiptId, String receiptRoute,
                                          boolean invoiceAvailableLater, String userSafeMessage) {
    }

    public record BuyerOrderMessagingAvailability(boolean available, String route, String disabledReason,
                                                  String userSafeMessage) {
    }

    public record BuyerOrderCancellationEligibility(boolean cancelOrderAvailable,
                                                    boolean cancelSellerGroupAvailable,
                                                    String cancellationMode, String blockedReason,
                                                    List<String> affectedSellerGroups,
                                                    String userSafeMessage) {
    }

    public record BuyerOrderDetailActionResponse(boolean success, String status, String message,
                                                 String nextRoute, LocalDateTime updatedAt) {
    }

    public record SellerOrdersResponse(List<SellerOrderCard> orders, SellerOrdersSummary summary,
                                       SellerOrderFilters filters, SellerOrderSort sort, int page, int size,
                                       long totalElements, int totalPages, List<String> availableActions,
                                       LocalDateTime updatedAt) {
    }

    public record SellerOrdersSummary(int totalOrders, int pendingAcceptanceCount, int acceptedCount,
                                      int rejectedCount, int expiredCount, int capturePendingCount,
                                      int capturedCount, int digitalDeliveryReadyCount,
                                      LocalDateTime lastUpdatedAt) {
    }

    public record SellerOrderCard(String sellerOrderId, String sellerOrderReference,
                                  String parentOrderReference, LocalDateTime orderDate,
                                  LocalDateTime sellerResponseDeadline, String acceptanceStatus,
                                  String paymentCaptureStatus, int itemCount, int digitalItemCount,
                                  String buyerDisplayAlias, BigDecimal groupBuyerTotal, String currency,
                                  boolean sellerSafePayoutEstimateVisible,
                                  BigDecimal sellerSafePayoutEstimate,
                                  List<String> availableActions, String route, String userSafeMessage) {
    }

    public record SellerOrderDetail(String sellerOrderId, String sellerOrderReference,
                                    String parentOrderReference, String buyerDisplayAlias,
                                    String acceptanceStatus, LocalDateTime sellerResponseDeadline,
                                    String paymentAuthorizationStatus, String captureStatus,
                                    List<SellerOrderItem> items,
                                    SellerDigitalDeliveryPreparation digitalDeliveryPreparation,
                                    SellerOrderMessagingAvailability messagingAvailability,
                                    SellerOrderActionEligibility actionEligibility,
                                    String refundDisputeStatus, List<String> availableActions,
                                    String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record SellerOrderItem(String orderItemId, String listingId, String productId, String title,
                                  String imageUrl, String marketplaceCode, String categoryCode,
                                  String productType, boolean digitalProduct, int quantity,
                                  String itemStatus, String digitalDeliveryStatus, String route) {
    }

    public record SellerOrderActionEligibility(boolean viewSellerOrder, boolean acceptOrder,
                                               boolean rejectOrder, boolean prepareDigitalDelivery,
                                               boolean contactBuyer, boolean markIssue,
                                               boolean viewRefundDisputeLater,
                                               List<String> disabledReasons) {
    }

    public record SellerOrderAcceptRequest(boolean sellerAcknowledgedCaptureRules) {
    }

    public record SellerOrderRejectRequest(String reasonCode, String message,
                                           boolean sellerAcknowledgedBuyerNotification) {
    }

    public record SellerOrderActionResponse(boolean success, String status, String message, String nextRoute,
                                            LocalDateTime updatedAt) {
    }

    public record SellerDigitalDeliveryPreparation(boolean hasDigitalItems, String preparationStatus,
                                                   boolean secureDeliveryRequired, boolean payloadSubmitted,
                                                   String validationStatus, boolean readyForBuyerReveal,
                                                   boolean replaceAllowed, boolean buyerRevealedAccessedLater,
                                                   boolean issueReported, List<String> availableActions,
                                                   String userSafeMessage) {
    }

    public record SellerOrderMessagingAvailability(boolean available, String route, String disabledReason,
                                                   boolean digitalCodeSharingBlocked, String userSafeMessage) {
    }

    public record SellerOrderFilters(String q, String orderStatus, String paymentCaptureStatus,
                                     String digitalDeliveryStatus, String dateFrom, String dateTo) {
    }

    public record SellerOrderSort(String sortCode, String label, String direction) {
    }

    public record SellerFulfillmentDetailResponse(String sellerOrderId, String parentOrderId,
                                                  String sellerOrderReference, String parentOrderReference,
                                                  SellerBuyerDisplay buyerDisplay,
                                                  String sellerAcceptanceStatus,
                                                  LocalDateTime sellerResponseDeadline,
                                                  String paymentStatus, String captureStatus,
                                                  String authorizationReleaseStatus, String orderStatus,
                                                  int itemCount, int digitalItemCount,
                                                  BigDecimal groupBuyerTotal, String currency,
                                                  SellerSafePayoutEstimate payoutEstimate,
                                                  List<SellerFulfillmentItem> items,
                                                  List<SellerFulfillmentChecklistItem> fulfillmentChecklist,
                                                  SellerDigitalDeliveryPreparation digitalDeliveryPreparation,
                                                  List<SellerOrderPolicyWarning> policyWarnings,
                                                  SellerRefundDisputeIndicator refundDisputeIndicator,
                                                  SellerOrderMessagingAvailability messagingAvailability,
                                                  SellerOrderCancellationEligibility cancellationEligibility,
                                                  List<String> availableActions, String userSafeMessage,
                                                  LocalDateTime updatedAt) {
    }

    public record SellerBuyerDisplay(String buyerAlias, String buyerDisplayName, boolean privateInfoHidden,
                                     String userSafeMessage) {
    }

    public record SellerFulfillmentItem(String orderItemId, String listingId, String productId, String title,
                                        String imageUrl, String marketplaceCode, String categoryCode,
                                        String productType, boolean digitalProduct, int quantity,
                                        String itemStatus, String digitalDeliveryStatus,
                                        boolean prepareDeliveryEligible, String route) {
    }

    public record SellerPaymentCaptureStatus(boolean paymentAuthorized, boolean capturePending,
                                             boolean captured, boolean authorizationReleasePending,
                                             boolean voidedReleased, boolean refundPending,
                                             boolean refunded, boolean failed, String userSafeMessage) {
    }

    public record SellerFulfillmentChecklistItem(String checklistCode, String label, boolean complete,
                                                 boolean required, boolean blocked, String userSafeMessage,
                                                 String route) {
    }

    public record SecureDigitalDeliveryPayloadRequest(String orderItemId, String payloadType,
                                                      String securePayload,
                                                      boolean sellerAcknowledgedNoChatSharing,
                                                      boolean sellerAcknowledgedRefundRevealRules) {
    }

    public record DigitalDeliveryValidationResponse(boolean valid, String validationStatus,
                                                    List<String> errors, List<String> warnings,
                                                    String userSafeMessage) {
    }

    public record MarkDigitalDeliveryReadyRequest(boolean sellerAcknowledgedReady,
                                                  boolean sellerAcknowledgedNoFurtherUnsafeSharing,
                                                  boolean sellerAcknowledgedBuyerRevealRules) {
    }

    public record SellerOrderPolicyWarning(String warningCode, String title, String message,
                                           String severity, String policyRoute,
                                           boolean acknowledgementRequired) {
    }

    public record SellerRefundDisputeIndicator(String status, boolean refundRequested,
                                               boolean disputeActive, boolean actionRequired,
                                               String userSafeMessage, String route) {
    }

    public record SellerSafePayoutEstimate(boolean visible, BigDecimal estimatedSellerProceeds,
                                           String currency, String payoutStatus, String userSafeMessage) {
    }

    public record SellerOrderCancellationEligibility(boolean cancelAvailable, String cancellationMode,
                                                     String blockedReason, String userSafeMessage) {
    }

    public record SellerFulfillmentActionResponse(boolean success, String status, String message,
                                                  String nextRoute, LocalDateTime updatedAt) {
    }

    public record BuyerDigitalDeliveryResponse(String orderId, String orderReference,
                                               BuyerDigitalDeliveryPageSummary summary,
                                               List<BuyerDigitalDeliveryItem> items,
                                               BuyerDigitalDeliveryPolicyWarning policyWarning,
                                               BuyerDigitalDeliveryActionEligibility actionEligibility,
                                               List<BuyerDigitalDeliveryHistoryItem> timeline,
                                               String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record BuyerDigitalDeliveryPageSummary(int digitalItemCount, int readyForRevealCount,
                                                  int pendingCount, int revealedAccessedCount,
                                                  int issueCount, String overallStatus,
                                                  String nextStepMessage) {
    }

    public record BuyerDigitalDeliveryItem(String orderItemId, String listingId, String productId,
                                           String title, String imageUrl, String sellerStoreId,
                                           String sellerStoreDisplayName, String marketplaceCode,
                                           String categoryCode, String deliveryStatus,
                                           boolean revealEligible, boolean revealedAccessed,
                                           LocalDateTime revealedAt, boolean issueReported,
                                           String refundEligibilityWarning,
                                           List<String> availableActions, String route) {
    }

    public record BuyerDigitalRevealEligibility(boolean eligible, String eligibilityStatus,
                                                String blockedReason, boolean paymentSatisfied,
                                                boolean sellerAccepted, boolean deliveryReady,
                                                boolean payloadValidated, boolean alreadyRevealed,
                                                boolean orderActive, boolean userOwnsOrder,
                                                boolean acknowledgementRequired,
                                                String userSafeMessage) {
    }

    public record BuyerRevealAcknowledgementRequest(boolean buyerAcknowledgedSharitySecureDelivery,
                                                    boolean buyerAcknowledgedRefundEligibilityMayChange,
                                                    boolean buyerAcknowledgedNoChatCodeSharing,
                                                    boolean buyerAcknowledgedIssueReportPath,
                                                    boolean buyerAcknowledgedRevealLogged) {
    }

    public record BuyerRevealRequest(BuyerRevealAcknowledgementRequest acknowledgement, String revealSessionId) {
    }

    public record BuyerRevealResponse(boolean success, String orderItemId, String deliveryStatus,
                                      LocalDateTime revealedAt, BuyerRevealPayload payload,
                                      boolean copyAllowed, boolean secureAccessAllowed,
                                      boolean reportIssueAvailable, String userSafeMessage) {
    }

    public record BuyerRevealPayload(String payloadType, String maskedValue, String revealedValue,
                                     String secureAccessUrl, String accessInstructions,
                                     LocalDateTime expiresAt, String displayMode) {
    }

    public record BuyerDigitalDeliveryHistoryItem(String eventCode, String label, String message,
                                                  LocalDateTime timestamp, boolean current,
                                                  boolean completed, String userSafeMessage) {
    }

    public record BuyerDigitalDeliveryIssueRequest(String reasonCode, String message,
                                                   boolean buyerAcknowledgedIssueReview) {
    }

    public record BuyerDigitalDeliveryPolicyWarning(boolean noChatCodeSharing, boolean secureDeliveryOnly,
                                                    boolean refundEligibilityMayChangeAfterReveal,
                                                    boolean revealLoggedForSafety, String policyRoute,
                                                    String userSafeMessage) {
    }

    public record BuyerDigitalDeliveryActionEligibility(boolean refreshStatus, boolean revealAccess,
                                                        boolean copyPayload, boolean openSecureAccess,
                                                        boolean reportIssue, boolean contactSeller,
                                                        boolean openRefundRequest,
                                                        boolean openSharityReview,
                                                        List<String> disabledReasons) {
    }

    public record BuyerDigitalDeliveryActionResponse(boolean success, String status, String message,
                                                     String nextRoute, LocalDateTime updatedAt) {
    }

    public record DigitalLibraryResponse(List<DigitalLibraryItem> items, DigitalLibrarySummary summary,
                                         DigitalLibraryFilters filters, BuyerOrderSort sort,
                                         List<String> availableActions, LocalDateTime updatedAt) {
    }

    public record DigitalLibrarySummary(int totalItems, int readyForRevealCount, int revealedAccessedCount,
                                        int issueReportedCount, int lockedUnavailableCount,
                                        LocalDateTime lastUpdatedAt) {
    }

    public record DigitalLibraryItem(String orderItemId, String listingId, String productId, String title,
                                     String imageUrl, String marketplaceCode, String categoryCode,
                                     String sellerStoreDisplayName, String orderReference,
                                     String deliveryStatus, String revealAccessStatus,
                                     LocalDateTime revealedAt, String issueStatus,
                                     String refundEligibilityWarning, List<String> availableActions,
                                     String route) {
    }

    public record DigitalLibraryFilters(String q, String status, String marketplaceCode,
                                        String categoryCode, String sellerStoreId) {
    }

    public record DigitalLibraryActionEligibility(boolean viewDigitalDelivery, boolean revealAccess,
                                                  boolean reportIssue, boolean viewOrderDetail,
                                                  boolean viewListing, boolean contactSeller,
                                                  boolean openRefundRequest, boolean openSharityReview,
                                                  List<String> disabledReasons) {
    }

    public record DigitalLibraryActionResponse(boolean success, String status, String message,
                                               String nextRoute, LocalDateTime updatedAt) {
    }

    public record RefundEligibilityResponse(String orderId, String scope, String scopeId, boolean eligible,
                                            String eligibilityStatus, List<RefundableOrderItem> refundableItems,
                                            RefundAmountEstimate amountEstimate, List<String> warnings,
                                            String userSafeMessage) {
    }

    public record RefundRequestFormResponse(String orderId, String scope, String scopeId,
                                            RefundEligibilityResponse eligibility,
                                            List<RefundReasonOption> reasons,
                                            List<RefundableOrderItem> refundableItems,
                                            RefundAmountEstimate amountEstimate,
                                            boolean evidencePlaceholderEnabled,
                                            boolean digitalRevealWarningRequired,
                                            String policyRoute, String userSafeMessage) {
    }

    public record RefundableOrderItem(String orderItemId, String sellerOrderId, String title, String imageUrl,
                                      boolean digitalProduct, String revealAccessStatus,
                                      BigDecimal buyerItemTotal, String currency, boolean refundable,
                                      String userSafeMessage) {
    }

    public record RefundReasonOption(String reasonCode, String label, boolean digitalReason,
                                     boolean detailsRequired, String userSafeMessage) {
    }

    public record RefundAmountEstimate(BigDecimal estimatedRefundAmount, BigDecimal nonRefundableAmount,
                                       String currency, boolean finalAmountBackendCalculated,
                                       String userSafeMessage) {
    }

    public record SubmitRefundRequest(String scope, String scopeId, String reasonCode, String message,
                                      List<String> selectedItemIds, boolean buyerAcknowledgedPolicy,
                                      boolean buyerAcknowledgedDigitalRevealWarning) {
    }

    public record RefundRequestResponse(boolean success, String refundRequestId, String status,
                                        String nextRoute, String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record RefundStatusResponse(String refundRequestId, RefundSummary summary,
                                       List<RefundTimelineItem> timeline, List<RefundRelatedItem> relatedItems,
                                       RefundActionEligibility actionEligibility, String userSafeMessage,
                                       LocalDateTime updatedAt) {
    }

    public record RefundSummary(String refundRequestId, String orderId, String scope, String status,
                                BigDecimal requestedAmount, BigDecimal approvedAmount, String currency,
                                String providerRefundStatus, boolean digitalRevealAccessed,
                                String digitalRevealNote, String userSafeMessage) {
    }

    public record RefundTimelineItem(String eventCode, String label, String message,
                                     LocalDateTime timestamp, boolean current, boolean completed,
                                     boolean failed, String userSafeMessage) {
    }

    public record RefundRelatedItem(String orderItemId, String title, String imageUrl, boolean digitalProduct,
                                    String revealAccessStatus, String refundStatus, String route) {
    }

    public record RefundActionEligibility(boolean viewOrderDetail, boolean viewDigitalDeliveryStatus,
                                          boolean contactSeller, boolean addMoreDetails,
                                          boolean openSharityReview, boolean cancelRefundRequest,
                                          boolean viewReceipt, List<String> disabledReasons) {
    }

    public record RefundActionResponse(boolean success, String status, String message,
                                       String nextRoute, LocalDateTime updatedAt) {
    }

    public record DisputeDetailResponse(String disputeId, String orderId, String scope, String scopeId,
                                        String status, DisputeEligibilityResponse eligibility,
                                        List<DisputeReasonOption> reasons,
                                        List<DisputeTimelineItem> timeline,
                                        DisputeActionEligibility actionEligibility,
                                        String digitalRevealContext, String userSafeMessage,
                                        LocalDateTime updatedAt) {
    }

    public record DisputeEligibilityResponse(String orderId, String scope, String scopeId, boolean eligible,
                                             String eligibilityStatus, List<String> blockedReasons,
                                             String userSafeMessage) {
    }

    public record DisputeReasonOption(String reasonCode, String label, boolean digitalReason,
                                      boolean evidenceRecommended, String userSafeMessage) {
    }

    public record SubmitDisputeRequest(String scope, String scopeId, String reasonCode, String message,
                                       boolean buyerAcknowledgedEvidencePlaceholder) {
    }

    public record DisputeTimelineItem(String eventCode, String label, String message,
                                      LocalDateTime timestamp, boolean current, boolean completed,
                                      String userSafeMessage) {
    }

    public record DisputeActionEligibility(boolean submitSharityReview, boolean addMoreDetails,
                                           boolean uploadEvidencePlaceholder, boolean viewDigitalDeliveryStatus,
                                           boolean viewRefundStatus, boolean contactSeller,
                                           boolean closeDispute, List<String> disabledReasons) {
    }

    public record DisputeActionResponse(boolean success, String status, String message,
                                        String nextRoute, LocalDateTime updatedAt) {
    }

    public record SellerPayoutDashboardResponse(SellerPayoutSummary summary,
                                                SellerPayoutEligibility eligibility,
                                                SellerPayoutMethodStatus methodStatus,
                                                List<SellerPayoutOrderRow> orders,
                                                List<SellerPayoutHold> holds,
                                                List<SellerPayoutHistoryItem> history,
                                                List<String> availableActions,
                                                String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record SellerPayoutSummary(BigDecimal availableForPayout, BigDecimal pendingCapture,
                                      BigDecimal pendingSellerAcceptance, BigDecimal pendingRefundWindow,
                                      BigDecimal heldReservedAmount, BigDecimal refundDisputeImpactedAmount,
                                      String currency, String estimatedNextPayoutDate,
                                      String payoutMethodStatus) {
    }

    public record SellerPayoutEligibility(String status, List<SellerPayoutRequirement> requirements,
                                          boolean eligibleForPayout, String userSafeMessage) {
    }

    public record SellerPayoutRequirement(String requirementCode, String label, boolean complete,
                                          boolean blocking, String route, String userSafeMessage) {
    }

    public record SellerPayoutOrderRow(String sellerOrderId, String sellerOrderReference,
                                       LocalDateTime orderDate, String marketplaceCode, String categoryCode,
                                       int itemCount, String captureStatus, String refundDisputeStatus,
                                       String payoutEligibilityStatus, BigDecimal sellerSafeProceedsEstimate,
                                       String currency, String holdReleaseDate, String route) {
    }

    public record SellerPayoutMethodStatus(String provider, String status, boolean setupComplete,
                                           boolean stripeLaterPlaceholder, String route,
                                           String userSafeMessage) {
    }

    public record SellerPayoutHold(String holdId, String holdType, BigDecimal amount, String currency,
                                   String sellerSafeReason, String estimatedReleaseDate,
                                   List<String> affectedSellerOrderIds) {
    }

    public record SellerPayoutHistoryItem(String payoutId, String status, BigDecimal amount, String currency,
                                          LocalDateTime createdAt, String userSafeMessage) {
    }

    public record SellerPayoutActionResponse(boolean success, String status, String message,
                                             String nextRoute, LocalDateTime updatedAt) {
    }

    public record SellerWalletDashboardResponse(String sellerId, String currency, SellerWalletSummary summary,
                                                List<SellerBalanceProjection> projections,
                                                List<SellerWalletTransaction> transactions,
                                                List<SellerWalletHold> holds,
                                                SellerPayoutMethodSummary payoutMethod,
                                                List<SellerWalletPayoutHistoryItem> payoutHistory,
                                                SellerWalletActionEligibility actionEligibility,
                                                String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record SellerWalletSummary(BigDecimal availableForPayout, BigDecimal pendingCapture,
                                      BigDecimal pendingRefundWindow, BigDecimal heldReserved,
                                      BigDecimal disputeRefundImpacted, BigDecimal nextProjectedPayoutAmount,
                                      String nextProjectedPayoutDate, BigDecimal lifetimePaidOut,
                                      String currency, String userSafeMessage) {
    }

    public record SellerBalanceProjection(String projectionId, String relatedSellerOrderId, BigDecimal amount,
                                          String currency, String status, String projectedReleaseDate,
                                          String reasonCode, String userSafeReason, String route) {
    }

    public record SellerWalletTransaction(String transactionId, String relatedSellerOrderId,
                                          String transactionType, BigDecimal amount, String currency,
                                          String status, LocalDateTime createdAt, String projectedReleaseDate,
                                          String userSafeMessage, String route) {
    }

    public record SellerWalletHold(String holdId, String relatedSellerOrderId, BigDecimal amount,
                                   String currency, String holdType, String holdStatus,
                                   String releaseCondition, String projectedReleaseDate,
                                   String userSafeReason, String route) {
    }

    public record SellerPayoutMethodSummary(boolean setupComplete, String provider, String providerLabel,
                                            String payoutMethodStatus, String nextActionRoute,
                                            String userSafeMessage) {
    }

    public record SellerWalletPayoutHistoryItem(String payoutId, BigDecimal amount, String currency,
                                                String status, LocalDateTime initiatedAt,
                                                LocalDateTime completedAt, String provider,
                                                String userSafeMessage) {
    }

    public record SellerWalletActionEligibility(boolean refreshWallet, boolean viewPayoutEligibility,
                                                boolean setupPayoutMethod, boolean viewHoldReason,
                                                boolean requestPayout, boolean contactSupport,
                                                List<String> disabledReasons) {
    }

    public record SellerWalletActionResponse(boolean success, String status, String message,
                                             String nextRoute, LocalDateTime updatedAt) {
    }

    public record CouponBreakdownPageResponse(String contextType, String contextId, String currency,
                                              List<CouponItem> availableCoupons,
                                              List<CouponItem> appliedCoupons,
                                              List<CouponItem> ineligibleCoupons,
                                              CouponBreakdown breakdown, List<CouponConflict> conflicts,
                                              List<String> availableActions, String userSafeMessage,
                                              LocalDateTime updatedAt) {
    }

    public record CouponItem(String couponId, String couponCode, String title, String couponType,
                             String discountSummary, String sellerStoreId, String sellerStoreDisplayName,
                             String marketplaceCode, String categoryCode, String listingId,
                             String expiryDate, CouponEligibility eligibility, boolean applied,
                             boolean saved, List<String> availableActions, String userSafeMessage) {
    }

    public record CouponEligibility(boolean eligible, String status, String reasonCode,
                                    String userSafeReason, BigDecimal minimumAmountRequired,
                                    BigDecimal currentEligibleAmount, List<String> applicableItemIds,
                                    List<String> applicableSellerStoreIds) {
    }

    public record CouponApplyRequest(String couponId, String couponCode, String contextType,
                                     String contextId, String applyScope, String sellerStoreId) {
    }

    public record CouponRemoveRequest(String couponId, String contextType, String contextId,
                                      String applyScope, String sellerStoreId) {
    }

    public record CouponBreakdown(BigDecimal itemSubtotal, BigDecimal sellerCouponDiscount,
                                  BigDecimal platformCouponDiscount, BigDecimal sharityCreditDiscount,
                                  BigDecimal buyerServiceFee, BigDecimal taxes, BigDecimal otherFees,
                                  BigDecimal estimatedTotal, BigDecimal finalTotal, String currency,
                                  String userSafeMessage) {
    }

    public record CouponConflict(String conflictCode, List<String> couponIds, String title,
                                 String message, String resolutionAction) {
    }

    public record CouponActionResponse(boolean success, String status, String message,
                                       CouponBreakdown updatedBreakdown, String nextRoute,
                                       LocalDateTime updatedAt) {
    }

    public record SellerCouponsResponse(List<SellerCoupon> coupons, SellerCouponSummary summary,
                                        List<String> statusFilters, List<String> availableActions,
                                        LocalDateTime updatedAt) {
    }

    public record SellerCouponSummary(int totalCoupons, int activeCount, int draftCount,
                                      int scheduledCount, int pausedCount, int expiredCount,
                                      int usageLimitReachedCount) {
    }

    public record SellerCoupon(String couponId, String couponCode, String title, String status,
                               String discountType, BigDecimal discountValue, SellerCouponScope scope,
                               String startDateTime, String endDateTime, int usageCount,
                               Integer usageLimit, Integer perBuyerLimit, BigDecimal minimumOrderAmount,
                               List<String> eligibleListingIds, List<String> eligibleCategoryCodes,
                               List<String> availableActions, String userSafeMessage) {
    }

    public record SellerCouponForm(String title, String couponCode, String discountType,
                                   BigDecimal discountValue, SellerCouponScope scope,
                                   String startDateTime, String endDateTime, Integer usageLimit,
                                   Integer perBuyerLimit, BigDecimal minimumOrderAmount,
                                   boolean sellerAcknowledgedFundingRules) {
    }

    public record SellerCouponScope(String scopeType, String marketplaceCode, String categoryCode,
                                    List<String> listingIds, String userSafeMessage) {
    }

    public record SellerCouponEligibility(boolean eligible, List<String> allowedScopes,
                                          int maxActiveCoupons, BigDecimal maxDiscountValue,
                                          String currency, List<String> blockedReasons,
                                          String userSafeMessage) {
    }

    public record SellerCouponAnalyticsPlaceholder(String couponId, int usageCount,
                                                   BigDecimal sellerFundedDiscountTotal,
                                                   String currency, String userSafeMessage) {
    }

    public record SellerCouponActionResponse(boolean success, String status, String message,
                                             String nextRoute, LocalDateTime updatedAt) {
    }

    public record RewardsDashboardResponse(SharityCreditSummary summary, List<SharityCreditItem> credits,
                                           List<GiveawayRewardItem> giveaways,
                                           List<RewardHistoryItem> history,
                                           RewardsActionEligibility actionEligibility,
                                           String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record SharityCreditSummary(BigDecimal availableCredit, BigDecimal pendingCredit,
                                       BigDecimal expiringSoon, BigDecimal usedCredit,
                                       BigDecimal cancelledExpiredCredit, String currency,
                                       String nonWithdrawableNotice) {
    }

    public record SharityCreditItem(String creditId, String title, BigDecimal amount, String currency,
                                    String creditType, String expiryDate, String eligibilityScope,
                                    String status, String usageRestrictions, String route) {
    }

    public record GiveawayRewardItem(String giveawayId, String title, String status, BigDecimal creditAmount,
                                     String currency, String route, String userSafeMessage) {
    }

    public record RewardHistoryItem(String historyId, String eventType, BigDecimal amount, String currency,
                                    LocalDateTime timestamp, String userSafeMessage) {
    }

    public record CreditEligibility(String creditId, boolean eligible, List<String> eligibleMarketplaceCodes,
                                    List<String> eligibleCategoryCodes, BigDecimal minimumCartAmount,
                                    String userSafeMessage) {
    }

    public record RewardsActionEligibility(boolean viewEligibleItems, boolean applyAtCheckout,
                                           boolean viewCreditHistory, boolean viewGiveawayDetails,
                                           boolean viewTerms, List<String> disabledReasons) {
    }

    public record SellerListingCreateEligibility(boolean eligible, boolean sellerVerified,
                                                 boolean payoutSetupComplete, boolean policyAccepted,
                                                 List<String> blockedReasons, String userSafeMessage) {
    }

    public record ListingMarketplaceOption(String marketplaceCode, String name, boolean enabled,
                                           String disabledReason) {
    }

    public record ListingCategoryOption(String categoryCode, String name, String marketplaceCode,
                                        boolean enabled, boolean digitalSupported, String disabledReason) {
    }

    public record ListingFormConfig(List<ListingMarketplaceOption> marketplaces,
                                    List<ListingCategoryOption> categories,
                                    List<String> digitalDeliveryTypes, List<String> currencies,
                                    List<ListingPolicyRequirement> policyRequirements,
                                    String userSafeMessage) {
    }

    public record ListingDraft(String draftId, String status, String title, String marketplaceCode,
                               String categoryCode, BigDecimal price, String currency,
                               List<String> mediaIds, List<String> availableActions,
                               LocalDateTime updatedAt) {
    }

    public record ListingMediaUploadResponse(boolean success, String mediaId, String previewUrl,
                                             String status, String userSafeMessage) {
    }

    public record ListingPublishRequest(boolean sellerAcknowledgedNoChatCodeSharing,
                                        boolean sellerAcknowledgedPolicy,
                                        boolean sellerAcknowledgedModeration) {
    }

    public record ListingPublishResponse(boolean success, String listingId, String status,
                                         String nextRoute, String userSafeMessage,
                                         LocalDateTime updatedAt) {
    }

    public record ListingPolicyRequirement(String requirementCode, String label, boolean required,
                                           boolean accepted, String policyRoute) {
    }

    public record ListingCreateActionResponse(boolean success, String status, String message,
                                              String nextRoute, LocalDateTime updatedAt) {
    }

    public record SellerListingsResponse(List<SellerListingCard> listings, SellerListingsSummary summary,
                                         SellerListingFilters filters, SellerListingSort sort,
                                         int page, int size, long totalElements, int totalPages,
                                         List<String> availableActions, LocalDateTime updatedAt) {
    }

    public record SellerListingsSummary(int activeCount, int draftCount, int pendingModerationCount,
                                        int pausedCount, int rejectedCount, int archivedCount,
                                        int digitalListingsCount, int needsAttentionCount,
                                        LocalDateTime updatedAt) {
    }

    public record SellerListingCard(String listingId, String productId, String title, String imageUrl,
                                    String marketplaceCode, String marketplaceName, String categoryCode,
                                    String categoryName, String subcategoryCode, String subcategoryName,
                                    String productType, boolean digitalProduct, BigDecimal price,
                                    String currency, String listingStatus, String availabilityStatus,
                                    String moderationStatus, boolean couponActive, int activeOrdersCount,
                                    boolean needsAttention, String primaryStatusMessage,
                                    List<String> availableActions, String route) {
    }

    public record SellerListingActionEligibility(boolean editListing, boolean previewListing,
                                                 boolean pauseListing, boolean resumeListing,
                                                 boolean markUnavailable, boolean archiveListing,
                                                 boolean manageCoupons, boolean viewOrders,
                                                 boolean viewAnalytics, List<String> disabledReasons) {
    }

    public record SellerListingOrdersSummary(int activeOrdersCount, int pendingAcceptanceCount,
                                             int fulfillmentPendingCount, int completedOrdersCount,
                                             String route) {
    }

    public record SellerListingAnalyticsPlaceholder(int viewsCount, int savesCount, int cartAddsCount,
                                                    int ordersCount, boolean analyticsAvailableLater,
                                                    String userSafeMessage) {
    }

    public record SellerListingFilters(String q, String marketplaceCode, String categoryCode,
                                       String listingStatus, String productType, String moderationStatus,
                                       Boolean couponActive, Boolean needsAttention) {
    }

    public record SellerListingSort(String sortCode, String label, String direction) {
    }

    public record SellerListingActionResponse(boolean success, String status, String message,
                                              SellerListingCard updatedListing, String nextRoute,
                                              LocalDateTime updatedAt) {
    }

    public record SellerDashboardResponse(String sellerId, SellerStoreStatusSummary storeStatus,
                                          List<SellerActionRequiredItem> actionRequired,
                                          SellerOrdersDashboardSummary ordersSummary,
                                          SellerListingsDashboardSummary listingsSummary,
                                          SellerFulfillmentDashboardSummary fulfillmentSummary,
                                          SellerPayoutDashboardSummary payoutSummary,
                                          SellerCouponsDashboardSummary couponsSummary,
                                          SellerMessagesDashboardSummary messagesSummary,
                                          SellerAlertsDashboardSummary alertsSummary,
                                          SellerDashboardActionEligibility actionEligibility,
                                          String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record SellerStoreStatusSummary(String storeDisplayName, String storeLogoUrl, boolean sellerVerified,
                                           boolean payoutSetupComplete, boolean marketplaceEligible,
                                           boolean policyAccepted, String sellerStatus,
                                           String nextActionLabel, String nextActionRoute,
                                           String userSafeMessage) {
    }

    public record SellerActionRequiredItem(String actionCode, String title, String message,
                                           String severity, String route, LocalDateTime dueAt,
                                           String userSafeMessage) {
    }

    public record SellerOrdersDashboardSummary(int pendingAcceptanceCount, int acceptedCount,
                                               int fulfillmentPendingCount, int completedCount,
                                               int rejectedExpiredCount, String route) {
    }

    public record SellerListingsDashboardSummary(int activeCount, int draftCount, int pausedCount,
                                                 int pendingModerationCount, int rejectedCount,
                                                 int needsAttentionCount, String route) {
    }

    public record SellerFulfillmentDashboardSummary(int digitalDeliveryPreparationRequiredCount,
                                                    int readyForBuyerRevealCount,
                                                    int deliveryIssueCount, String route) {
    }

    public record SellerPayoutDashboardSummary(BigDecimal availableForPayout, BigDecimal pendingBalance,
                                               BigDecimal heldReserved, String currency,
                                               String payoutMethodStatus, String route) {
    }

    public record SellerCouponsDashboardSummary(int activeCoupons, int scheduledCoupons,
                                                int expiredCoupons, int usageLimitReachedCount,
                                                String route) {
    }

    public record SellerMessagesDashboardSummary(int unreadCount, int orderMessageCount,
                                                 int policyWarningCount, String route) {
    }

    public record SellerAlertsDashboardSummary(int criticalCount, int warningCount, int infoCount,
                                               String route) {
    }

    public record SellerDashboardActionEligibility(boolean createListing, boolean viewOrders,
                                                   boolean viewListings, boolean viewPayouts,
                                                   boolean viewWallet, boolean manageCoupons,
                                                   boolean openMessages, boolean viewAlerts,
                                                   List<String> disabledReasons) {
    }

    public record SellerDashboardActionResponse(boolean success, String status, String message,
                                                String nextRoute, LocalDateTime updatedAt) {
    }

    public record NavigationSessionResponse(String userId, boolean authenticated, boolean emailVerified,
                                            boolean profileComplete, String preferredRole,
                                            UserRoleSummary roleSummary, NavigationBadgesResponse badges,
                                            List<String> visibleBuyerRoutes, List<String> visibleSellerRoutes,
                                            String userSafeMessage) {
    }

    public record RouteAccessResponse(String route, boolean allowed, String guardType,
                                      String redirectRoute, String reasonCode, String userSafeMessage) {
    }

    public record NavigationBadgesResponse(int cartCount, int ordersAttentionCount, int messagesUnread,
                                           int notificationsUnread, int sellerActionRequired,
                                           int sellerDeadlineCritical) {
    }

    public record UserRoleSummary(boolean buyerEnabled, boolean sellerEnabled, boolean sellerEligible,
                                  boolean adminEnabled, List<String> availableRoles,
                                  String currentRole, String userSafeMessage) {
    }

    public record PreferredRoleRequest(String preferredRole) {
    }

    public record DeepLinkResolveResponse(String inputUrl, boolean resolved, String route,
                                          boolean accessAllowed, String fallbackRoute,
                                          String userSafeMessage) {
    }

    public record ProfileCompletionResponse(String userId, int completionPercent,
                                            List<ProfileRequirement> requirements,
                                            List<CountryOption> countries,
                                            List<MarketplacePreferenceItem> marketplacePreferences,
                                            List<CurrencyDisplayOption> currencyOptions,
                                            boolean dateOfBirthRequired, boolean genderRequired,
                                            String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record ProfileRequirement(String requirementCode, String label, boolean required,
                                     boolean complete, String route, String userSafeMessage) {
    }

    public record ProfileUpdateRequest(String firstName, String lastName, String displayName,
                                       String countryCode, String region, String phoneCountryCode,
                                       String phoneNumber, String currencyCode, String dateOfBirth,
                                       String gender) {
    }

    public record CountryOption(String countryCode, String countryName, boolean supported,
                                String defaultCurrency, String userSafeMessage) {
    }

    public record PhoneUpdateRequest(String phoneCountryCode, String phoneNumber) {
    }

    public record PhoneVerificationStartResponse(boolean started, String verificationId,
                                                 String status, String userSafeMessage) {
    }

    public record MarketplacePreferenceItem(String marketplaceCode, String label, boolean enabled,
                                            boolean availableInCountry, String userSafeMessage) {
    }

    public record MarketplacePreferencesUpdateRequest(List<String> enabledMarketplaceCodes) {
    }

    public record CurrencyDisplayOption(String currencyCode, String label, boolean selected,
                                        boolean available, String userSafeMessage) {
    }

    public record ProfileCompletionActionResponse(boolean success, String status, String message,
                                                  String nextRoute, LocalDateTime updatedAt) {
    }

    public record ReceiptResponse(ReceiptSummary summary, List<ReceiptItemRow> items,
                                  ReceiptPaymentSummary paymentSummary,
                                  ReceiptActionEligibility actionEligibility,
                                  String userSafeMessage, LocalDateTime updatedAt) {
    }

    public record ReceiptSummary(String receiptId, String receiptReference, String parentOrderId,
                                 String parentOrderReference, String sellerOrderId,
                                 String sellerOrderReference, String receiptStatus,
                                 LocalDateTime orderDate, BigDecimal buyerFacingTotal,
                                 String currency, String paymentProviderLabel,
                                 String paymentStatus, String captureStatus, String refundStatus) {
    }

    public record ReceiptItemRow(String orderItemId, String listingTitle, String marketplaceCode,
                                 String categoryCode, int quantity, BigDecimal unitPrice,
                                 BigDecimal discountImpact, BigDecimal buyerLineTotal,
                                 String currency) {
    }

    public record ReceiptPaymentSummary(BigDecimal itemSubtotal, BigDecimal sellerCouponDiscount,
                                        BigDecimal platformCouponDiscount,
                                        BigDecimal sharityCreditDiscount, BigDecimal buyerServiceFee,
                                        BigDecimal taxes, BigDecimal otherFees,
                                        BigDecimal finalBuyerTotal, BigDecimal authorizedAmount,
                                        BigDecimal capturedAmount, BigDecimal refundedAmount,
                                        String currency, String userSafeMessage) {
    }

    public record ReceiptActionEligibility(boolean viewReceipt, boolean downloadPdfPlaceholder,
                                           boolean shareReceiptPlaceholder, boolean viewOrderDetail,
                                           boolean viewRefundStatus, List<String> disabledReasons) {
    }

    public record ReceiptActionResponse(boolean success, String status, String message,
                                        String nextRoute, LocalDateTime updatedAt) {
    }

    public static CartResponse mockCart() {
        LocalDateTime now = LocalDateTime.now();
        CartItem digital = cartItem("cart-item-057-a", "Premium Template Pack", true, false,
                "DIGITAL", "READY", "29.99", "39.99");
        CartItem physical = cartItem("cart-item-057-b", "Open Box Headphones", false, true,
                "ELECTRONICS", "SELLER_ACCEPTANCE_REQUIRED", "249.00", "249.00");
        CartItem blocked = cartItem("cart-item-057-c", "Unavailable Digital Gift Code", true, false,
                "DIGITAL", "DIGITAL_DELIVERY_UNAVAILABLE", "14.99", "14.99");
        CartCheckoutEligibility allEligibility = new CartCheckoutEligibility(true, true,
                List.of(digital.cartItemId(), physical.cartItemId()), List.of(blocked.cartItemId()),
                List.of("store-digital-hub", "store-tech-deals"), List.of("DIGITAL_DELIVERY_UNAVAILABLE"),
                false, false, "Checkout eligible items or a single seller group.", "/checkout/review");
        CartWarning warning = new CartWarning("PAYMENT_AUTHORIZATION_FIRST", "INFO",
                "Authorize-first payment", "Payment may be captured after seller acceptance.",
                null, "store-tech-deals", "Review checkout", "/cart/review");
        CartSummary summary = new CartSummary(3, 2, 1, 2, 2, money("293.98"), money("5.00"),
                money("10.00"), money("3.50"), money("0.00"), money("282.48"), true, 0);
        CartFeePreview feePreview = new CartFeePreview(summary.subtotal(), summary.sellerCouponDiscountTotal(),
                summary.platformCouponDiscountTotal(), summary.estimatedServiceFee(), summary.estimatedTaxes(),
                money("0.00"), summary.estimatedTotal(), "VISIBLE", true,
                "Final fees are confirmed during checkout.");
        CartCoupon sellerCoupon = new CartCoupon("coupon-seller-10", "SELLER", "Digital Studio Deal",
                "$5.00 off", "store-digital-hub", "DIGITAL", "TEMPLATES", "2026-12-31",
                "ELIGIBLE", true, true, null, true, "Seller coupon applied.");
        CartCoupon platformCoupon = new CartCoupon("coupon-platform-10", "PLATFORM", "Sharity Welcome",
                "$10.00 off", null, null, null, "2026-12-31", "ELIGIBLE",
                true, false, null, true, "Platform coupon applied.");
        return new CartResponse("cart-057", "buyer-1000", "USD", summary,
                List.of(new CartSellerGroup("store-digital-hub", "Digital Studio", "marketplace/placeholders/gift_cards.png",
                                true, "AVAILABLE", List.of(digital), money("29.99"), money("5.00"),
                                money("3.00"), money("1.75"), money("0.00"), money("23.74"),
                                false, true, allEligibility, List.of(), List.of("VIEW_STORE", "CHECKOUT_SELLER_GROUP")),
                        new CartSellerGroup("store-tech-deals", "Tech Deals Phoenix", "marketplace/placeholders/electronics.png",
                                true, "AVAILABLE", List.of(physical), money("249.00"), money("0.00"),
                                money("7.00"), money("1.75"), money("0.00"), money("243.75"),
                                true, true, allEligibility, List.of(warning), List.of("VIEW_STORE", "CHECKOUT_SELLER_GROUP"))),
                List.of(blocked), List.of(sellerCoupon, platformCoupon),
                List.of(sellerCoupon, platformCoupon,
                        new CartCoupon("coupon-expired", "PLATFORM", "Expired coupon", "$4.00 off",
                                null, null, null, "2026-01-01", "EXPIRED", false, false,
                                "Coupon expired.", false, "This coupon is no longer available.")),
                feePreview,
                new CartPaymentAuthorizationSummary(true, true, true, List.of("store-tech-deals"),
                        "Some items may be authorized first and captured after seller acceptance."),
                allEligibility, List.of(warning), List.of("APPLY_COUPON", "MOVE_TO_SAVED",
                "CHECKOUT_ALL_ELIGIBLE", "CLEAR_CART"), now);
    }

    public static CheckoutReviewResponse mockCheckout(String checkoutId) {
        LocalDateTime now = LocalDateTime.now();
        CheckoutItem digital = checkoutItem("checkout-item-a", "Premium Template Pack", true, "READY", "29.99");
        CheckoutItem physical = checkoutItem("checkout-item-b", "Open Box Headphones", false,
                "SELLER_ACCEPTANCE_REQUIRED", "249.00");
        CheckoutSellerGroup digitalGroup = new CheckoutSellerGroup("store-digital-hub", "Digital Studio",
                "marketplace/placeholders/gift_cards.png", true, false, null, List.of(digital),
                new CheckoutSellerGroupFeeBreakdown(money("29.99"), money("5.00"), money("3.00"),
                        money("1.75"), money("0.00"), money("23.74"), "USD"),
                List.of("VIEW_STORE", "VIEW_LISTING"));
        CheckoutSellerGroup physicalGroup = new CheckoutSellerGroup("store-tech-deals", "Tech Deals Phoenix",
                "marketplace/placeholders/electronics.png", true, true, now.plusHours(24), List.of(physical),
                new CheckoutSellerGroupFeeBreakdown(money("249.00"), money("0.00"), money("7.00"),
                        money("1.75"), money("0.00"), money("243.75"), "USD"),
                List.of("VIEW_STORE", "VIEW_LISTING"));
        CheckoutFeeBreakdown fee = new CheckoutFeeBreakdown(money("278.99"), money("5.00"),
                money("10.00"), money("3.50"), money("0.00"), money("0.00"),
                money("267.49"), money("267.49"), "USD", true,
                "This amount is authorized first; capture follows seller acceptance where required.");
        CheckoutPaymentMethod paypal = new CheckoutPaymentMethod("pm-paypal", "PAYPAL", "PayPal",
                true, true, false, null, "PayPal is available.");
        return new CheckoutReviewResponse(checkoutId, "cart-057", "USD", "READY_TO_AUTHORIZE",
                List.of(digitalGroup, physicalGroup), fee,
                List.of(new CheckoutCoupon("coupon-platform-10", "SHARITY10", "PLATFORM",
                        "Sharity Welcome", "$10.00 off", null, "CHECKOUT", "2026-12-31",
                        "ELIGIBLE", true, null, "Coupon applied.")),
                List.of(paypal, new CheckoutPaymentMethod("pm-stripe", "STRIPE", "Stripe",
                        false, false, true, "STRIPE_LATER", "Stripe is coming later.")),
                paypal,
                new CheckoutSellerAcceptanceSummary(true, List.of("store-tech-deals"), true,
                        now.plusHours(24), "Authorization is voided or released.",
                        "Authorization may be voided if the seller does not respond.",
                        "Your authorization may be released according to provider rules.",
                        "One seller must accept before capture."),
                List.of(new CheckoutDigitalDeliveryWarning("DIGITAL_SAFE_DELIVERY",
                        "Digital delivery safety", "Digital delivery happens through Sharity only.",
                        true, true, "/checkout/digital-delivery")),
                new CheckoutPolicySummary("MARKETPLACE_POLICY_2026_06",
                        List.of("No off-platform payment", "Refund rules may change after digital reveal"),
                        false, "/checkout/policy", "Review marketplace policy summary."),
                List.of(), List.of("APPLY_COUPON", "SELECT_PAYMENT_METHOD", "AUTHORIZE_PAYMENT",
                "RETURN_TO_CART"), "Ready to authorize with PayPal.", now);
    }

    public static PaymentAuthorizationPageResponse mockPayment(String checkoutId) {
        LocalDateTime now = LocalDateTime.now();
        return new PaymentAuthorizationPageResponse(checkoutId, "payauth-059", "payattempt-001",
                "PAYPAL", money("267.49"), "USD", 2, 2, "AUTHORIZE_FIRST",
                "CAPTURE_AFTER_SELLER_ACCEPTANCE",
                new PaymentProviderAvailabilityResponse(List.of(
                        new ProviderAvailabilityItem("PAYPAL", true, true, false, null,
                                "PayPal is available."),
                        new ProviderAvailabilityItem("STRIPE", false, false, true,
                                "STRIPE_LATER", "Stripe is coming later."),
                        new ProviderAvailabilityItem("MOCK", true, false, false, null,
                                "Mock payment is available in development.")),
                        "PAYPAL", "PayPal first for MVP."),
                "AUTHORIZED_PENDING_SELLER_ACCEPTANCE",
                paymentTimeline(now),
                new SellerAcceptanceNextStepResponse(true, List.of("store-tech-deals"), true,
                        now.plusHours(24), "Authorization may be released.",
                        "Authorization may be voided or released.",
                        "Release timing depends on provider rules.", "/order-status/order-060",
                        "Seller acceptance is the next step."),
                new DigitalDeliveryNextStepResponse(true, true, true, true, true,
                        true, true, "/orders/order-060/digital-delivery-status",
                        "Digital delivery is available after order/payment rules are satisfied."),
                List.of("CONTINUE_TO_PAYPAL", "VIEW_PAYMENT_STATUS", "CANCEL_PAYMENT"), 
                "Payment authorization is backend-verified and webhook-aware.");
    }

    public static PaymentAuthorizationStatusResponse mockPaymentStatus(String paymentAuthorizationId) {
        return new PaymentAuthorizationStatusResponse(paymentAuthorizationId, "checkout-058", "PAYPAL",
                "AUTHORIZED_PENDING_SELLER_ACCEPTANCE", true, false, false, false,
                false, true, false, "SH-060", "/order-status/order-060",
                "Payment is authorized and waiting on seller acceptance.", LocalDateTime.now());
    }

    public static OrderPaymentStatusResponse mockOrderStatus(String orderId, String paymentAuthorizationId) {
        LocalDateTime now = LocalDateTime.now();
        ParentOrderSummary parent = new ParentOrderSummary(orderId, "SH-060", "SELLER_ACCEPTANCE_PENDING",
                "AUTHORIZED", money("267.49"), money("267.49"), money("23.74"),
                "USD", 2, 2, now.minusMinutes(12),
                "One seller must accept before capture.");
        SellerOrderGroupStatus digitalGroup = orderGroup("seller-order-060-a", "store-digital-hub",
                "Digital Studio", "ACCEPTED", "CAPTURED", "NONE", money("23.74"), true, now);
        SellerOrderGroupStatus physicalGroup = orderGroup("seller-order-060-b", "store-tech-deals",
                "Tech Deals Phoenix", "PENDING", "CAPTURE_PENDING", "NONE", money("243.75"), false, now);
        return new OrderPaymentStatusResponse(paymentAuthorizationId, "checkout-058", orderId,
                "PAYMENT_AUTHORIZED", "AUTHORIZED", "SELLER_ACCEPTANCE_PENDING",
                "ORDER_CREATED", "AUTHORIZED", parent, List.of(digitalGroup, physicalGroup),
                new OrderPaymentSummary("PAYPAL", money("267.49"), money("23.74"), money("0.00"),
                        money("0.00"), "USD", "AUTHORIZED", "PARTIAL_CAPTURE_PENDING",
                        money("3.50"), money("5.00"), money("10.00"), money("0.00"),
                        money("0.00"), money("267.49"),
                        "Authorized amount is buyer-facing; seller payout details are hidden."),
                new SellerAcceptanceSummary(true, List.of("seller-order-060-b"),
                        List.of("seller-order-060-a"), List.of(), List.of(), now.plusHours(24),
                        "One seller must accept before capture."),
                new DigitalDeliveryNextStepSummary(true, true, false, true, true,
                        "/orders/" + orderId + "/digital-delivery-status",
                        "Digital delivery happens through Sharity only."),
                new ReceiptPlaceholderResponse(false, null, "/orders/" + orderId + "/receipt",
                        true, "Receipt will be available when payment status is finalized.",
                        List.of(new ReceiptSummaryRow("Authorized amount", "$267.49", "TOTAL",
                                "Buyer-facing authorization amount."))),
                new OrderSafeMessagingAvailability(true, "/messages/order/" + orderId, null,
                        "Safe Messaging is available for this order."),
                new OrderCancellationEligibility(true, true, "ORDER_OR_SELLER_GROUP",
                        null, List.of("seller-order-060-b"), "Cancellation is backend-controlled."),
                orderTimeline(now), List.of("VIEW_ORDER_DETAILS", "REFRESH_STATUS", "CONTACT_SELLER",
                "CANCEL_ORDER", "CONTINUE_SHOPPING"), "/orders/" + orderId,
                "Your payment was authorized. Seller acceptance may be required before capture.", now);
    }

    public static BuyerOrdersResponse mockBuyerOrders() {
        LocalDateTime now = LocalDateTime.now();
        BuyerOrderCard active = buyerOrderCard("order-060", "SH-060", "SELLER_ACCEPTANCE_PENDING",
                "AUTHORIZED", "Payment authorized. Seller acceptance pending.", now.minusMinutes(18),
                true, false);
        BuyerOrderCard completed = buyerOrderCard("order-061-complete", "SH-061", "COMPLETED",
                "CAPTURED", "Digital delivery is ready.", now.minusDays(2), false, true);
        BuyerOrderCard refund = buyerOrderCard("order-061-refund", "SH-062", "REFUND_PENDING",
                "REFUND_PENDING", "Refund request is under review.", now.minusDays(5), false, false);
        return new BuyerOrdersResponse(List.of(active, completed, refund),
                new BuyerOrdersSummary(3, 1, 1, 1, 0, 1, now),
                new BuyerOrderFilters(null, null, "ALL", null, null, null, null, null),
                new BuyerOrderSort("NEWEST", "Newest first", "DESC"), 0, 20, 3, 1,
                List.of("SEARCH", "FILTER", "SORT", "REFRESH"), now);
    }

    public static BuyerOrderDetailResponse mockBuyerOrderDetail(String orderId) {
        LocalDateTime now = LocalDateTime.now();
        BuyerOrderItemDetail digital = buyerOrderItemDetail("order-item-detail-a", "Premium Template Pack",
                true, "WAITING_FOR_SELLER_ACCEPTANCE", money("23.74"));
        BuyerOrderItemDetail physical = buyerOrderItemDetail("order-item-detail-b", "Open Box Headphones",
                false, "SELLER_ACCEPTANCE_PENDING", money("243.75"));
        BuyerSellerOrderGroupDetail digitalGroup = new BuyerSellerOrderGroupDetail("seller-order-060-a",
                "store-digital-hub", "SH-060-A", "Digital Studio",
                "marketplace/placeholders/gift_cards.png", true, "ACCEPTED", now.plusHours(18),
                "CAPTURED", "NONE", "NONE", money("23.74"), "USD", List.of(digital),
                List.of("VIEW_SELLER_GROUP", "VIEW_DIGITAL_DELIVERY", "CONTACT_SELLER"),
                "Digital delivery waits for order/payment rules.", "/orders/" + orderId + "/seller-groups/seller-order-060-a");
        BuyerSellerOrderGroupDetail physicalGroup = new BuyerSellerOrderGroupDetail("seller-order-060-b",
                "store-tech-deals", "SH-060-B", "Tech Deals Phoenix",
                "marketplace/placeholders/electronics.png", true, "PENDING", now.plusHours(24),
                "CAPTURE_PENDING", "NONE", "NONE", money("243.75"), "USD", List.of(physical),
                List.of("VIEW_SELLER_GROUP", "CONTACT_SELLER", "CANCEL_SELLER_GROUP"),
                "Seller acceptance is pending.", "/orders/" + orderId + "/seller-groups/seller-order-060-b");
        return new BuyerOrderDetailResponse(
                new BuyerParentOrderDetail(orderId, "SH-060", now.minusMinutes(20),
                        "SELLER_ACCEPTANCE_PENDING", "AUTHORIZED", money("267.49"), money("267.49"),
                        money("23.74"), "USD", 2, 2, 1,
                        "One seller must accept before capture."),
                List.of(digitalGroup, physicalGroup), List.of(digital, physical),
                new BuyerOrderPaymentSummary("PAYPAL", "AUTHORIZED", "PARTIAL_CAPTURE_PENDING",
                        "NONE", money("267.49"), money("23.74"), money("0.00"),
                        money("0.00"), money("267.49"), "USD",
                        "Payment status is backend-confirmed."),
                buyerDetailTimeline(now),
                new BuyerDigitalDeliverySummary(true, "WAITING_FOR_SELLER_ACCEPTANCE", 0, 1,
                        true, true, "/orders/" + orderId + "/digital-delivery",
                        "Digital codes and raw URLs are never shown here."),
                new BuyerReceiptPlaceholder(false, null, "/orders/" + orderId + "/receipt",
                        true, "Receipt will be available after payment status finalizes."),
                new BuyerOrderActionEligibility(true, true, true, true, true, true, true,
                        false, false, false, List.of("RECEIPT_PENDING")),
                new BuyerOrderMessagingAvailability(true, "/messages/order/" + orderId, null,
                        "Use Safe Messaging only."),
                new BuyerOrderCancellationEligibility(true, true, "ORDER_OR_SELLER_GROUP",
                        null, List.of("seller-order-060-b"), "Cancellation is backend-controlled."),
                List.of("VIEW_ORDER_STATUS", "VIEW_SELLER_GROUP", "CONTACT_SELLER", "CANCEL_ORDER",
                        "REQUEST_REFUND", "OPEN_DISPUTE", "CONTINUE_SHOPPING"),
                "Buyer-safe order detail loaded.", now);
    }

    public static SellerOrdersResponse mockSellerOrders() {
        LocalDateTime now = LocalDateTime.now();
        SellerOrderCard pending = new SellerOrderCard("seller-order-063-a", "SH-063-A", "SH-063",
                now.minusMinutes(30), now.plusHours(23), "PENDING", "CAPTURE_PENDING",
                1, 1, "BuyerRiver", money("39.99"), "USD", false, null,
                List.of("VIEW_SELLER_ORDER", "ACCEPT_ORDER", "REJECT_ORDER", "CONTACT_BUYER"),
                "/seller/orders/seller-order-063-a", "Payment capture may start after acceptance.");
        SellerOrderCard accepted = new SellerOrderCard("seller-order-063-b", "SH-063-B", "SH-063",
                now.minusDays(1), now.plusHours(3), "ACCEPTED", "CAPTURED",
                1, 1, "BuyerSky", money("29.99"), "USD", true, money("25.49"),
                List.of("VIEW_SELLER_ORDER", "PREPARE_DIGITAL_DELIVERY"),
                "/seller/orders/seller-order-063-b", "Digital delivery preparation required.");
        return new SellerOrdersResponse(List.of(pending, accepted),
                new SellerOrdersSummary(2, 1, 1, 0, 0, 1, 1, 0, now),
                new SellerOrderFilters(null, "ALL", null, null, null, null),
                new SellerOrderSort("NEWEST", "Newest first", "DESC"), 0, 20, 2, 1,
                List.of("SEARCH", "FILTER", "SORT", "REFRESH"), now);
    }

    public static SellerOrderDetail mockSellerOrderDetail(String sellerOrderId) {
        LocalDateTime now = LocalDateTime.now();
        SellerOrderItem item = new SellerOrderItem("seller-order-item-063", "listing-063",
                "product-063", "Premium Template Pack", "marketplace/placeholders/gift_cards.png",
                "DIGITAL", "TEMPLATES", "DIGITAL_PRODUCT", true, 1,
                "PENDING_ACCEPTANCE", "PREPARATION_REQUIRED", "/listings/listing-063");
        return new SellerOrderDetail(sellerOrderId, "SH-063-A", "SH-063", "BuyerRiver",
                "PENDING", now.plusHours(23), "AUTHORIZED", "CAPTURE_PENDING", List.of(item),
                sellerDigitalPreparation("NOT_PREPARED"),
                new SellerOrderMessagingAvailability(true, "/seller/orders/" + sellerOrderId + "/messages",
                        null, true, "Safe Messaging only. Digital code sharing is blocked."),
                new SellerOrderActionEligibility(true, true, true, true, true, true, true, List.of()),
                "NONE", List.of("ACCEPT_ORDER", "REJECT_ORDER", "PREPARE_DIGITAL_DELIVERY",
                "CONTACT_BUYER"), "Seller order loaded with buyer-safe data only.", now);
    }

    public static SellerFulfillmentDetailResponse mockSellerFulfillment(String sellerOrderId) {
        LocalDateTime now = LocalDateTime.now();
        SellerFulfillmentItem item = new SellerFulfillmentItem("seller-order-item-064", "listing-064",
                "product-064", "Premium Template Pack", "marketplace/placeholders/gift_cards.png",
                "DIGITAL", "TEMPLATES", "DIGITAL_PRODUCT", true, 1, "ACCEPTED",
                "DRAFT_PREPARATION", true, "/listings/listing-064");
        return new SellerFulfillmentDetailResponse(sellerOrderId, "order-064", "SH-064-A",
                "SH-064", new SellerBuyerDisplay("BuyerRiver", "BuyerRiver", true,
                "Buyer private contact info is hidden for digital MVP."), "ACCEPTED",
                now.plusHours(21), "AUTHORIZED", "CAPTURE_PENDING", "NONE", "FULFILLMENT_PENDING",
                1, 1, money("39.99"), "USD",
                new SellerSafePayoutEstimate(true, money("32.50"), "USD", "PAYOUT_PENDING",
                        "Seller-safe estimate only."),
                List.of(item), List.of(
                new SellerFulfillmentChecklistItem("SELLER_ACCEPTED", "Seller accepted order", true, true, false,
                        "Complete.", null),
                new SellerFulfillmentChecklistItem("DIGITAL_DELIVERY_PREPARED", "Digital delivery prepared", false, true, false,
                        "Prepare secure delivery through Sharity.", "/seller/orders/" + sellerOrderId + "/digital-delivery/prepare"),
                new SellerFulfillmentChecklistItem("MARK_READY", "Marked ready for buyer reveal", false, true, true,
                        "Validation is required first.", null)),
                sellerDigitalPreparation("DRAFT_PREPARATION"),
                List.of(new SellerOrderPolicyWarning("NO_CHAT_CODES", "No code sharing",
                        "Digital items must be delivered only through Sharity secure delivery.",
                        "WARNING", "/seller/orders/" + sellerOrderId + "/policy", true)),
                new SellerRefundDisputeIndicator("NONE", false, false, false,
                        "No refund or dispute is active.", null),
                new SellerOrderMessagingAvailability(true, "/seller/orders/" + sellerOrderId + "/messages",
                        null, true, "Safe Messaging is available."),
                new SellerOrderCancellationEligibility(true, "SELLER_ORDER", null,
                        "Cancellation is backend-controlled."),
                List.of("PREPARE_DIGITAL_DELIVERY", "VALIDATE_DELIVERY", "MARK_READY",
                        "CONTACT_BUYER", "REPORT_ISSUE", "REFRESH_STATUS"),
                "Secure delivery payloads are never returned in normal UI lists.", now);
    }

    public static BuyerDigitalDeliveryResponse mockBuyerDigitalDelivery(String orderId) {
        LocalDateTime now = LocalDateTime.now();
        BuyerDigitalDeliveryItem item = new BuyerDigitalDeliveryItem("order-item-065", "listing-065",
                "product-065", "Premium Template Pack", "marketplace/placeholders/gift_cards.png",
                "store-digital-hub", "Digital Studio", "DIGITAL", "TEMPLATES",
                "READY_FOR_BUYER_REVEAL", true, false, null, false,
                "Reveal/access may affect refund eligibility.",
                List.of("REVEAL_ACCESS", "REPORT_ISSUE", "VIEW_LISTING"),
                "/orders/" + orderId + "/digital-delivery/items/order-item-065");
        return new BuyerDigitalDeliveryResponse(orderId, "SH-065",
                new BuyerDigitalDeliveryPageSummary(1, 1, 0, 0, 0,
                        "READY_FOR_BUYER_REVEAL", "A digital item is ready for secure reveal."),
                List.of(item), digitalPolicyWarning(),
                new BuyerDigitalDeliveryActionEligibility(true, true, true, true, true,
                        true, true, true, List.of()),
                digitalHistory(now), "Digital delivery happens only through Sharity secure delivery.", now);
    }

    public static DigitalLibraryResponse mockDigitalLibrary() {
        LocalDateTime now = LocalDateTime.now();
        List<DigitalLibraryItem> items = List.of(
                new DigitalLibraryItem("order-item-065", "listing-065", "product-065",
                        "Premium Template Pack", "marketplace/placeholders/gift_cards.png", "DIGITAL",
                        "TEMPLATES", "Digital Studio", "SH-065", "READY_FOR_REVEAL",
                        "NOT_REVEALED", null, "NONE", "Reveal/access may affect refund eligibility.",
                        List.of("VIEW_DIGITAL_DELIVERY", "REVEAL_ACCESS", "REPORT_ISSUE"),
                        "/orders/order-065/digital-delivery/items/order-item-065"),
                new DigitalLibraryItem("order-item-066-revealed", "listing-066", "product-066",
                        "Creator License Key", "marketplace/placeholders/gift_cards.png", "DIGITAL",
                        "LICENSES", "License Market", "SH-066", "REVEALED_ACCESSED",
                        "REVEALED", now.minusDays(1), "NONE", "Refund eligibility may be limited after reveal.",
                        List.of("VIEW_DIGITAL_DELIVERY", "VIEW_ORDER_DETAIL"),
                        "/orders/order-066/digital-delivery/items/order-item-066-revealed"),
                new DigitalLibraryItem("order-item-066-issue", "listing-067", "product-067",
                        "Game Credit Code", "marketplace/placeholders/gift_cards.png", "DIGITAL",
                        "GAMING", "Game Code Hub", "SH-067", "ISSUE_REPORTED",
                        "REVEALED", now.minusHours(6), "ISSUE_REPORTED",
                        "Sharity Review may be required after reveal.",
                        List.of("VIEW_DIGITAL_DELIVERY", "OPEN_SHARITY_REVIEW"),
                        "/orders/order-067/digital-delivery/items/order-item-066-issue"));
        return new DigitalLibraryResponse(items, new DigitalLibrarySummary(3, 1, 2, 1, 0, now),
                new DigitalLibraryFilters(null, "ALL", null, null, null),
                new BuyerOrderSort("NEWEST", "Newest first", "DESC"),
                List.of("SEARCH", "FILTER_READY", "FILTER_REVEALED", "FILTER_ISSUES", "REFRESH"), now);
    }

    public static DigitalLibraryActionEligibility mockDigitalLibraryActions(String orderItemId) {
        return new DigitalLibraryActionEligibility(true, true, true, true, true, true,
                true, true, List.of());
    }

    public static RefundEligibilityResponse mockRefundEligibility(String orderId, String scope, String scopeId) {
        RefundableOrderItem item = new RefundableOrderItem("order-item-067", "seller-order-067",
                "Premium Template Pack", "marketplace/placeholders/gift_cards.png", true,
                "NOT_REVEALED", money("39.99"), "USD", true,
                "Eligible before reveal. Backend confirms final amount.");
        return new RefundEligibilityResponse(orderId, scope, scopeId, true, "ELIGIBLE",
                List.of(item), new RefundAmountEstimate(money("39.99"), money("0.00"), "USD",
                true, "Refund estimate is backend-driven."), List.of("Reveal/access may reduce eligibility."),
                "Refund request is eligible but approval is not guaranteed.");
    }

    public static RefundRequestFormResponse mockRefundForm(String orderId, String scope, String scopeId) {
        RefundEligibilityResponse eligibility = mockRefundEligibility(orderId, scope, scopeId);
        return new RefundRequestFormResponse(orderId, scope, scopeId, eligibility,
                List.of(new RefundReasonOption("DIGITAL_DOES_NOT_WORK", "Digital item does not work", true, true,
                                "Use when code/access fails."),
                        new RefundReasonOption("CODE_ALREADY_USED", "Code already used", true, true,
                                "Useful after secure reveal."),
                        new RefundReasonOption("SELLER_DID_NOT_DELIVER", "Seller did not deliver", true, true,
                                "Use when delivery is missing."),
                        new RefundReasonOption("OTHER", "Other", false, true, "Explain the issue.")),
                eligibility.refundableItems(), eligibility.amountEstimate(), true, true,
                "/policies/refunds", "Review policy and acknowledgements before submitting.");
    }

    public static RefundStatusResponse mockRefundStatus(String refundRequestId) {
        LocalDateTime now = LocalDateTime.now();
        RefundRelatedItem item = new RefundRelatedItem("order-item-067", "Premium Template Pack",
                "marketplace/placeholders/gift_cards.png", true, "REVEALED",
                "UNDER_REVIEW", "/orders/order-067/items/order-item-067");
        return new RefundStatusResponse(refundRequestId,
                new RefundSummary(refundRequestId, "order-067", "ITEM", "UNDER_REVIEW",
                        money("39.99"), money("0.00"), "USD", "NOT_INITIATED", true,
                        "Digital item was revealed, so Sharity Review may be required.",
                        "Refund is under review."),
                List.of(new RefundTimelineItem("REQUESTED", "Refund requested",
                                "Buyer submitted refund request.", now.minusHours(2), false, true, false,
                                "Submitted."),
                        new RefundTimelineItem("UNDER_REVIEW", "Under review",
                                "Sharity is reviewing the request.", now.minusHours(1), true, false, false,
                                "Review in progress.")),
                List.of(item), new RefundActionEligibility(true, true, true, true, true,
                true, true, List.of()), "Buyer-safe refund status only.", now);
    }

    public static DisputeDetailResponse mockDispute(String disputeId) {
        LocalDateTime now = LocalDateTime.now();
        DisputeEligibilityResponse eligibility = new DisputeEligibilityResponse("order-069", "ITEM",
                "order-item-069", true, "ELIGIBLE", List.of(),
                "Sharity Review is available for this digital delivery issue.");
        return new DisputeDetailResponse(disputeId, "order-069", "ITEM", "order-item-069",
                "UNDER_SHARITY_REVIEW", eligibility,
                List.of(new DisputeReasonOption("DIGITAL_CODE_INVALID", "Digital code invalid", true, true,
                                "Use when secure reveal payload does not work."),
                        new DisputeReasonOption("SELLER_SHARED_CODE_IN_CHAT", "Seller shared code in chat", true, true,
                                "Code sharing in chat is not allowed."),
                        new DisputeReasonOption("REFUND_REJECTED_UNFAIRLY", "Refund rejected unfairly", false, true,
                                "Use after refund decision.")),
                List.of(new DisputeTimelineItem("SUBMITTED", "Submitted",
                                "Sharity Review was submitted.", now.minusHours(4), false, true,
                                "Submitted."),
                        new DisputeTimelineItem("UNDER_REVIEW", "Under Sharity Review",
                                "Review team is checking buyer-safe evidence.", now.minusHours(2), true, false,
                                "Under review.")),
                new DisputeActionEligibility(false, true, true, true, true, true, true, List.of("ALREADY_SUBMITTED")),
                "Digital reveal occurred through secure flow; raw payload is hidden.",
                "Internal review notes are not exposed.", now);
    }

    public static SellerPayoutDashboardResponse mockSellerPayouts() {
        LocalDateTime now = LocalDateTime.now();
        List<SellerPayoutRequirement> requirements = List.of(
                new SellerPayoutRequirement("SELLER_VERIFIED", "Seller verification complete", true, true,
                        "/seller/verification", "Complete."),
                new SellerPayoutRequirement("PAYOUT_METHOD", "Payout method setup", false, true,
                        "/seller/payouts/method", "PayPal setup is required."),
                new SellerPayoutRequirement("NO_ACTIVE_DISPUTE_HOLD", "No active dispute hold", false, true,
                        "/seller/payouts/holds", "One payout amount is held due to dispute."));
        List<SellerPayoutOrderRow> orders = List.of(
                new SellerPayoutOrderRow("seller-order-070-a", "SH-070-A", now.minusDays(1),
                        "DIGITAL", "TEMPLATES", 1, "CAPTURED", "NONE", "AVAILABLE_SOON",
                        money("32.50"), "USD", "2026-06-10", "/seller/orders/seller-order-070-a"),
                new SellerPayoutOrderRow("seller-order-070-b", "SH-070-B", now.minusDays(2),
                        "DIGITAL", "GAMING", 1, "CAPTURED", "DISPUTE_ACTIVE", "HELD",
                        money("18.00"), "USD", null, "/seller/orders/seller-order-070-b"));
        return new SellerPayoutDashboardResponse(
                new SellerPayoutSummary(money("32.50"), money("20.00"), money("10.00"),
                        money("8.00"), money("18.00"), money("18.00"), "USD",
                        "2026-06-10", "PAYPAL_SETUP_REQUIRED"),
                new SellerPayoutEligibility("ACTION_REQUIRED", requirements, false,
                        "Complete payout method setup and resolve holds."),
                new SellerPayoutMethodStatus("PAYPAL", "SETUP_REQUIRED", false, true,
                        "/seller/payouts/method", "PayPal first; Stripe later placeholder."),
                orders,
                List.of(new SellerPayoutHold("hold-070", "DISPUTE_HOLD", money("18.00"), "USD",
                        "Held while Sharity Review is active.", null, List.of("seller-order-070-b"))),
                List.of(new SellerPayoutHistoryItem("payout-history-placeholder", "PLACEHOLDER",
                        money("0.00"), "USD", now, "Payout history will appear here.")),
                List.of("VIEW_ELIGIBILITY", "SET_UP_PAYOUT_METHOD", "VIEW_HOLDS", "REFRESH"),
                "Seller-safe payout estimates only; provider payloads and internal reserve logic are hidden.", now);
    }

    public static SellerWalletDashboardResponse mockSellerWallet() {
        LocalDateTime now = LocalDateTime.now();
        SellerBalanceProjection projection = new SellerBalanceProjection("projection-071", "seller-order-071",
                money("32.50"), "USD", "PENDING_REFUND_WINDOW", "2026-06-10",
                "REFUND_WINDOW", "Available after refund window if no dispute opens.",
                "/seller/orders/seller-order-071");
        SellerWalletTransaction transaction = new SellerWalletTransaction("wallet-tx-071",
                "seller-order-071", "ORDER_CAPTURED", money("32.50"), "USD", "PENDING",
                now.minusHours(6), "2026-06-10", "Captured order pending release.",
                "/seller/orders/seller-order-071");
        SellerWalletHold hold = new SellerWalletHold("wallet-hold-071", "seller-order-070-b",
                money("18.00"), "USD", "DISPUTE_HOLD", "ACTIVE", "Sharity Review resolved",
                null, "Held while dispute is active.", "/seller/wallet/holds");
        return new SellerWalletDashboardResponse("seller-1000", "USD",
                new SellerWalletSummary(money("32.50"), money("20.00"), money("8.00"),
                        money("18.00"), money("18.00"), money("32.50"), "2026-06-10",
                        money("0.00"), "USD", "Projection only, not a bank or escrow wallet."),
                List.of(projection), List.of(transaction), List.of(hold),
                new SellerPayoutMethodSummary(false, "PAYPAL", "PayPal", "SETUP_REQUIRED",
                        "/seller/payouts/method", "Set up PayPal to receive payouts."),
                List.of(new SellerWalletPayoutHistoryItem("wallet-payout-placeholder", money("0.00"),
                        "USD", "PLACEHOLDER", now, null, "PAYPAL", "Payout history placeholder.")),
                new SellerWalletActionEligibility(true, true, true, true, false, true,
                        List.of("PAYOUT_METHOD_REQUIRED")), "Seller-safe wallet projection loaded.", now);
    }

    public static CouponBreakdownPageResponse mockCouponBreakdown(String contextType, String contextId) {
        LocalDateTime now = LocalDateTime.now();
        CouponEligibility eligible = new CouponEligibility(true, "ELIGIBLE", null,
                "Coupon can apply to eligible digital items.", money("0.00"), money("278.99"),
                List.of("cart-item-057-a"), List.of("store-digital-hub"));
        CouponEligibility conflictEligibility = new CouponEligibility(false, "CONFLICT",
                "STACKING_NOT_ALLOWED", "This coupon conflicts with SHARITY10.", money("0.00"),
                money("278.99"), List.of(), List.of());
        CouponItem seller = new CouponItem("seller-coupon-072", "DIGI5", "Digital Studio Deal",
                "SELLER", "$5.00 off", "store-digital-hub", "Digital Studio", "DIGITAL",
                "TEMPLATES", null, "2026-12-31", eligible, true, true,
                List.of("REMOVE_COUPON", "VIEW_DETAILS"), "Seller coupon applied.");
        CouponItem platform = new CouponItem("platform-coupon-072", "SHARITY10", "Sharity Welcome",
                "PLATFORM", "$10.00 off", null, null, null, null, null, "2026-12-31",
                eligible, true, true, List.of("REMOVE_COUPON", "VIEW_DETAILS"),
                "Platform coupon applied.");
        CouponItem conflict = new CouponItem("conflict-coupon-072", "STACK20", "Stacking Test",
                "MARKETPLACE", "20% off", null, null, "DIGITAL", null, null, "2026-12-31",
                conflictEligibility, false, false, List.of("SAVE_COUPON"),
                "Coupon conflict is backend-controlled.");
        return new CouponBreakdownPageResponse(contextType, contextId, "USD",
                List.of(conflict), List.of(seller, platform), List.of(conflict),
                new CouponBreakdown(money("278.99"), money("5.00"), money("10.00"),
                        money("0.00"), money("3.50"), money("0.00"), money("0.00"),
                        money("267.49"), money("267.49"), "USD",
                        "Totals are backend-calculated; seller commission is hidden."),
                List.of(new CouponConflict("STACKING_NOT_ALLOWED",
                        List.of("platform-coupon-072", "conflict-coupon-072"),
                        "Coupon conflict", "Only one platform/marketplace coupon can apply.",
                        "REMOVE_EXISTING_COUPON")),
                List.of("APPLY_COUPON", "REMOVE_COUPON", "SAVE_COUPON", "CONTINUE_TO_CHECKOUT"),
                "Coupon eligibility and totals are backend-controlled.", now);
    }

    public static SellerCouponsResponse mockSellerCoupons() {
        LocalDateTime now = LocalDateTime.now();
        SellerCoupon active = new SellerCoupon("seller-coupon-073", "DIGI5", "Digital Studio Deal",
                "ACTIVE", "AMOUNT", money("5.00"),
                new SellerCouponScope("CATEGORY", "DIGITAL", "TEMPLATES", List.of(),
                        "Applies to templates category."), "2026-06-01T00:00:00",
                "2026-12-31T23:59:59", 12, 100, 1, money("20.00"),
                List.of(), List.of("TEMPLATES"), List.of("EDIT_COUPON", "PAUSE_COUPON", "VIEW_ANALYTICS"),
                "Seller-funded coupon.");
        SellerCoupon paused = new SellerCoupon("seller-coupon-073-paused", "PAUSE10", "Paused Deal",
                "PAUSED", "PERCENTAGE", money("10.00"),
                new SellerCouponScope("STORE", null, null, List.of(), "Applies to seller store."),
                "2026-06-01T00:00:00", "2026-12-31T23:59:59", 4, 50, 1,
                money("10.00"), List.of(), List.of(), List.of("RESUME_COUPON", "ARCHIVE_COUPON"),
                "Paused by seller.");
        return new SellerCouponsResponse(List.of(active, paused),
                new SellerCouponSummary(2, 1, 0, 0, 1, 0, 0),
                List.of("ALL", "ACTIVE", "DRAFT", "SCHEDULED", "PAUSED", "EXPIRED"),
                List.of("CREATE_COUPON", "FILTER", "REFRESH"), now);
    }

    public static RewardsDashboardResponse mockRewards() {
        LocalDateTime now = LocalDateTime.now();
        SharityCreditItem credit = new SharityCreditItem("credit-074", "Welcome Credit",
                money("10.00"), "USD", "PLATFORM_PROMO", "2026-12-31",
                "DIGITAL_MARKETPLACE", "AVAILABLE", "Applies at checkout when backend allows.",
                "/rewards/credits/credit-074");
        GiveawayRewardItem giveaway = new GiveawayRewardItem("giveaway-074", "Digital Starter Giveaway",
                "AVAILABLE", money("5.00"), "USD", "/rewards/giveaways/giveaway-074",
                "Giveaway credit is non-withdrawable.");
        RewardHistoryItem history = new RewardHistoryItem("reward-history-074", "CREDIT_ISSUED",
                money("10.00"), "USD", now.minusDays(1), "Welcome credit issued.");
        return new RewardsDashboardResponse(
                new SharityCreditSummary(money("10.00"), money("5.00"), money("10.00"),
                        money("0.00"), money("0.00"), "USD",
                        "Sharity Credit is promotional and non-withdrawable in MVP."),
                List.of(credit), List.of(giveaway), List.of(history),
                new RewardsActionEligibility(true, true, true, true, true, List.of()),
                "Credit use is backend-controlled and cannot bypass checkout rules.", now);
    }

    public static ListingFormConfig mockListingFormConfig() {
        return new ListingFormConfig(
                List.of(new ListingMarketplaceOption("DIGITAL", "Digital Marketplace", true, null),
                        new ListingMarketplaceOption("GROCERY", "Grocery later", false, "COMING_LATER")),
                List.of(new ListingCategoryOption("TEMPLATES", "Templates", "DIGITAL", true, true, null),
                        new ListingCategoryOption("GAMING", "Gaming Codes", "DIGITAL", true, true, null)),
                List.of("SECURE_REVEAL", "SECURE_DOWNLOAD"), List.of("USD"),
                List.of(new ListingPolicyRequirement("NO_CHAT_CODES", "No code sharing in chat", true,
                                false, "/seller/listings/create/policy"),
                        new ListingPolicyRequirement("REFUND_REVEAL_RULES", "Refund/reveal rules", true,
                                false, "/seller/listings/create/policy")),
                "Digital products first. Delivery payload is prepared later unless backend allows.");
    }

    public static ListingDraft mockListingDraft(String draftId) {
        return new ListingDraft(draftId, "DRAFT", "Premium Template Pack", "DIGITAL",
                "TEMPLATES", money("39.99"), "USD", List.of("media-075"),
                List.of("SAVE_DRAFT", "PREVIEW_LISTING", "PUBLISH_LISTING"), LocalDateTime.now());
    }

    public static SellerListingsResponse mockSellerListings() {
        LocalDateTime now = LocalDateTime.now();
        SellerListingCard active = sellerListing("listing-076-active", "Premium Template Pack", "ACTIVE",
                "AVAILABLE", "APPROVED", false);
        SellerListingCard draft = sellerListing("listing-076-draft", "Draft License Key", "DRAFT",
                "DIGITAL_DELIVERY_SETUP_REQUIRED", "NOT_SUBMITTED", true);
        SellerListingCard pending = sellerListing("listing-076-pending", "Pending Game Code", "PENDING_MODERATION",
                "AVAILABLE", "PENDING", true);
        return new SellerListingsResponse(List.of(active, draft, pending),
                new SellerListingsSummary(1, 1, 1, 0, 0, 0, 3, 2, now),
                new SellerListingFilters(null, null, null, "ALL", null, null, null, null),
                new SellerListingSort("NEWEST", "Newest first", "DESC"), 0, 20, 3, 1,
                List.of("CREATE_LISTING", "SEARCH", "FILTER", "REFRESH"), now);
    }

    public static SellerListingCard mockSellerListing(String listingId) {
        return mockSellerListings().listings().stream()
                .filter(listing -> listing.listingId().equals(listingId))
                .findFirst()
                .orElse(mockSellerListings().listings().get(0));
    }

    public static SellerDashboardResponse mockSellerDashboard() {
        LocalDateTime now = LocalDateTime.now();
        return new SellerDashboardResponse("seller-1000",
                new SellerStoreStatusSummary("Digital Studio", "marketplace/placeholders/gift_cards.png",
                        true, false, true, true, "ACTIVE", "Set up payout method",
                        "/seller/payouts/method", "Store is active. Payout setup still needs attention."),
                List.of(new SellerActionRequiredItem("SELLER_ACCEPTANCE_DUE", "Order acceptance due",
                                "One order needs seller acceptance before the deadline.", "CRITICAL",
                                "/seller/orders/pending-acceptance", now.plusHours(4),
                                "Respond before the deadline."),
                        new SellerActionRequiredItem("PAYOUT_METHOD_REQUIRED", "Payout method required",
                                "Set up PayPal to receive payouts.", "WARNING", "/seller/payouts/method",
                                null, "PayPal first; Stripe later.")),
                new SellerOrdersDashboardSummary(1, 4, 2, 12, 1, "/seller/orders"),
                new SellerListingsDashboardSummary(8, 2, 1, 1, 0, 2, "/seller/listings"),
                new SellerFulfillmentDashboardSummary(2, 1, 0, "/seller/orders"),
                new SellerPayoutDashboardSummary(money("32.50"), money("38.00"), money("18.00"),
                        "USD", "SETUP_REQUIRED", "/seller/payouts"),
                new SellerCouponsDashboardSummary(1, 0, 0, 0, "/seller/coupons"),
                new SellerMessagesDashboardSummary(3, 2, 1, "/seller/messages"),
                new SellerAlertsDashboardSummary(1, 2, 4, "/notifications/seller"),
                new SellerDashboardActionEligibility(true, true, true, true, true, true, true, true, List.of()),
                "Seller dashboard contains seller-safe summaries only.", now);
    }

    public static NavigationSessionResponse mockNavigationSession() {
        UserRoleSummary roles = new UserRoleSummary(true, true, true, false,
                List.of("BUYER", "SELLER"), "BUYER", "Dual-role buyer/seller mock user.");
        return new NavigationSessionResponse("user-1000", true, true, true, "BUYER", roles,
                new NavigationBadgesResponse(2, 3, 4, 6, 2, 1),
                List.of("/", "/marketplaces", "/cart", "/orders", "/digital-library", "/rewards",
                        "/messages", "/notifications", "/settings", "/profile"),
                List.of("/seller/dashboard", "/seller/listings", "/seller/orders", "/seller/coupons",
                        "/seller/payouts", "/seller/wallet", "/seller/messages", "/seller/settings"),
                "Navigation session is a safe summary; backend still guards APIs.");
    }

    public static RouteAccessResponse mockRouteAccess(String route) {
        boolean adminRoute = route != null && route.startsWith("/admin");
        boolean allowed = !adminRoute;
        return new RouteAccessResponse(route, allowed, adminRoute ? "ADMIN_GUARD" : "AUTH_ROLE_GUARD",
                allowed ? null : "/access-denied", allowed ? null : "ADMIN_REQUIRED",
                allowed ? "Route allowed by mock guard." : "Admin routes are hidden for normal users.");
    }

    public static DeepLinkResolveResponse mockDeepLink(String inputUrl) {
        String route = inputUrl != null && inputUrl.contains("seller/orders")
                ? "/access-denied"
                : "/listing/listing-076-active";
        boolean allowed = !"/access-denied".equals(route);
        return new DeepLinkResolveResponse(inputUrl, true, route, allowed,
                allowed ? null : "/seller/dashboard", allowed ? "Deep link resolved." : "Seller ownership required.");
    }

    public static ProfileCompletionResponse mockProfileCompletion() {
        LocalDateTime now = LocalDateTime.now();
        return new ProfileCompletionResponse("user-1000", 82,
                List.of(new ProfileRequirement("COUNTRY", "Country", true, true,
                                "/profile/country", "Country controls marketplace availability."),
                        new ProfileRequirement("PHONE", "Phone number", true, false,
                                "/profile/phone", "Phone verification may be required by backend."),
                        new ProfileRequirement("MARKETPLACE_PREFERENCES", "Marketplace preferences", true, true,
                                "/profile/preferences", "Preferences are country-aware."),
                        new ProfileRequirement("DOB", "Date of birth", false, false,
                                "/profile/review", "Optional unless backend/compliance requires it."),
                        new ProfileRequirement("GENDER", "Gender", false, false,
                                "/profile/review", "Optional unless backend requires it.")),
                List.of(new CountryOption("US", "United States", true, "USD", "Supported."),
                        new CountryOption("IN", "India", true, "INR", "Supported."),
                        new CountryOption("GB", "United Kingdom", false, "GBP", "Coming later.")),
                List.of(new MarketplacePreferenceItem("DIGITAL", "Digital Marketplace", true, true,
                                "Available now."),
                        new MarketplacePreferenceItem("JEWELLERY", "One gram gold / imitation jewellery", false, true,
                                "User can enable when backend opens it."),
                        new MarketplacePreferenceItem("GROCERY", "Fresh grocery later", false, false,
                                "Not available in selected country yet.")),
                List.of(new CurrencyDisplayOption("USD", "US Dollar", true, true, "Default for selected country."),
                        new CurrencyDisplayOption("INR", "Indian Rupee", false, true, "Display preference only.")),
                false, false, "Profile completion is backend-requirement driven.", now);
    }

    public static ReceiptResponse mockReceipt(String orderId, String sellerOrderId, String receiptId) {
        LocalDateTime now = LocalDateTime.now();
        ReceiptItemRow item = new ReceiptItemRow("order-item-085", "Premium Template Pack",
                "DIGITAL", "TEMPLATES", 1, money("39.99"), money("5.00"),
                money("34.99"), "USD");
        ReceiptPaymentSummary payment = new ReceiptPaymentSummary(money("39.99"), money("5.00"),
                money("0.00"), money("0.00"), money("1.25"), money("0.00"),
                money("0.00"), money("36.24"), money("36.24"), money("36.24"),
                money("0.00"), "USD", "Buyer-facing receipt only. Seller commission/payout is hidden.");
        return new ReceiptResponse(
                new ReceiptSummary(receiptId == null ? "receipt-085" : receiptId,
                        "RCT-085", orderId, "SH-085", sellerOrderId,
                        sellerOrderId == null ? null : "SH-085-A", "AVAILABLE", now.minusDays(1),
                        money("36.24"), "USD", "PayPal", "CAPTURED", "CAPTURED", "NONE"),
                List.of(item), payment,
                new ReceiptActionEligibility(true, true, true, true, false, List.of("NO_REFUND_ACTIVE")),
                "Basic receipt placeholder. Full tax invoice logic is deferred.", now);
    }

    public static CartActionResponse cartAction(String status, String message) {
        return new CartActionResponse(true, status, message, mockCart(), LocalDateTime.now());
    }

    public static CheckoutActionResponse checkoutAction(String checkoutId, String status, String message) {
        return new CheckoutActionResponse(true, status, message, mockCheckout(checkoutId), LocalDateTime.now());
    }

    public static PaymentActionResponse paymentAction(String status, String message, String nextRoute) {
        return new PaymentActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static OrderResultActionResponse orderAction(String status, String message, String nextRoute) {
        return new OrderResultActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static BuyerOrdersActionResponse buyerOrdersAction(String status, String message, String nextRoute) {
        return new BuyerOrdersActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static BuyerOrderDetailActionResponse buyerOrderDetailAction(String status, String message,
                                                                        String nextRoute) {
        return new BuyerOrderDetailActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static SellerOrderActionResponse sellerOrderAction(String status, String message, String nextRoute) {
        return new SellerOrderActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static SellerFulfillmentActionResponse sellerFulfillmentAction(String status, String message,
                                                                          String nextRoute) {
        return new SellerFulfillmentActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static BuyerDigitalDeliveryActionResponse buyerDigitalDeliveryAction(String status, String message,
                                                                                String nextRoute) {
        return new BuyerDigitalDeliveryActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static DigitalLibraryActionResponse digitalLibraryAction(String status, String message, String nextRoute) {
        return new DigitalLibraryActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static RefundRequestResponse refundRequestAction(String status, String message, String nextRoute) {
        return new RefundRequestResponse(true, "refund-067", status, nextRoute, message, LocalDateTime.now());
    }

    public static RefundActionResponse refundAction(String status, String message, String nextRoute) {
        return new RefundActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static DisputeActionResponse disputeAction(String status, String message, String nextRoute) {
        return new DisputeActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static SellerPayoutActionResponse sellerPayoutAction(String status, String message, String nextRoute) {
        return new SellerPayoutActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static SellerWalletActionResponse sellerWalletAction(String status, String message, String nextRoute) {
        return new SellerWalletActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static CouponActionResponse couponAction(String status, String message, String nextRoute) {
        return new CouponActionResponse(true, status, message,
                mockCouponBreakdown("CART", "cart-057").breakdown(), nextRoute, LocalDateTime.now());
    }

    public static SellerCouponActionResponse sellerCouponAction(String status, String message, String nextRoute) {
        return new SellerCouponActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static ListingCreateActionResponse listingAction(String status, String message, String nextRoute) {
        return new ListingCreateActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static SellerListingActionResponse sellerListingAction(String status, String message, String nextRoute) {
        return new SellerListingActionResponse(true, status, message, mockSellerListing("listing-076-active"),
                nextRoute, LocalDateTime.now());
    }

    public static SellerDashboardActionResponse sellerDashboardAction(String status, String message,
                                                                      String nextRoute) {
        return new SellerDashboardActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static ProfileCompletionActionResponse profileAction(String status, String message, String nextRoute) {
        return new ProfileCompletionActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    public static ReceiptActionResponse receiptAction(String status, String message, String nextRoute) {
        return new ReceiptActionResponse(true, status, message, nextRoute, LocalDateTime.now());
    }

    private static CartItem cartItem(String id, String title, boolean digital, boolean sellerAcceptance,
                                     String marketplace, String availabilityStatus, String price, String addedPrice) {
        boolean available = !"DIGITAL_DELIVERY_UNAVAILABLE".equals(availabilityStatus);
        return new CartItem(id, id.replace("cart-item", "listing"), id.replace("cart-item", "product"),
                title, digital ? "marketplace/placeholders/gift_cards.png" : "marketplace/placeholders/electronics.png",
                marketplace, digital ? "Digital Goods" : "Electronics", digital ? "TEMPLATES" : "HEADPHONES",
                digital ? "Templates" : "Audio", digital ? "DIGITAL_PRODUCT" : "PHYSICAL_PRODUCT",
                digital, 1, !digital, new CartQuantityRule(1, digital ? 1 : 5, digital, 1,
                !digital, digital ? "Quantity is fixed for this digital product." : "Quantity can be updated."),
                money(price), money(addedPrice), "USD", !price.equals(addedPrice),
                new CartItemAvailability(available, availabilityStatus, false, false, false, false,
                        false, !available, false, !available,
                        available ? "Item is eligible." : "Digital delivery is temporarily unavailable."),
                new CartCouponEligibility(available, List.of(), List.of("coupon-platform-10"), List.of(),
                        available ? "Coupons available." : "Coupons cannot override checkout restrictions."),
                digital ? (available ? "SECURE_DELIVERY_READY" : "DELIVERY_UNAVAILABLE") : "NOT_DIGITAL",
                sellerAcceptance, true, List.of("VIEW_LISTING", "MOVE_TO_SAVED", "REMOVE_ITEM"));
    }

    private static CheckoutItem checkoutItem(String id, String title, boolean digital, String status, String price) {
        return new CheckoutItem(id, id.replace("checkout-item", "cart-item"), id.replace("checkout-item", "listing"),
                id.replace("checkout-item", "product"), title,
                digital ? "marketplace/placeholders/gift_cards.png" : "marketplace/placeholders/electronics.png",
                digital ? "DIGITAL" : "ELECTRONICS", digital ? "TEMPLATES" : "HEADPHONES",
                digital ? "DIGITAL_PRODUCT" : "PHYSICAL_PRODUCT", digital, 1, money(price), money(price),
                "USD", status, digital ? "SECURE_DELIVERY_READY" : "NOT_DIGITAL",
                List.of("VIEW_LISTING"));
    }

    private static List<PaymentStatusTimelineItem> paymentTimeline(LocalDateTime now) {
        return List.of(
                new PaymentStatusTimelineItem("CHECKOUT_REVIEWED", "Checkout reviewed",
                        "Checkout final total reviewed.", now.minusMinutes(20), false, true, false, "Complete."),
                new PaymentStatusTimelineItem("PAYMENT_AUTHORIZED", "Payment authorized",
                        "PayPal authorization verified by backend.", now.minusMinutes(10), true, true, false,
                        "Authorized."),
                new PaymentStatusTimelineItem("SELLER_ACCEPTANCE_PENDING", "Seller acceptance pending",
                        "Capture waits for seller acceptance where required.", now, true, false, false,
                        "Pending seller action."));
    }

    private static List<OrderStatusTimelineItem> orderTimeline(LocalDateTime now) {
        return List.of(
                new OrderStatusTimelineItem("CHECKOUT_REVIEWED", "Checkout reviewed",
                        "Checkout reviewed by buyer.", now.minusMinutes(25), false, true, false, "Complete."),
                new OrderStatusTimelineItem("PAYMENT_AUTHORIZED", "Payment authorized",
                        "Payment authorization confirmed.", now.minusMinutes(12), false, true, false, "Authorized."),
                new OrderStatusTimelineItem("SELLER_ACCEPTANCE_PENDING", "Seller acceptance pending",
                        "Waiting for one seller.", now, true, false, false, "Pending."));
    }

    private static List<BuyerOrderTimelineItem> buyerDetailTimeline(LocalDateTime now) {
        return List.of(
                new BuyerOrderTimelineItem("PAYMENT_AUTHORIZED", "Payment authorized",
                        "PayPal authorization was confirmed by backend.", now.minusMinutes(16),
                        false, true, false, "Authorized."),
                new BuyerOrderTimelineItem("ORDER_CREATED", "Order created",
                        "Parent order and seller groups were created.", now.minusMinutes(14),
                        false, true, false, "Order created."),
                new BuyerOrderTimelineItem("SELLER_ACCEPTANCE_PENDING", "Seller acceptance pending",
                        "One seller must accept before capture.", now.minusMinutes(4),
                        true, false, false, "Pending seller action."));
    }

    private static BuyerOrderCard buyerOrderCard(String orderId, String reference, String orderStatus,
                                                 String paymentStatus, String message, LocalDateTime date,
                                                 boolean pendingSeller, boolean digitalReady) {
        BuyerSellerOrderGroupSummary group = new BuyerSellerOrderGroupSummary("seller-" + orderId,
                "store-digital-hub", pendingSeller ? "Tech Deals Phoenix" : "Digital Studio",
                pendingSeller ? "marketplace/placeholders/electronics.png" : "marketplace/placeholders/gift_cards.png",
                true, pendingSeller ? "PENDING" : "ACCEPTED",
                digitalReady ? "CAPTURED" : "CAPTURE_PENDING", "NONE",
                digitalReady ? "DIGITAL_DELIVERY_READY" : "WAITING_FOR_PAYMENT_CAPTURE",
                "NONE", digitalReady ? money("39.99") : money("267.49"), "USD", 1,
                List.of("VIEW_SELLER_GROUP", "CONTACT_SELLER"), "Buyer-safe seller group summary.",
                "/orders/" + orderId + "/seller-groups/seller-" + orderId);
        BuyerOrderItemPreview item = new BuyerOrderItemPreview("item-" + orderId, "listing-" + orderId,
                "product-" + orderId, digitalReady ? "Premium Template Pack" : "Open Box Headphones",
                digitalReady ? "marketplace/placeholders/gift_cards.png" : "marketplace/placeholders/electronics.png",
                digitalReady ? "DIGITAL" : "ELECTRONICS", digitalReady ? "TEMPLATES" : "HEADPHONES",
                digitalReady ? "DIGITAL_PRODUCT" : "PHYSICAL_PRODUCT", digitalReady, 1,
                digitalReady ? money("39.99") : money("267.49"), "USD", orderStatus,
                digitalReady ? "READY" : "PENDING", "/listings/listing-" + orderId);
        return new BuyerOrderCard(orderId, reference, date, orderStatus, paymentStatus,
                digitalReady ? money("39.99") : money("267.49"), digitalReady ? money("39.99") : money("267.49"),
                digitalReady ? money("39.99") : money("23.74"), "USD", 1, 1,
                digitalReady ? "Digital Marketplace" : "Digital + Electronics", digitalReady ? 1 : 0,
                message, List.of(group), List.of(item), digitalReady ? "AVAILABLE" : "PENDING",
                List.of("VIEW_ORDER_DETAILS", "VIEW_RECEIPT", "CONTACT_SELLER", "CONTINUE_SHOPPING"),
                "/orders/" + orderId);
    }

    private static BuyerOrderItemDetail buyerOrderItemDetail(String id, String title, boolean digital,
                                                             String status, BigDecimal total) {
        return new BuyerOrderItemDetail(id, id.replace("order-item-detail", "listing"),
                id.replace("order-item-detail", "product"), title,
                digital ? "marketplace/placeholders/gift_cards.png" : "marketplace/placeholders/electronics.png",
                digital ? "DIGITAL" : "ELECTRONICS", digital ? "TEMPLATES" : "HEADPHONES",
                digital ? "DIGITAL_PRODUCT" : "PHYSICAL_PRODUCT", digital, 1, total, "USD",
                status, digital ? "WAITING_FOR_ORDER_RULES" : "NOT_APPLICABLE", true,
                "/listings/" + id.replace("order-item-detail", "listing"),
                digital ? "Secure digital delivery only." : "Physical fulfillment placeholder.");
    }

    private static SellerListingCard sellerListing(String listingId, String title, String status,
                                                   String availability, String moderation,
                                                   boolean needsAttention) {
        return new SellerListingCard(listingId, listingId.replace("listing", "product"), title,
                "marketplace/placeholders/gift_cards.png", "DIGITAL", "Digital Marketplace",
                "TEMPLATES", "Templates", "PREMIUM", "Premium Templates", "DIGITAL_PRODUCT",
                true, money("39.99"), "USD", status, availability, moderation,
                "ACTIVE".equals(status), "ACTIVE".equals(status) ? 1 : 0, needsAttention,
                needsAttention ? "This listing needs seller attention." : "Listing is seller-safe and manageable.",
                List.of("EDIT_LISTING", "PREVIEW_LISTING", "MANAGE_COUPONS", "VIEW_ANALYTICS"),
                "/seller/listings/" + listingId);
    }

    private static SellerDigitalDeliveryPreparation sellerDigitalPreparation(String status) {
        return new SellerDigitalDeliveryPreparation(true, status, true,
                !"NOT_PREPARED".equals(status), "VALIDATION_PENDING", false, true, false, false,
                List.of("SUBMIT_PAYLOAD", "VALIDATE_PAYLOAD", "MARK_READY", "REPORT_ISSUE"),
                "Use Sharity secure delivery only. Do not send codes in chat.");
    }

    private static BuyerDigitalDeliveryPolicyWarning digitalPolicyWarning() {
        return new BuyerDigitalDeliveryPolicyWarning(true, true, true, true,
                "/orders/order-065/digital-delivery/policy-warning",
                "Digital delivery happens only through Sharity. Reveal may affect refund eligibility.");
    }

    private static List<BuyerDigitalDeliveryHistoryItem> digitalHistory(LocalDateTime now) {
        return List.of(
                new BuyerDigitalDeliveryHistoryItem("SELLER_PREPARED", "Seller prepared delivery",
                        "Seller submitted secure delivery through Sharity.", now.minusHours(2),
                        false, true, "Prepared."),
                new BuyerDigitalDeliveryHistoryItem("PAYLOAD_VALIDATED", "Delivery validated",
                        "Delivery payload passed backend validation.", now.minusHours(1),
                        false, true, "Validated."),
                new BuyerDigitalDeliveryHistoryItem("READY_FOR_REVEAL", "Ready for reveal",
                        "Buyer can reveal after acknowledgement.", now.minusMinutes(10),
                        true, false, "Ready."));
    }

    private static SellerOrderGroupStatus orderGroup(String id, String storeId, String storeName,
                                                     String acceptanceStatus, String captureStatus,
                                                     String releaseStatus, BigDecimal total,
                                                     boolean digital, LocalDateTime now) {
        OrderStatusItem item = new OrderStatusItem(id + "-item", id.replace("seller-order", "listing"),
                id.replace("seller-order", "product"), digital ? "Premium Template Pack" : "Open Box Headphones",
                digital ? "marketplace/placeholders/gift_cards.png" : "marketplace/placeholders/electronics.png",
                digital ? "DIGITAL" : "ELECTRONICS", digital ? "TEMPLATES" : "HEADPHONES",
                digital ? "DIGITAL_PRODUCT" : "PHYSICAL_PRODUCT", digital, 1, total, "USD",
                acceptanceStatus, digital ? "PENDING_AFTER_CAPTURE" : "NOT_DIGITAL",
                "/listings/" + id.replace("seller-order", "listing"));
        return new SellerOrderGroupStatus(id, storeId, storeName,
                digital ? "marketplace/placeholders/gift_cards.png" : "marketplace/placeholders/electronics.png",
                true, acceptanceStatus, now.plusHours(24), captureStatus, releaseStatus,
                total, "USD", List.of(item), List.of("VIEW_ORDER_DETAILS", "CONTACT_SELLER"),
                "Buyer-safe seller order status.");
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}
