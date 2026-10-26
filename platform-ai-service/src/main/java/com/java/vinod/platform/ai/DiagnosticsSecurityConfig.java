package com.java.vinod.platform.ai;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;

@Configuration
class DiagnosticsSecurityConfig {
    @Bean @Order(1)
    SecurityFilterChain telemetrySecurity(HttpSecurity http,
            @Value("${app.diagnostics.token:}") String secret) throws Exception {
        return http.securityMatcher("/internal/diagnostics/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                                              FilterChain chain) throws ServletException, IOException {
                        String supplied = request.getHeader("X-Diagnostics-Token");
                        if (secret.length() < 32 || supplied == null || supplied.length() > 256 || !MessageDigest.isEqual(
                                secret.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8))) {
                            reject(response, 401); return;
                        }
                        // Fixed-size event envelope only, not arbitrary log ingestion.
                        if (request.getContentLengthLong() > 4096) { reject(response, 413); return; }
                        byte[] body = request.getInputStream().readNBytes(4097);
                        if (body.length > 4096) { reject(response, 413); return; }
                        chain.doFilter(new HttpServletRequestWrapper(request) {
                            @Override public ServletInputStream getInputStream() {
                                var stream = new java.io.ByteArrayInputStream(body);
                                return new ServletInputStream() {
                                    public int read() { return stream.read(); }
                                    public boolean isFinished() { return stream.available() == 0; }
                                    public boolean isReady() { return true; }
                                    public void setReadListener(ReadListener listener) { throw new IllegalStateException("Synchronous metadata endpoint"); }
                                };
                            }
                        }, response);
                    }
                    private void reject(HttpServletResponse response, int status) throws IOException {
                        response.setStatus(status);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"code\":\"INGESTION_REJECTED\",\"message\":\"The diagnostic event could not be accepted.\"}");
                    }
                }, AnonymousAuthenticationFilter.class)
                .authorizeHttpRequests(a -> a.requestMatchers(org.springframework.http.HttpMethod.POST,
                        "/internal/diagnostics/events").permitAll().anyRequest().denyAll()).build();
    }
}
