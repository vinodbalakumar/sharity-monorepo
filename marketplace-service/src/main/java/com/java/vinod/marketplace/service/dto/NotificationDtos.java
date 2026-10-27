package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class NotificationDtos {
    private NotificationDtos() {}
    public record NotificationCenterDashboardResponse(NotificationUnreadCounts unreadCounts,
                                                      List<NotificationItem> criticalNotifications,
                                                      List<NotificationItem> actionRequiredNotifications,
                                                      List<NotificationFilterOption> availableFilters,
                                                      List<NotificationItem> recentNotifications,
                                                      NotificationPreferenceSummary preferencesShortcut,
                                                      List<String> availableActions) {}
    public record NotificationUnreadCounts(long totalUnread, long buyerUnread, long sellerUnread, long criticalUnread, long actionRequiredUnread) {}
    public record NotificationItem(String notificationId, String title, String shortMessage, String fullMessage,
                                   String category, String roleContext, String severity, String status,
                                   boolean archived, boolean pinned, boolean critical, boolean actionRequired,
                                   LocalDateTime createdAt, LocalDateTime readAt,
                                   NotificationRelatedEntity relatedEntity, NotificationAction primaryAction,
                                   List<NotificationAction> secondaryActions,
                                   List<NotificationDeliveryChannelStatus> deliveryChannels,
                                   String userSafeMetadata, String imageUrl) {}
    public record NotificationRelatedEntity(String relatedEntityType, String relatedEntityId, String relatedEntityReference, String status, String summary, String route, boolean accessAllowed) {}
    public record NotificationAction(String actionCode, String label, String route, boolean enabled, boolean expired, String userSafeDisabledReason, boolean requiresReauth, boolean primary) {}
    public record NotificationDeliveryChannelStatus(String channel, boolean enabled, boolean sent, boolean delivered, boolean failed, String userSafeMessage) {}
    public record NotificationFilterOption(String filterCode, String label, long count, boolean active, boolean available) {}
    public record NotificationTimeGroup(String groupCode, String label, long count, long unreadCount, List<NotificationItem> notifications) {}
    public record NotificationActionResponse(String notificationId, String actionCode, boolean allowed, String route, String message, boolean requiresReauth, LocalDateTime updatedAt) {}
    public record NotificationPreferenceSummary(String route, boolean criticalAlertsMandatory, boolean promotionalNotificationsEnabled, boolean pushEnabled, boolean emailEnabled, boolean inAppEnabled, String userSafeMessage) {}
    public record NotificationSummary(long totalUnread, long buyerUnread, long sellerUnread,
                                      long criticalUnread, long actionRequiredUnread,
                                      String userSafeMessage) {}
    public record NotificationSettings(boolean inAppEnabled, boolean pushEnabled, boolean emailEnabled,
                                       boolean sellerDeadlineAlertsMandatory,
                                       boolean securityAlertsMandatory, String userSafeMessage) {}
    public record AdminBroadcastSummary(String broadcastId, String title, String status, String audienceType, List<String> deliveryChannels, String createdBy, LocalDateTime createdAt, boolean placeholder) {}
    public record AdminBroadcastTemplate(String templateId, String templateName, String category, String channel, boolean placeholder) {}

    public static NotificationCenterDashboardResponse dashboard() {
        List<NotificationItem> items = notifications();
        return new NotificationCenterDashboardResponse(counts(items),
                items.stream().filter(item -> item.critical() && item.pinned() && !item.archived()).toList(),
                items.stream().filter(item -> item.actionRequired() && !item.archived()).toList(),
                filters().stream().map(filter -> new NotificationFilterOption(filter, filter, items.size(), false, true)).toList(),
                items.stream().limit(6).toList(),
                new NotificationPreferenceSummary("appSettings", true, false, true, true, true, "Critical security, payment, payout, and safety alerts cannot be fully disabled."),
                List.of("VIEW_NOTIFICATION", "OPEN_RELATED_ENTITY", "MARK_READ", "MARK_UNREAD", "MARK_ALL_READ", "ARCHIVE_NOTIFICATION", "SEARCH_NOTIFICATIONS", "MANAGE_NOTIFICATION_PREFERENCES"));
    }
    public static List<NotificationItem> notifications() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                item("notif-order", "Order update available", "Order SH-1000 is moving through checkout.", "ORDER_UPDATE", "BUYER", "SUCCESS", "UNREAD", false, false, now.minusHours(1), "ORDER", "SH-1000", "View order", "orders", "marketplace/placeholders/gift_cards.png"),
                item("notif-seller-order", "Seller acceptance needed", "Accept seller order SH-1000-A within 24 hours.", "SELLER_ACCEPTANCE_UPDATE", "SELLER", "WARNING", "UNREAD", true, false, now.minusHours(2), "SELLER_ORDER", "SH-1000-A", "Review seller order", "orders", null),
                item("notif-payment-failed", "Payment authorization failed", "Your PayPal authorization could not be completed.", "PAYMENT_AUTHORIZATION_UPDATE", "BUYER", "CRITICAL", "UNREAD", true, false, now.minusHours(3), "PAYMENT_AUTHORIZATION", "PAY-AUTH-4431", "Retry payment", "paymentAuthorization", null),
                item("notif-refund", "Refund response needed", "A seller responded to your refund request.", "REFUND_UPDATE", "BUYER", "WARNING", "UNREAD", true, false, now.minusHours(21), "REFUND_REQUEST", "REF-7781", "View refund", "refundStatus", null),
                item("notif-payout", "Payout blocked", "Complete verification before payout can proceed.", "SELLER_PAYOUT_UPDATE", "SELLER", "CRITICAL", "UNREAD", true, false, now.minusDays(2), "PAYOUT", "PAY-7712", "View eligibility", "sellerVerification", null),
                item("notif-support", "Support ticket reply", "Support replied to ticket SUP-1001.", "SUPPORT_TICKET_UPDATE", "BOTH", "INFO", "READ", false, false, now.minusDays(3), "SUPPORT_TICKET", "SUP-1001", "Open support ticket", "support", null),
                item("notif-security", "Security alert", "A new login was detected from an approximate Phoenix region.", "SECURITY_ALERT", "BOTH", "CRITICAL", "UNREAD", true, false, now.minusDays(3), "SECURITY_EVENT", "SEC-1002", "Review security alert", "loginSecurity", null),
                item("notif-policy", "Policy re-acceptance required", "Accept updated seller terms to continue selling.", "POLICY_TERMS_REACCEPTANCE_ALERT", "SELLER", "CRITICAL", "UNREAD", true, false, now.minusDays(7), "POLICY", "POL-2026-06", "Accept policy", "policies", null),
                item("notif-admin", "Admin announcement placeholder", "Future broadcasts and templates will appear here.", "ADMIN_ANNOUNCEMENT", "ADMIN", "INFO", "READ", false, false, now.minusDays(12), "ANNOUNCEMENT", "ANN-001", "Preview announcement", "notifications", null));
    }
    public static List<NotificationTimeGroup> groups() {
        List<NotificationItem> items = notifications();
        return List.of(group("today", "Today", items.stream().filter(item -> item.createdAt().isAfter(LocalDateTime.now().minusDays(1))).toList()),
                group("yesterday", "Yesterday", items.stream().filter(item -> item.createdAt().isBefore(LocalDateTime.now().minusDays(1)) && item.createdAt().isAfter(LocalDateTime.now().minusDays(2))).toList()),
                group("this-week", "This week", items.stream().filter(item -> item.createdAt().isBefore(LocalDateTime.now().minusDays(2)) && item.createdAt().isAfter(LocalDateTime.now().minusDays(7))).toList()),
                group("older", "Older", items.stream().filter(item -> item.createdAt().isBefore(LocalDateTime.now().minusDays(7))).toList()));
    }
    public static NotificationItem notification(String notificationId) { return notifications().stream().filter(item -> item.notificationId().equals(notificationId)).findFirst().orElse(notifications().get(0)); }
    public static NotificationActionResponse action(String notificationId, String actionCode, boolean allowed, String route, String message) { return new NotificationActionResponse(notificationId, actionCode, allowed, route, message, false, LocalDateTime.now()); }
    public static NotificationUnreadCounts counts() { return counts(notifications()); }
    public static NotificationSummary summary() {
        NotificationUnreadCounts counts = counts();
        return new NotificationSummary(counts.totalUnread(), counts.buyerUnread(), counts.sellerUnread(),
                counts.criticalUnread(), counts.actionRequiredUnread(),
                "Notification counts are user-scoped and related routes require permission checks.");
    }
    public static NotificationPreferenceSummary preferencesSummary() { return dashboard().preferencesShortcut(); }
    public static NotificationSettings settings() {
        return new NotificationSettings(true, true, true, true, true,
                "Critical seller deadline and security alerts are mandatory.");
    }
    public static List<AdminBroadcastSummary> broadcasts() { return List.of(new AdminBroadcastSummary("broadcast-001", "Marketplace maintenance placeholder", "DRAFT_PLACEHOLDER", "All users later", List.of("IN_APP", "PUSH", "EMAIL"), "Admin placeholder", LocalDateTime.now().minusHours(3), true)); }
    public static List<AdminBroadcastTemplate> templates() { return List.of(new AdminBroadcastTemplate("template-marketplace", "Marketplace announcement", "MARKETPLACE", "IN_APP", true), new AdminBroadcastTemplate("template-policy", "Policy update", "POLICY", "EMAIL", true)); }
    private static NotificationItem item(String id, String title, String message, String category, String role, String severity, String status, boolean actionRequired, boolean archived, LocalDateTime createdAt, String entityType, String entityId, String actionLabel, String route, String imageUrl) {
        boolean critical = "CRITICAL".equals(severity);
        return new NotificationItem(id, title, message, message + " Sensitive provider payloads, digital codes, raw URLs, security raw payloads, internal risk, and admin notes are hidden.", category, role, severity, status, archived, critical || actionRequired, critical, actionRequired, createdAt, "READ".equals(status) ? createdAt.plusMinutes(20) : null,
                new NotificationRelatedEntity(entityType, entityId, entityId, actionRequired ? "ACTION_REQUIRED" : "AVAILABLE", entityType + " " + entityId, route, true),
                new NotificationAction("OPEN_RELATED_ENTITY", actionLabel, route, true, false, null, critical && category.contains("SECURITY"), true),
                List.of(new NotificationAction("MARK_READ", "Mark read", "notifications", true, false, null, false, false), new NotificationAction("ARCHIVE", "Archive", "notifications", !(critical && actionRequired), false, critical && actionRequired ? "Resolve critical action first." : null, false, false)),
                List.of(new NotificationDeliveryChannelStatus("IN_APP", true, true, true, false, "Delivered in-app."), new NotificationDeliveryChannelStatus("PUSH", true, critical || actionRequired, critical || actionRequired, false, "Push sent when required."), new NotificationDeliveryChannelStatus("EMAIL", true, critical, critical, false, "Email sent for critical notices."), new NotificationDeliveryChannelStatus("SMS_LATER", false, false, false, false, "SMS is later.")),
                "Related entity access is backend-validated before navigation.", imageUrl);
    }
    private static NotificationTimeGroup group(String code, String label, List<NotificationItem> items) { return new NotificationTimeGroup(code, label, items.size(), items.stream().filter(item -> "UNREAD".equals(item.status())).count(), items); }
    private static NotificationUnreadCounts counts(List<NotificationItem> items) {
        List<NotificationItem> visible = items.stream().filter(item -> !item.archived()).toList();
        return new NotificationUnreadCounts(visible.stream().filter(item -> "UNREAD".equals(item.status())).count(), visible.stream().filter(item -> "UNREAD".equals(item.status()) && "BUYER".equals(item.roleContext())).count(), visible.stream().filter(item -> "UNREAD".equals(item.status()) && "SELLER".equals(item.roleContext())).count(), visible.stream().filter(item -> "UNREAD".equals(item.status()) && item.critical()).count(), visible.stream().filter(NotificationItem::actionRequired).count());
    }
    private static List<String> filters() { return List.of("All", "Buyer", "Seller", "Orders", "Seller orders", "Payments", "Seller acceptance", "Digital delivery", "Refunds", "Disputes", "Payouts", "Verification", "Support", "Security", "Marketplace", "Coupons/rewards", "Policies", "Listing moderation", "Admin announcements", "Unread", "Critical", "Action required", "Archived"); }
}
