package com.java.vinod.platform.ai.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/ai", "/internal/chat"})
public class SharityChatController {
    public record ChatRequest(@Pattern(regexp="[a-f0-9-]{36}") String conversationId, @NotBlank @Size(max=1500) String message) {}
    public record SaveRequest(boolean saved) {}
    private final SharityChatService chat; private final ConversationStore store; private final PublicKnowledge knowledge; private final FounderContent content;
    public SharityChatController(SharityChatService chat, ConversationStore store, PublicKnowledge knowledge, FounderContent content) {
        this.chat=chat;this.store=store;this.knowledge=knowledge;this.content=content;
    }
    @PostMapping("/chat") SharityChatService.Answer chat(Authentication auth,@Valid @RequestBody ChatRequest request) {
        return chat.chat(ChatIdentity.from(auth),request.conversationId(),request.message().trim());
    }
    @GetMapping("/conversations") List<ConversationStore.Summary> conversations(Authentication auth) { return store.list(ChatIdentity.from(auth)); }
    @GetMapping("/conversations/{id}") ConversationStore.Conversation get(Authentication auth,@PathVariable String id) { return store.get(ChatIdentity.from(auth),id); }
    @DeleteMapping("/conversations/{id}") void delete(Authentication auth,@PathVariable String id) { store.delete(ChatIdentity.from(auth),id); }
    @PatchMapping("/conversations/{id}") void save(Authentication auth,@PathVariable String id,@RequestBody SaveRequest request) { store.save(ChatIdentity.from(auth),id,request.saved()); }
    @GetMapping("/founder/profile") Map<String,Object> profile() { return knowledge.profile(); }
    @GetMapping("/founder/feed") Map<String,Object> feed() { return Map.of("posts",content.publicPosts(),"status",content.publicPosts().isEmpty()?"NO_APPROVED_POSTS":"APPROVED_IMPORTS"); }
}
