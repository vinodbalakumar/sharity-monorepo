package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.NotificationDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {
    @GetMapping("/api/notifications/dashboard")
    public NotificationDtos.NotificationCenterDashboardResponse dashboard() { return NotificationDtos.dashboard(); }
    @GetMapping("/api/notifications")
    public List<NotificationDtos.NotificationItem> notifications() { return NotificationDtos.notifications(); }
    @GetMapping("/api/notifications/{notificationId}")
    public NotificationDtos.NotificationItem detail(@PathVariable String notificationId) { return NotificationDtos.notification(notificationId); }
    @GetMapping("/api/notifications/summary")
    public NotificationDtos.NotificationSummary summary() { return NotificationDtos.summary(); }
    @GetMapping("/api/notifications/search")
    public List<NotificationDtos.NotificationItem> search(@RequestParam(required = false) String q) { return NotificationDtos.notifications(); }
    @PostMapping("/api/notifications/{notificationId}/read")
    public NotificationDtos.NotificationActionResponse read(@PathVariable String notificationId) { return NotificationDtos.action(notificationId, "MARK_READ", true, "notifications", "Notification marked read."); }
    @PostMapping("/api/notifications/{notificationId}/unread")
    public NotificationDtos.NotificationActionResponse unread(@PathVariable String notificationId) { return NotificationDtos.action(notificationId, "MARK_UNREAD", true, "notifications", "Notification marked unread."); }
    @PostMapping({"/api/notifications/mark-all-read", "/api/notifications/read-all"})
    public NotificationDtos.NotificationActionResponse markAllRead() { return NotificationDtos.action("ALL", "MARK_ALL_READ", true, "notifications", "All eligible notifications marked read."); }
    @PostMapping("/api/notifications/{notificationId}/archive")
    public NotificationDtos.NotificationActionResponse archive(@PathVariable String notificationId) { return NotificationDtos.action(notificationId, "ARCHIVE", true, "notifications", "Notification archived. Audit history was not deleted."); }
    @PostMapping("/api/notifications/{notificationId}/actions/{actionCode}")
    public NotificationDtos.NotificationActionResponse action(@PathVariable String notificationId, @PathVariable String actionCode) { return NotificationDtos.action(notificationId, actionCode, true, NotificationDtos.notification(notificationId).primaryAction().route(), "Notification action validated."); }
    @PostMapping("/api/notifications/{notificationId}/resolve-action")
    public NotificationDtos.NotificationActionResponse resolveAction(@PathVariable String notificationId) { return action(notificationId, "OPEN_RELATED_ENTITY"); }
    @GetMapping({"/api/notifications/counts", "/api/notifications/summary-counts"})
    public NotificationDtos.NotificationUnreadCounts counts() { return NotificationDtos.counts(); }
    @GetMapping({"/api/notifications/preferences-summary", "/api/notifications/preferences-route"})
    public NotificationDtos.NotificationPreferenceSummary preferencesSummary() { return NotificationDtos.preferencesSummary(); }
    @GetMapping("/api/notifications/settings")
    public NotificationDtos.NotificationSettings settings() { return NotificationDtos.settings(); }
    @PostMapping("/api/notifications/settings")
    public NotificationDtos.NotificationSettings updateSettings() { return NotificationDtos.settings(); }
    @PostMapping("/api/notifications/refresh")
    public NotificationDtos.NotificationActionResponse refresh() { return NotificationDtos.action("ALL", "REFRESH", true, "notifications", "Notifications refreshed."); }
    @GetMapping("/api/admin/notifications/broadcasts")
    public List<NotificationDtos.AdminBroadcastSummary> broadcasts() { return NotificationDtos.broadcasts(); }
    @GetMapping("/api/admin/notifications/templates")
    public List<NotificationDtos.AdminBroadcastTemplate> templates() { return NotificationDtos.templates(); }
    @PostMapping("/api/admin/notifications/broadcasts")
    public NotificationDtos.NotificationActionResponse createBroadcast() { return NotificationDtos.action("broadcast-new", "CREATE_BROADCAST_PLACEHOLDER", true, "notifications", "Admin broadcast placeholder accepted."); }
}
