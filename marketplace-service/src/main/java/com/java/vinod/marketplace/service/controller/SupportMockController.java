package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SupportDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SupportMockController {
    @GetMapping({"/api/support/topics", "/api/support/popular"})
    public List<SupportDtos.SupportTopic> topics() { return SupportDtos.topics(); }
    @GetMapping("/api/support/topics/{topicId}")
    public SupportDtos.SupportTopic topic(@PathVariable String topicId) { return SupportDtos.topic(topicId); }
    @GetMapping("/api/support/contextual-help")
    public List<SupportDtos.ContextualSupportLink> contextualHelp() { return SupportDtos.contextualLinks(); }
    @GetMapping("/api/support/actions")
    public SupportDtos.SupportActionEligibility actions() { return SupportDtos.home().actionEligibility(); }
    @GetMapping("/api/support/dashboard")
    public SupportDtos.SupportDashboardResponse dashboard() { return SupportDtos.dashboard(); }
    @GetMapping("/api/support/search")
    public List<SupportDtos.HelpSearchResultItem> search() { return SupportDtos.search(); }
    @GetMapping("/api/support/categories")
    public List<SupportDtos.SupportCategoryItem> categories() { return SupportDtos.categories(); }
    @GetMapping("/api/support/guided-help")
    public SupportDtos.GuidedHelpFlowResponse guidedHelp() { return SupportDtos.guidedHelp(); }
    @GetMapping("/api/support/self-service-suggestions")
    public List<SupportDtos.SelfServiceSuggestionItem> suggestions() { return SupportDtos.suggestions(); }
    @PostMapping("/api/support/tickets")
    public SupportDtos.CreateSupportTicketResponse create(@RequestBody(required = false) SupportDtos.CreateSupportTicketRequest request) {
        return new SupportDtos.CreateSupportTicketResponse("ticket-new-001", "SUP-1003", "CREATED", "HIGH", "/support/tickets/ticket-new-001", "Support ticket created.");
    }
    @GetMapping("/api/support/tickets")
    public List<SupportDtos.SupportTicketSummary> tickets() { return SupportDtos.tickets(); }
    @GetMapping("/api/support/tickets/{ticketId}")
    public SupportDtos.SupportTicketDetail detail(@PathVariable String ticketId) { return SupportDtos.detail(ticketId); }
    @PostMapping("/api/support/tickets/{ticketId}/replies")
    public SupportDtos.SupportTicketActionResponse reply(@PathVariable String ticketId, @RequestBody(required = false) SupportDtos.ReplySupportTicketRequest request) { return SupportDtos.action(ticketId, "WAITING_FOR_SUPPORT", "Reply sent inside Sharity."); }
    @PostMapping("/api/support/tickets/{ticketId}/attachments")
    public SupportDtos.SupportAttachmentItem attachment(@PathVariable String ticketId, @RequestBody(required = false) Object request) { return SupportDtos.attachment("attach-new-001"); }
    @GetMapping("/api/support/tickets/{ticketId}/timeline")
    public List<SupportDtos.SupportTicketTimelineEvent> timeline(@PathVariable String ticketId) { return SupportDtos.timeline(ticketId); }
    @PostMapping("/api/support/tickets/{ticketId}/escalate")
    public SupportDtos.SupportTicketActionResponse escalate(@PathVariable String ticketId, @RequestBody(required = false) SupportDtos.EscalateSupportTicketRequest request) { return SupportDtos.action(ticketId, "ESCALATED", "Ticket escalated to Sharity Review placeholder."); }
    @PostMapping("/api/support/tickets/{ticketId}/close")
    public SupportDtos.SupportTicketActionResponse close(@PathVariable String ticketId) { return SupportDtos.action(ticketId, "CLOSED", "Ticket closed."); }
    @PostMapping("/api/support/tickets/{ticketId}/reopen")
    public SupportDtos.SupportTicketActionResponse reopen(@PathVariable String ticketId) { return SupportDtos.action(ticketId, "REOPENED", "Ticket reopened."); }
    @GetMapping("/api/support/related-entities")
    public List<SupportDtos.SupportRelatedEntity> relatedEntities() { return SupportDtos.relatedEntities(); }
    @GetMapping("/api/admin/support/tickets")
    public List<SupportDtos.SupportTicketSummary> adminTickets() { return SupportDtos.tickets(); }
    @GetMapping("/api/admin/support/tickets/{ticketId}")
    public SupportDtos.SupportTicketDetail adminDetail(@PathVariable String ticketId) { return SupportDtos.detail(ticketId); }
    @PostMapping("/api/admin/support/tickets/{ticketId}/replies")
    public SupportDtos.SupportTicketActionResponse adminReply(@PathVariable String ticketId, @RequestBody(required = false) SupportDtos.ReplySupportTicketRequest request) { return SupportDtos.action(ticketId, "IN_PROGRESS", "Admin support reply sent."); }
    @PatchMapping("/api/admin/support/tickets/{ticketId}/status")
    public SupportDtos.SupportTicketActionResponse status(@PathVariable String ticketId, @RequestBody(required = false) Object request) { return SupportDtos.action(ticketId, "IN_PROGRESS", "Ticket status updated."); }
    @PostMapping("/api/admin/support/tickets/{ticketId}/assign")
    public SupportDtos.SupportTicketActionResponse assign(@PathVariable String ticketId) { return SupportDtos.action(ticketId, "ASSIGNED", "Ticket assigned."); }
    @PostMapping("/api/admin/support/tickets/{ticketId}/resolve")
    public SupportDtos.SupportTicketActionResponse resolve(@PathVariable String ticketId) { return SupportDtos.action(ticketId, "RESOLVED", "Ticket resolved."); }
}
