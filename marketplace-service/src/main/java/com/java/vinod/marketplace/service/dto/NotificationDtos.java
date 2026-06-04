package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Mock notification center API contracts for STORY-032.
 *
 * <p>These records intentionally mirror the future notification-service shape
 * while keeping the marketplace-service implementation stateless and safe for
 * frontend integration.</p>
 */
public final class NotificationDtos {
    private NotificationDtos() {
    }

    public record NotificationFeedResponse(List<NotificationItem> notifications,
                                           List<NotificationGroup> groups,
                                           Pagination pagination,
                                           NotificationSummaryCounts summaryCounts,
                                           List<String> availableFilters) {
    }

    public record NotificationItem(String notificationId, String title, String message, String role,
                                   String category, String priority, boolean read, boolean archived,
                                   boolean critical, boolean nonDismissible, boolean actionRequired,
                                   String relatedEntityType, String relatedEntityId, String relatedReference,
                                   String productImageUrl, String iconType, LocalDateTime createdAt,
                                   LocalDateTime readAt, NotificationAvailableActions availableActions,
                                   NotificationDeepLink deepLink) {
    }

    public record NotificationGroup(String groupKey, String groupLabel, List<String> notificationIds) {
    }

    public record NotificationSummaryCounts(long unreadCount, long actionRequiredCount, long criticalCount,
                                            long buyerCount, long sellerCount, long orderCount,
                                            long refundCount, long disputeCount, long messageCount,
                                            long payoutCount, long listingCount, long securityCount) {
    }

    public record NotificationAvailableActions(boolean canMarkRead, boolean canMarkUnread, boolean canArchive,
                                               boolean canViewOrder, boolean canViewRefund,
                                               boolean canViewDispute, boolean canOpenMessage,
                                               boolean canViewPayout, boolean canViewListing,
                                               boolean canManagePreferences, boolean canBack) {
    }

    public record NotificationDeepLink(String route, Map<String, String> routeParams, String targetType,
                                       boolean requiresAuth, String requiredRole, String fallbackRoute) {
    }

    public record NotificationActionResponse(String notificationId, String status, String message,
                                             boolean updatedRead, boolean updatedArchived, boolean resolved,
                                             NotificationDeepLink deepLink) {
    }

    public record Pagination(int page, int size, boolean hasNextPage) {
    }

    public record PreferenceRouteResponse(String route, String contextRole) {
    }

    public record ResolveActionRequest(@NotBlank String actionType) {
    }

    public static NotificationFeedResponse mockFeed(int page, int size, String role, String category,
                                                    String priority, boolean unreadOnly,
                                                    boolean actionRequiredOnly, boolean archived) {
        List<NotificationItem> filtered = mockNotifications().stream()
                .filter(item -> archived == item.archived())
                .filter(item -> role == null || role.isBlank() || item.role().equalsIgnoreCase(role))
                .filter(item -> category == null || category.isBlank() || item.category().equalsIgnoreCase(category))
                .filter(item -> priority == null || priority.isBlank() || item.priority().equalsIgnoreCase(priority))
                .filter(item -> !unreadOnly || !item.read())
                .filter(item -> !actionRequiredOnly || item.actionRequired())
                .toList();
        return new NotificationFeedResponse(filtered, mockGroups(filtered), new Pagination(page, size, false),
                mockSummaryCounts(), availableFilters());
    }

    public static NotificationSummaryCounts mockSummaryCounts() {
        List<NotificationItem> items = mockNotifications();
        return new NotificationSummaryCounts(
                items.stream().filter(item -> !item.read()).count(),
                items.stream().filter(NotificationItem::actionRequired).count(),
                items.stream().filter(NotificationItem::critical).count(),
                items.stream().filter(item -> "BUYER".equals(item.role())).count(),
                items.stream().filter(item -> "SELLER".equals(item.role())).count(),
                items.stream().filter(item -> "ORDERS".equals(item.category())).count(),
                items.stream().filter(item -> "REFUNDS".equals(item.category())).count(),
                items.stream().filter(item -> "DISPUTES".equals(item.category())).count(),
                items.stream().filter(item -> "MESSAGES".equals(item.category())).count(),
                items.stream().filter(item -> "PAYOUTS".equals(item.category())).count(),
                items.stream().filter(item -> "LISTINGS".equals(item.category())).count(),
                items.stream().filter(item -> "SECURITY".equals(item.category())).count());
    }

    public static List<String> availableFilters() {
        return List.of("All", "Buyer", "Seller", "Orders", "Refunds", "Disputes", "Messages",
                "Payouts", "Listings", "Security", "Unread", "Action Required");
    }

    public static List<NotificationGroup> mockGroups(List<NotificationItem> items) {
        return List.of(
                group("today", "Today", items, "notif-dispute-response", "notif-security-login", "notif-order-complete"),
                group("yesterday", "Yesterday", items, "notif-low-code", "notif-message"),
                group("this-week", "This Week", items, "notif-payout-hold", "notif-listing-approved"),
                group("earlier", "Earlier", items, "notif-policy-required", "notif-maintenance"));
    }

    private static NotificationGroup group(String key, String label, List<NotificationItem> items, String... ids) {
        List<String> availableIds = List.of(ids).stream()
                .filter(id -> items.stream().anyMatch(item -> item.notificationId().equals(id)))
                .toList();
        return new NotificationGroup(key, label, availableIds);
    }

    public static NotificationItem mockNotification(String notificationId) {
        return mockNotifications().stream()
                .filter(item -> item.notificationId().equals(notificationId))
                .findFirst()
                .orElseGet(NotificationDtos::deepLinkUnavailableNotification);
    }

