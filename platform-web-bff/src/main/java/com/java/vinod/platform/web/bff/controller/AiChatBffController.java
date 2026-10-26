package com.java.vinod.platform.web.bff.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

/** Narrow public chat proxy. Never forwards browser-supplied identity, shared secrets or arbitrary routes. */
@RestController
public class AiChatBffController {
    private final RestTemplate client;
    private final String base, token;
    private record Window(long start,int count) {}
    private final Map<String,Window> limits = new HashMap<>();
    public AiChatBffController(@Value("${app.backends.ai-service:http://localhost:8086}") String base,
            @Value("${app.chat.bff-token:}") String token) {
        this.base=base.replaceAll("/+$","");this.token=token;
        client = new RestTemplateBuilder().connectTimeout(Duration.ofSeconds(3)).readTimeout(Duration.ofSeconds(95)).build();
        client.setErrorHandler(new org.springframework.web.client.DefaultResponseErrorHandler() {
            @Override public boolean hasError(org.springframework.http.client.ClientHttpResponse response) { return false; }
        });
    }
    private synchronized void throttle(String address) {
        long now=System.currentTimeMillis(); limits.entrySet().removeIf(e->now-e.getValue().start()>=60000);
        var w=limits.getOrDefault(address,new Window(now,0));
        if (limits.size()>=10000 || w.count()>=120) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        limits.put(address,new Window(w.start(),w.count()+1));
    }
    @RequestMapping(value={"/bff/ai/chat", "/bff/ai/conversations", "/bff/ai/conversations/{id}", "/bff/ai/founder/profile", "/bff/ai/founder/feed"},
            method={RequestMethod.GET,RequestMethod.POST,RequestMethod.DELETE,RequestMethod.PATCH})
    public ResponseEntity<byte[]> proxy(HttpServletRequest request, Authentication authentication) throws java.io.IOException {
        String path=request.getRequestURI().substring(request.getContextPath().length()+"/bff/ai".length());
        String method=request.getMethod();
        boolean allowed=("POST".equals(method)&&path.equals("/chat")) || ("GET".equals(method)&&Set.of("/conversations","/founder/profile","/founder/feed").contains(path))
                || (Set.of("GET","DELETE","PATCH").contains(method)&&path.matches("/conversations/[a-f0-9-]{36}"));
        if (!allowed) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (token.length()<32 || !(base.startsWith("https://")||base.matches("http://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?")))
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        throttle(request.getRemoteAddr());
        String owner; boolean guest;
        Object principal=authentication==null?null:authentication.getPrincipal();
        if (authentication != null && authentication.isAuthenticated() && !(authentication instanceof AnonymousAuthenticationToken)) {
            String issuer, subject;
            if (principal instanceof Jwt jwt) { issuer=String.valueOf(jwt.getIssuer());subject=jwt.getSubject(); }
            else if (principal instanceof OidcUser oidc) { issuer=String.valueOf(oidc.getIssuer());subject=oidc.getSubject(); }
            else throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
            try { owner="user_"+HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((issuer+"\n"+subject).getBytes(StandardCharsets.UTF_8))); }
            catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
            guest=false;
        } else {
            var session=request.getSession(true);
            synchronized (session) {
                if (session.getAttribute("sharityChatGuest")==null) session.setAttribute("sharityChatGuest", "guest_"+UUID.randomUUID());
                owner=session.getAttribute("sharityChatGuest").toString();
            }
            guest=true;
        }
        byte[] body=request.getInputStream().readNBytes(8193);
        if (body.length>8192) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        var headers=new HttpHeaders(); headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Chat-Token",token);headers.set("X-Chat-Owner",owner);headers.set("X-Chat-Guest",String.valueOf(guest));
        Object correlation=request.getAttribute("X-Correlation-ID");
        if (correlation instanceof String value && value.matches("[A-Za-z0-9_-]{1,64}")) headers.set("X-Correlation-ID",value);
        try {
            var response=client.exchange(base+"/internal/chat"+path,HttpMethod.valueOf(method),new HttpEntity<>(body,headers),byte[].class);
            if (response.getStatusCode().is5xxServerError()) return ResponseEntity.status(503).contentType(MediaType.APPLICATION_JSON)
                    .cacheControl(CacheControl.noStore()).body("{\"code\":\"AI_UNAVAILABLE\",\"message\":\"Sharity AI is temporarily unavailable. Please try again shortly.\"}".getBytes(StandardCharsets.UTF_8));
            return ResponseEntity.status(response.getStatusCode()).contentType(MediaType.APPLICATION_JSON).cacheControl(CacheControl.noStore()).body(response.getBody());
        } catch (org.springframework.web.client.ResourceAccessException ex) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE); }
    }
}
