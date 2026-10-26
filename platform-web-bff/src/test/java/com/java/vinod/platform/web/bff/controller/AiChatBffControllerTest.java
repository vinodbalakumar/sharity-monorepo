package com.java.vinod.platform.web.bff.controller;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class AiChatBffControllerTest {
    HttpServer server; AiChatBffController controller;
    AtomicReference<String> owner=new AtomicReference<>(), token=new AtomicReference<>(), guest=new AtomicReference<>();
    AtomicReference<String> correlation=new AtomicReference<>();
    @BeforeEach void start() throws Exception {
        server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/internal/chat",exchange->{
            owner.set(exchange.getRequestHeaders().getFirst("X-Chat-Owner"));
            token.set(exchange.getRequestHeaders().getFirst("X-Chat-Token"));
            guest.set(exchange.getRequestHeaders().getFirst("X-Chat-Guest"));
            correlation.set(exchange.getRequestHeaders().getFirst("X-Correlation-ID"));
            byte[] body="[]".getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();
        });server.start();
        controller=new AiChatBffController("http://127.0.0.1:"+server.getAddress().getPort(),"private-bff-token-at-least-thirty-two-characters");
    }
    @AfterEach void stop() { server.stop(0); }
    MockHttpServletRequest request(String path,String method) {
        var req=new MockHttpServletRequest(method,"/bff/ai"+path);req.setRemoteAddr("127.0.0.1");return req;
    }
    @Test void guestsHaveSessionBoundIdentityAndCannotSpoofHeaders() throws Exception {
        var first=request("/conversations","GET");first.addHeader("X-Chat-Owner","user_attacker");first.addHeader("X-Chat-Token","browser-value");
        first.setAttribute("X-Correlation-ID","safe-support-reference");first.addHeader("X-Correlation-ID","browser-value");
        controller.proxy(first,null);String a=owner.get();assertTrue(a.startsWith("guest_"));assertEquals("true",guest.get());assertNotEquals("browser-value",token.get());
        assertEquals("safe-support-reference",correlation.get());
        var second=request("/conversations","GET");second.setSession((MockHttpSession)first.getSession());controller.proxy(second,null);assertEquals(a,owner.get());
        controller.proxy(request("/conversations","GET"),null);assertNotEquals(a,owner.get());
    }
    @Test void verifiedUserHistoryIsStableAcrossBrowserSessions() throws Exception {
        var jwt=Jwt.withTokenValue("test").header("alg","RS256").issuer("https://identity.example").subject("user-a").build();
        var auth=new UsernamePasswordAuthenticationToken(jwt,null,java.util.List.of());
        controller.proxy(request("/conversations","GET"),auth);String a=owner.get();assertTrue(a.matches("user_[a-f0-9]{64}"));assertEquals("false",guest.get());
        controller.proxy(request("/conversations","GET"),auth);assertEquals(a,owner.get());
    }
    @Test void rejectsArbitraryRoutesAndOversizedBodies() {
        assertThrows(ResponseStatusException.class,()->controller.proxy(request("/admin/founder/posts","GET"),null));
        assertThrows(ResponseStatusException.class,()->controller.proxy(request("/conversations","POST"),null));
        var req=request("/chat","POST");req.setContent(new byte[8193]);assertEquals(413,assertThrows(ResponseStatusException.class,()->controller.proxy(req,null)).getStatusCode().value());
    }
    @Test void missingSharedSecretFailsClosed() { var closed=new AiChatBffController("http://127.0.0.1:8086","");assertEquals(503,assertThrows(ResponseStatusException.class,()->closed.proxy(request("/chat","POST"),null)).getStatusCode().value()); }
}
