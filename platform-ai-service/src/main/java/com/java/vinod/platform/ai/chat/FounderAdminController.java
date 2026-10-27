package com.java.vinod.platform.ai.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/ai/admin/founder")
public class FounderAdminController {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(FounderAdminController.class);
    public record ImportRequest(@Valid @NotEmpty @Size(max=20) List<FounderContent.ImportPost> posts) {}
    public record ReviewRequest(@NotBlank @Pattern(regexp="APPROVED|REJECTED|REVOKED") String decision) {}
    private final FounderContent content;
    public FounderAdminController(FounderContent content) { this.content=content; }
    @GetMapping("/posts") Object posts() { return content.posts(false); }
    @GetMapping("/status") Object status() { return content.status(); }
    @PostMapping("/import") Object importPosts(org.springframework.security.core.Authentication auth,@Valid @RequestBody ImportRequest request) {
        var result=content.importPosts(request.posts()); log.info("founder_content_import actor={} count={}",ChatIdentity.from(auth).owner(),request.posts().size());return result;
    }
    @PostMapping("/posts/{id}/review") void review(org.springframework.security.core.Authentication auth,@PathVariable String id,@Valid @RequestBody ReviewRequest request) {
        content.review(id,request.decision());log.info("founder_content_review actor={} decision={}",ChatIdentity.from(auth).owner(),request.decision());
    }
    @DeleteMapping("/posts/{id}") void remove(org.springframework.security.core.Authentication auth,@PathVariable String id) {
        content.remove(id);log.info("founder_content_remove actor={}",ChatIdentity.from(auth).owner());
    }
    @PostMapping("/reindex") Object reindex() { return Map.of("status","CURRENT", "message","Structured retrieval reads approved database records on every request."); }
}
