package com.java.vinod.platform.ai;

import com.java.vinod.platform.ai.chat.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
        "app.chat.bff-token=chat-test-token-at-least-thirty-two-characters", "spring.datasource.url=jdbc:h2:mem:chat-tests;DB_CLOSE_DELAY=-1",
        "spring.sql.init.mode=always", "spring.ai.model.chat=none", "app.ai.enabled=false"})
class SharityChatRuntimeTest {
    static final String TOKEN="chat-test-token-at-least-thirty-two-characters";
    @LocalServerPort int port;
    @Autowired ObjectMapper mapper; @Autowired FounderContent founder; @Autowired PublicKnowledge knowledge; @Autowired JdbcTemplate jdbc;
    final HttpClient http=HttpClient.newHttpClient();
    String owner;
    @BeforeEach void setup() { owner="guest_"+UUID.randomUUID(); jdbc.update("DELETE FROM ai_founder_post"); }
    HttpResponse<String> send(String path,String method,String body,String identity,String token) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)).header("Content-Type","application/json");
        if (token!=null) builder.header("X-Chat-Token",token).header("X-Chat-Owner",identity).header("X-Chat-Guest","true");
        return http.send(builder.method(method,HttpRequest.BodyPublishers.ofString(body==null?"":body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    HttpResponse<String> chat(String text,String id) throws Exception { return send("/internal/chat/chat","POST",mapper.writeValueAsString(new SharityChatController.ChatRequest(id,text)),owner,TOKEN); }
    @Test void founderFactsAndPrivateEmailPolicy() throws Exception {
        for (String q:List.of("Who founded Sharity?","What is his full name?","What is his LinkedIn profile?","What is his Instagram username?","How can I contact the founder?","What is his professional background?")) {
            var response=chat(q,null); assertEquals(200,response.statusCode(),response.body());
            assertTrue(response.body().contains("Vinod Balakumar Panchaparvala")); assertFalse(response.body().contains("@gmail.com"));
            assertEquals("STRUCTURED",mapper.readTree(response.body()).get("generation").asText());
            assertEquals(0,mapper.readTree(response.body()).get("metrics").get("totalTokens").asInt());
            assertTrue(mapper.readTree(response.body()).get("metrics").get("responseCompletedAt").asLong()
                    >= mapper.readTree(response.body()).get("metrics").get("requestStartedAt").asLong());
        }
    }
    @Test void feedUnavailableIsHonest() throws Exception { var r=chat("What has he posted recently?",null); assertEquals(200,r.statusCode());assertTrue(r.body().contains("No approved")); }
    @Test void platformAnswersDistinguishLocalAndUnverifiedProductionFeatures() throws Exception {
        for (String q:List.of("What is Sharity?","How does its marketplace work?","What services power the application?","How does authentication work?","What features are currently available?","What features are planned?")) {
            var r=chat(q,null);assertEquals(200,r.statusCode(),r.body());assertTrue(r.body().contains("not verified"));
        }
    }
    @Test void historyOwnershipSaveDeleteAndUnknownId() throws Exception {
        var created=mapper.readTree(chat("Who founded Sharity?",null).body()); String id=created.get("conversationId").asText();
        assertEquals(404,send("/internal/chat/conversations/"+id,"GET",null,"guest_"+UUID.randomUUID(),TOKEN).statusCode());
        assertEquals(200,send("/internal/chat/conversations/"+id,"PATCH","{\"saved\":true}",owner,TOKEN).statusCode());
        var history=send("/internal/chat/conversations/"+id,"GET",null,owner,TOKEN); assertTrue(history.body().contains("\"saved\":true"));
        assertEquals(2,mapper.readTree(history.body()).get("messages").size());
        assertEquals(200,send("/internal/chat/conversations/"+id,"DELETE",null,owner,TOKEN).statusCode());
        assertEquals(404,send("/internal/chat/conversations/"+id,"GET",null,owner,TOKEN).statusCode());
    }
    @Test void guestRetentionDeletesExpiredHistory() throws Exception {
        String id=mapper.readTree(chat("Who founded Sharity?",null).body()).get("conversationId").asText();
        jdbc.update("UPDATE ai_conversation SET updated_at=0 WHERE id=?",id);
        assertEquals(404,send("/internal/chat/conversations/"+id,"GET",null,owner,TOKEN).statusCode());
    }
    @Test void channelRejectsSpoofingAndOversizedBody() throws Exception {
        assertEquals(401,send("/internal/chat/conversations","GET",null,owner,null).statusCode());
        assertEquals(401,send("/internal/chat/conversations","GET",null,owner,"wrong").statusCode());
        assertEquals(401,send("/internal/chat/conversations","GET",null,"user_forged",TOKEN).statusCode());
        assertEquals(413,send("/internal/chat/chat","POST","x".repeat(65537),owner,TOKEN).statusCode());
        assertEquals(401,send("/api/ai/admin/founder/posts","GET",null,owner,TOKEN).statusCode());
    }
    @Test void validationAndModelUnavailableAreSafe() throws Exception {
        assertEquals(400,chat("",null).statusCode()); assertEquals(400,chat("x".repeat(1501),null).statusCode());
        var r=chat("Write a Java program to reverse a string.",null); assertEquals(503,r.statusCode());
        assertFalse(r.body().contains("localhost")); assertFalse(r.body().contains("Exception"));
    }
    @Test void rateLimitIsBounded() throws Exception { for(int i=0;i<6;i++) assertEquals(200,chat("Who founded Sharity?",null).statusCode()); assertEquals(429,chat("Who founded Sharity?",null).statusCode()); }
    @Test void importedPostsRequireApprovalAndReimportsRevokeIt() {
        var p=new FounderContent.ImportPost("LINKEDIN","fixture-post","2026-10-24T00:00:00Z","Test-only founder statement","https://www.linkedin.com/posts/test-fixture");
        founder.importPosts(List.of(p)); assertTrue(founder.publicPosts().isEmpty());
        String id=founder.posts(false).getFirst().id(); founder.review(id,"APPROVED");assertEquals(1,founder.publicPosts().size());
        assertTrue(knowledge.exactAnswer("What has the founder posted recently?").orElseThrow().contains(p.originalUrl()));
        founder.importPosts(List.of(p)); assertTrue(founder.publicPosts().isEmpty());assertEquals(1,founder.posts(false).size());
        founder.review(id,"APPROVED");founder.review(id,"REVOKED");assertTrue(founder.publicPosts().isEmpty());
        founder.remove(id); assertTrue(founder.posts(false).isEmpty());
    }
    @Test void rejectsUntrustedSourceUrlsAndFutureDates() {
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->founder.importPosts(List.of(new FounderContent.ImportPost("LINKEDIN","x","2026-10-24T00:00:00Z","test","https://linkedin.com.attacker.invalid/post"))));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->founder.importPosts(List.of(new FounderContent.ImportPost("INSTAGRAM","x","2099-10-24T00:00:00Z","test","https://www.instagram.com/p/test"))));
    }
    @Test void publicProfileAndRetrievalContainOnlyApprovedPublicKnowledge() throws Exception {
        var r=send("/internal/chat/founder/profile","GET",null,owner,TOKEN); assertEquals(200,r.statusCode());assertFalse(r.body().contains("email"));
        assertTrue(knowledge.retrieve("founder Sharity architecture").stream().allMatch(s->s.approved()&&s.visibility().equals("PUBLIC")));
        assertTrue(knowledge.retrieve("founder").size()<=3);
    }
}
