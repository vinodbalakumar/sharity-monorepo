package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SafeMessagingDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SafeMessagingMockController {
    @GetMapping("/api/messages/threads")
    public SafeMessagingDtos.MessageThreadsResponse threads() {
        return SafeMessagingDtos.response();
    }

    @GetMapping({"/api/messages/threads/{threadId}", "/api/admin/messages/threads/{threadId}"})
    public SafeMessagingDtos.MessageThreadDetail thread(@PathVariable String threadId) {
        return SafeMessagingDtos.thread(threadId);
    }

    @PostMapping("/api/messages/threads/for-entity")
    public SafeMessagingDtos.MessageThreadDetail threadForEntity(@RequestBody(required = false) Object request) {
        return SafeMessagingDtos.thread("thread-entity-1001");
    }

    @PostMapping("/api/messages/threads")
    public SafeMessagingDtos.MessageThreadDetail createThread(@RequestBody(required = false) Object request) {
        return SafeMessagingDtos.thread("thread-new-1001");
    }

    @PostMapping("/api/messages/threads/{threadId}/messages")
    public SafeMessagingDtos.SendMessageResponse send(@PathVariable String threadId,
                                                      @RequestBody SafeMessagingDtos.SendMessageRequest request) {
        return SafeMessagingDtos.send(request);
    }

    @PostMapping("/api/messages/validate-draft")
    public SafeMessagingDtos.MessageDraftValidationResponse validate(
            @RequestBody SafeMessagingDtos.MessageDraftValidationRequest request) {
        return SafeMessagingDtos.validateText(request.messageText());
    }

    @PostMapping("/api/messages/threads/{threadId}/attachments")
    public SafeMessagingDtos.MessageAttachmentItem attachment(@PathVariable String threadId) {
        return new SafeMessagingDtos.MessageAttachmentItem("attachment-1001", "evidence.png", "image/png",
                120_000L, "marketplace/placeholders/evidence.png", "UPLOADED", "SCAN_PENDING",
                "REFUND_DISPUTE_EVIDENCE_ONLY", java.time.LocalDateTime.now());
    }

    @PostMapping({"/api/messages/threads/{threadId}/read", "/api/messages/threads/{threadId}/typing",
            "/api/messages/{messageId}/report", "/api/messages/threads/{threadId}/report-user",
            "/api/messages/threads/{threadId}/mute", "/api/messages/threads/{threadId}/unmute",
            "/api/messages/threads/{threadId}/block-user", "/api/messages/threads/{threadId}/escalate",
            "/api/admin/messages/reports/{reportId}/resolve"})
    public SafeMessagingDtos.MessagingActionResponse action() {
        return SafeMessagingDtos.action("Safe Messaging mock action accepted.");
    }

    @GetMapping("/api/messages/search")
    public List<SafeMessagingDtos.MessageSearchResultItem> search(@RequestParam(required = false) String q) {
        return SafeMessagingDtos.searchResults();
    }

    @GetMapping("/api/messages/threads/{threadId}/policy")
    public SafeMessagingDtos.MessagePolicyWarning policy(@PathVariable String threadId) {
        return SafeMessagingDtos.policyWarning();
    }

    @GetMapping("/api/messages/threads/{threadId}/actions")
    public SafeMessagingDtos.MessageActionEligibility actions(@PathVariable String threadId) {
        return SafeMessagingDtos.actions();
    }

    @GetMapping("/api/messages/safety-rules")
    public SafeMessagingDtos.MessagingSafetyRules safetyRules() {
        return SafeMessagingDtos.safetyRules();
    }

    @GetMapping({"/api/admin/messages/moderation", "/api/admin/messages/reports"})
    public List<SafeMessagingDtos.AdminMessageModerationQueueItem> moderation() {
        return SafeMessagingDtos.adminQueue();
    }

    @GetMapping("/api/admin/messages/reports/{reportId}")
    public SafeMessagingDtos.AdminMessageModerationQueueItem report(@PathVariable String reportId) {
        return SafeMessagingDtos.adminQueue().get(0);
    }
}