    public static NotificationActionResponse actionResponse(String notificationId, String status, String message,
                                                           boolean read, boolean archived) {
        NotificationItem item = mockNotification(notificationId);
        return new NotificationActionResponse(notificationId, status, message, read, archived,
                "OK".equals(status), item.deepLink());
    }

    public static PreferenceRouteResponse preferenceRoute(String role) {
        if ("SELLER".equalsIgnoreCase(role)) {
            return new PreferenceRouteResponse("/seller/settings#notifications", "SELLER");
        }
        return new PreferenceRouteResponse("/settings/notifications", role == null ? "MIXED" : role.toUpperCase());
    }

    public static List<NotificationItem> mockNotifications() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                item("notif-dispute-response", "Dispute response required", "Respond before Jun 5 to avoid delayed review.",
                        "SELLER", "DISPUTES", "ACTION_REQUIRED", false, false, true, true, true,
                        "DISPUTE", "DSP-8821", "Dispute DSP-8821", null, "shield-alert",
                        now.minusHours(1), "/seller/disputes/DSP-8821", "DISPUTE", "SELLER"),
                item("notif-security-login", "New login detected", "A new login was detected from a recognized browser.",
                        "SYSTEM", "SECURITY", "CRITICAL", false, false, true, true, true,
                        "SECURITY_EVENT", "SEC-1002", "Security alert", null, "lock",
                        now.minusHours(2), "/profile/security", "SECURITY", "BUYER"),
                item("notif-order-complete", "Order completed", "Your digital order is complete and ready in your library.",
                        "BUYER", "ORDERS", "SUCCESS", false, false, false, false, false,
                        "ORDER", "ORD-4109", "Order ORD-4109", "marketplace/placeholders/gift_cards.png", "package-check",
                        now.minusHours(5), "/orders/ORD-4109", "ORDER", "BUYER"),
                item("notif-low-code", "Low code inventory", "Add codes soon to keep this digital listing available.",
                        "SELLER", "LISTINGS", "WARNING", false, false, false, false, true,
                        "LISTING", "LST-2055", "Listing LST-2055", "marketplace/placeholders/gaming.png", "boxes",
                        now.minusDays(1), "/seller/listings/LST-2055/codes", "LISTING", "SELLER"),
                item("notif-message", "New safe message", "A buyer sent a message about order ORD-4109.",
                        "SELLER", "MESSAGES", "INFO", true, false, false, false, false,
                        "ORDER", "ORD-4109", "Order message", null, "message-circle",
                        now.minusDays(1).minusHours(3), "/seller/messages/order/ORD-4109", "MESSAGE", "SELLER"),
                item("notif-payout-hold", "Payout on hold", "A payout is held until account verification is completed.",
                        "SELLER", "PAYOUTS", "WARNING", false, false, false, false, true,
                        "PAYOUT", "PAY-7712", "Payout PAY-7712", null, "wallet",
                        now.minusDays(3), "/seller/payouts", "PAYOUT", "SELLER"),
                item("notif-listing-approved", "Listing approved", "Your listing passed review and is visible to buyers.",
                        "SELLER", "LISTINGS", "SUCCESS", true, false, false, false, false,
                        "LISTING", "LST-2001", "Listing LST-2001", "marketplace/placeholders/electronics.png", "badge-check",
                        now.minusDays(4), "/seller/products", "LISTING", "SELLER"),
                item("notif-policy-required", "Policy acceptance required", "Accept the updated seller policy to continue selling.",
                        "SYSTEM", "SECURITY", "CRITICAL", false, false, true, true, true,
                        "POLICY", "POL-2026-06", "Seller policy", null, "file-warning",
                        now.minusDays(9), "/settings/policies", "POLICY", "SELLER"),
                item("notif-maintenance", "System maintenance scheduled", "Some marketplace tools may be unavailable during maintenance.",
                        "SYSTEM", "SYSTEM", "INFO", true, false, false, false, false,
                        "SYSTEM_STATUS", "SYS-2201", "Maintenance", null, "info",
                        now.minusDays(14), "/system/status", "SYSTEM", "BUYER"));
    }

    private static NotificationItem item(String id, String title, String message, String role, String category,
                                         String priority, boolean read, boolean archived, boolean critical,
                                         boolean nonDismissible, boolean actionRequired, String entityType,
                                         String entityId, String reference, String productImageUrl, String iconType,
                                         LocalDateTime createdAt, String route, String targetType, String requiredRole) {
        NotificationAvailableActions actions = new NotificationAvailableActions(!read, read,
                !nonDismissible, "ORDER".equals(entityType), "REFUND".equals(entityType),
                "DISPUTE".equals(entityType), "MESSAGE".equals(targetType), "PAYOUT".equals(entityType),
                "LISTING".equals(entityType), true, true);
        NotificationDeepLink deepLink = new NotificationDeepLink(route, Map.of("id", entityId), targetType,
                true, requiredRole, "/notifications");
        return new NotificationItem(id, title, message, role, category, priority, read, archived, critical,
                nonDismissible, actionRequired, entityType, entityId, reference, productImageUrl, iconType,
                createdAt, read ? createdAt.plusMinutes(20) : null, actions, deepLink);
    }

    private static NotificationItem deepLinkUnavailableNotification() {
        LocalDateTime now = LocalDateTime.now();
        return item("notif-deeplink-unavailable", "Related screen unavailable",
                "This notification's related screen is no longer available.", "SYSTEM", "SYSTEM", "WARNING",
                false, false, false, false, false, "UNKNOWN", "UNKNOWN", "Unavailable", null, "unlink",
                now, "/notifications", "UNKNOWN", "BUYER");
    }
}
