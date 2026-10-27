package com.java.vinod.platform.ai.chat;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class ChatChannelSecurity {
    @Bean @Order(0)
    SecurityFilterChain chatChannel(HttpSecurity http, @Value("${app.chat.bff-token:}") String token) throws Exception {
        return http.securityMatcher("/internal/chat/**").csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                            throws IOException, ServletException {
                        String supplied = req.getHeader("X-Chat-Token"), owner = req.getHeader("X-Chat-Owner");
                        String guest = req.getHeader("X-Chat-Guest");
                        boolean isGuest = "true".equals(guest);
                        if (token.length() < 32 || supplied == null || supplied.length() > 256
                                || !MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8))
                                || owner == null || !(isGuest ? owner.matches("guest_[a-f0-9-]{36}") : owner.matches("user_[a-f0-9]{64}"))
                                || !("true".equals(guest) || "false".equals(guest))) {
                            res.setStatus(401); return;
                        }
                        byte[] body = req.getInputStream().readNBytes(65537);
                        if (body.length > 65536) { res.setStatus(413); return; }
                        var wrapped = new HttpServletRequestWrapper(req) {
                            @Override public ServletInputStream getInputStream() {
                                var input = new ByteArrayInputStream(body);
                                return new ServletInputStream() {
                                    public int read() { return input.read(); }
                                    public boolean isFinished() { return input.available() == 0; }
                                    public boolean isReady() { return true; }
                                    public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException(); }
                                };
                            }
                        };
                        var context = SecurityContextHolder.createEmptyContext();
                        context.setAuthentication(new UsernamePasswordAuthenticationToken(new ChatIdentity(owner, isGuest), null,
                                List.of(new SimpleGrantedAuthority("ROLE_CHAT"))));
                        SecurityContextHolder.setContext(context);
                        try { chain.doFilter(wrapped, res); } finally { SecurityContextHolder.clearContext(); }
                    }
                }, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(a -> a.anyRequest().hasRole("CHAT")).build();
    }
}
