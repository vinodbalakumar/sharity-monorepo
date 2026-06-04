package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.NotificationDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stateless mocked Notification Center API for STORY-032.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationMockController {

    @GetMapping
    public NotificationDtos.NotificationFeedResponse notifications(@RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "25") int size,
                                                                   @RequestParam(required = false) String role,
                                                                   @RequestParam(required = false) String category,
                                                                   @RequestParam(required = false) String priority,
                                                                   @RequestParam(defaultValue = "false") boolean unreadOnly,
                                                                   @RequestParam(defaultValue = "false") boolean actionRequiredOnly,
                                                                   @RequestParam(defaultValue = "false") boolean archived) {
        return NotificationDtos.mockFeed(page, size, role, category, priority, unreadOnly, actionRequiredOnly, archived);
    }

    @GetMapping("/summary-counts")
    public NotificationDtos.NotificationSummaryCounts summaryCounts() {
        return NotificationDtos.mockSummaryCounts();
    }

    @PostMapping("/{notificationId}/read")
    public NotificationDtos.NotificationActionResponse markRead(@PathVariable String notificationId) {
        return NotificationDtos.actionResponse(notificationId, "OK", "Notification marked read.", true, false);
    }

    @PostMapping("/{notificationId}/unread")
    public NotificationDtos.NotificationActionResponse markUnread(@PathVariable String notificationId) {
        return NotificationDtos.actionResponse(notificationId, "OK", "Notification marked unread.", false, false);
    }

    @PostMapping("/read-all")
    public NotificationDtos.NotificationActionResponse markAllRead() {
        return NotificationDtos.actionResponse("ALL", "OK", "All eligible notifications marked read.", true, false);
    }

    @PostMapping("/{notificationId}/archive")
    public NotificationDtos.NotificationActionResponse archive(@PathVariable String notificationId) {
        NotificationDtos.NotificationItem item = NotificationDtos.mockNotification(notificationId);
        if (item.nonDismissible()) {
            return NotificationDtos.actionResponse(notificationId, "NOTIFICATION_ARCHIVE_NOT_ALLOWED",
                    "Critical notifications cannot be archived until resolved.", item.read(), false);
        }
        return NotificationDtos.actionResponse(notificationId, "OK", "Notification archived.", item.read(), true);
    }

    @GetMapping("/{notificationId}")
    public NotificationDtos.NotificationItem details(@PathVariable String notificationId) {
        return NotificationDtos.mockNotification(notificationId);
    }

    @PostMapping("/{notificationId}/resolve-action")
    public NotificationDtos.NotificationActionResponse resolveAction(@PathVariable String notificationId,
                                                                     @RequestBody(required = false)
                                                                     NotificationDtos.ResolveActionRequest request) {
        NotificationDtos.NotificationItem item = NotificationDtos.mockNotification(notificationId);
        String action = request == null ? "open" : request.actionType();
        return new NotificationDtos.NotificationActionResponse(notificationId, "OK",
                "Resolved notification action: " + action + ".", true, item.archived(), true, item.deepLink());
    }

    @GetMapping("/preferences-route")
    public NotificationDtos.PreferenceRouteResponse preferencesRoute(@RequestParam(required = false) String role) {
        return NotificationDtos.preferenceRoute(role);
    }
}
