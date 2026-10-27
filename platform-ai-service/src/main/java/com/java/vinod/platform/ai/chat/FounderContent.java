package com.java.vinod.platform.ai.chat;

import jakarta.validation.constraints.*;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Authorized manual export adapter. API synchronization remains disabled until provider approval is supplied. */
@Service
public class FounderContent {
    public record ImportPost(@NotBlank @Pattern(regexp="LINKEDIN|INSTAGRAM") String platform,
            @NotBlank @Size(max=160) String postId, @NotBlank @Size(max=40) String publishedAt,
            @NotBlank @Size(max=3000) String content, @NotBlank @Size(max=1000) String originalUrl) {}
    public record Post(String id, String platform, String postId, String publishedAt, String content, String originalUrl,
            long lastSync, String visibility, String approval) {}
    private final JdbcTemplate jdbc;
    public FounderContent(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<Post> publicPosts() { return posts(true); }
    public List<Post> posts(boolean approvedOnly) {
        return jdbc.query("SELECT * FROM ai_founder_post" + (approvedOnly ? " WHERE visibility='PUBLIC' AND approval='APPROVED'" : "")
                + " ORDER BY published_at DESC LIMIT 100", (r,n) -> new Post(r.getString("id"), r.getString("platform"),
                        r.getString("post_id"), r.getString("published_at"), r.getString("content"), r.getString("original_url"),
                        r.getLong("last_sync"), r.getString("visibility"), r.getString("approval")));
    }
    @Transactional public Map<String,Object> importPosts(List<ImportPost> records) {
        if (records == null || records.isEmpty() || records.size() > 20) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        for (ImportPost p : records) {
            try {
                Instant published = Instant.parse(p.publishedAt());
                if (published.isAfter(Instant.now())) throw new IllegalArgumentException();
                URI url = URI.create(p.originalUrl());
                String host = url.getHost();
                Set<String> allowed = "LINKEDIN".equals(p.platform()) ? Set.of("linkedin.com", "www.linkedin.com") : Set.of("instagram.com", "www.instagram.com");
                if (!"https".equals(url.getScheme()) || !allowed.contains(host) || url.getUserInfo() != null || url.getPort() != -1
                        || url.getRawQuery() != null || url.getFragment() != null || url.getPath().length() < 3) throw new IllegalArgumentException();
                String normalized = new java.time.format.DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(published);
                int updated = jdbc.update("UPDATE ai_founder_post SET published_at=?,content=?,original_url=?,last_sync=?,visibility='INTERNAL',approval='PENDING' WHERE platform=? AND post_id=?",
                        normalized, p.content(), p.originalUrl(), System.currentTimeMillis(), p.platform(), p.postId());
                if (updated == 0) jdbc.update("INSERT INTO ai_founder_post VALUES (?,?,?,?,?,?,?,?,?)", UUID.randomUUID().toString(),
                        p.platform(), p.postId(), normalized, p.content(), p.originalUrl(), System.currentTimeMillis(), "INTERNAL", "PENDING");
            } catch (IllegalArgumentException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid source record"); }
        }
        return Map.of("imported", records.size(), "approval", "PENDING", "message", "Confirm founder ownership and rights before approval. Changed records require reapproval.");
    }
    public void review(String id, String decision) {
        if (!Set.of("APPROVED", "REJECTED", "REVOKED").contains(decision)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if (jdbc.update("UPDATE ai_founder_post SET approval=?,visibility=? WHERE id=?", decision,
                "APPROVED".equals(decision) ? "PUBLIC" : "INTERNAL", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    public void remove(String id) { jdbc.update("DELETE FROM ai_founder_post WHERE id=?", id); }
    public Map<String,Object> status() {
        return Map.of("linkedin", "MANUAL_IMPORT_ONLY: official API permission and credentials not configured",
                "instagram", "MANUAL_IMPORT_ONLY: official API eligibility, permission and credentials not configured",
                "automaticSyncEnabled", false, "publicPosts", publicPosts().size(), "retrieval", "Live database lookup; approval/revocation effective immediately; no stale vector index");
    }
}
