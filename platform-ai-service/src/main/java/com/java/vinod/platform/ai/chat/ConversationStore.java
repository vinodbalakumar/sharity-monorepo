package com.java.vinod.platform.ai.chat;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Repository
public class ConversationStore {
    public record Summary(String id, String title, long createdAt, long updatedAt, boolean saved) {}
    public record Metrics(long requestStartedAt, long responseCompletedAt, long durationMs,
                          Integer inputTokens, Integer outputTokens, Integer totalTokens, String generation) {}
    public record StoredAnswer(String conversationId, String messageId) {}
    public record Message(String id, String role, String content, List<PublicKnowledge.Source> sources, long createdAt, Metrics metrics) {}
    public record Conversation(Summary conversation, List<Message> messages) {}
    private final JdbcTemplate jdbc; private final ObjectMapper mapper;
    public ConversationStore(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc = jdbc; this.mapper = mapper; }
    @Transactional public void cleanGuests() {
        jdbc.update("DELETE FROM ai_conversation WHERE guest=TRUE AND updated_at<?", System.currentTimeMillis() - 86400000L);
    }
    public List<Summary> list(ChatIdentity who) {
        cleanGuests();
        return jdbc.query("SELECT * FROM ai_conversation WHERE owner_id=? ORDER BY updated_at DESC LIMIT 50", (r,n) ->
                new Summary(r.getString("id"), r.getString("title"), r.getLong("created_at"), r.getLong("updated_at"), r.getBoolean("saved")), who.owner());
    }
    public Summary owned(ChatIdentity who, String id) {
        return list(who).stream().filter(s -> s.id().equals(id)).findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
    public Conversation get(ChatIdentity who, String id) {
        Summary summary = owned(who, id);
        var messages = jdbc.query("SELECT m.*, d.message_id, d.request_started_at, d.response_completed_at, d.duration_ms, d.input_tokens, d.output_tokens, d.total_tokens, d.generation FROM ai_message m LEFT JOIN ai_message_metrics d ON m.id=d.message_id WHERE m.conversation_id=? ORDER BY m.created_at,m.id", (r,n) ->
                new Message(r.getString("id"), r.getString("role"), r.getString("content"),
                        Arrays.asList(mapper.readValue(r.getString("sources"), PublicKnowledge.Source[].class)), r.getLong("created_at"),
                        r.getString("message_id") == null ? null : new Metrics(r.getLong("request_started_at"), r.getLong("response_completed_at"), r.getLong("duration_ms"),
                                r.getObject("input_tokens", Integer.class), r.getObject("output_tokens", Integer.class), r.getObject("total_tokens", Integer.class), r.getString("generation"))), id);
        return new Conversation(summary, messages);
    }
    public void delete(ChatIdentity who, String id) { owned(who,id); jdbc.update("DELETE FROM ai_conversation WHERE id=? AND owner_id=?", id, who.owner()); }
    public void save(ChatIdentity who, String id, boolean saved) { owned(who,id); jdbc.update("UPDATE ai_conversation SET saved=? WHERE id=? AND owner_id=?", saved,id,who.owner()); }
    @Transactional public String append(ChatIdentity who, String id, String question, String answer, List<PublicKnowledge.Source> sources) {
        return appendWithMetrics(who,id,question,answer,sources,null).conversationId();
    }
    @Transactional public StoredAnswer appendWithMetrics(ChatIdentity who, String id, String question, String answer, List<PublicKnowledge.Source> sources, Metrics metrics) {
        long now = System.currentTimeMillis();
        if (id == null) {
            if (list(who).size() >= (who.guest() ? 10 : 50)) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Delete an old conversation first");
            id = UUID.randomUUID().toString();
            jdbc.update("INSERT INTO ai_conversation VALUES (?,?,?,?,?,?,FALSE)", id, who.owner(), who.guest(), question.substring(0,Math.min(100,question.length())), now, now);
        } else {
            owned(who,id);
            Long latest=jdbc.queryForObject("SELECT MAX(created_at) FROM ai_message WHERE conversation_id=?",Long.class,id);
            if (latest!=null) now=Math.max(now,latest+2);
            if (jdbc.queryForObject("SELECT COUNT(*) FROM ai_message WHERE conversation_id=?", Long.class,id) >= 80)
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Start a new conversation");
        }
        jdbc.update("INSERT INTO ai_message VALUES (?,?,?,?,?,?)", UUID.randomUUID().toString(), id, "user", question, "[]", now);
        String messageId=UUID.randomUUID().toString();
        jdbc.update("INSERT INTO ai_message VALUES (?,?,?,?,?,?)", messageId, id, "assistant", answer, mapper.writeValueAsString(sources), now+1);
        if (metrics != null) jdbc.update("INSERT INTO ai_message_metrics VALUES (?,?,?,?,?,?,?,?)", messageId,
                metrics.requestStartedAt(),metrics.responseCompletedAt(),metrics.durationMs(),metrics.inputTokens(),metrics.outputTokens(),metrics.totalTokens(),metrics.generation());
        jdbc.update("UPDATE ai_conversation SET updated_at=? WHERE id=? AND owner_id=?", now,id,who.owner());
        return new StoredAnswer(id,messageId);
    }
}
