package com.java.vinod.platform.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
class DiagnosticsController {
    private final DiagnosticsService service;
    DiagnosticsController(DiagnosticsService service) { this.service = service; }

    record Event(
            @NotBlank @Pattern(regexp="authorization-server|marketplace-service|payment-service|wallet-service|platform-web-bff|tesla-dashboard-services|platform-ai-service") String service,
            @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,64}") String correlationId,
            @NotBlank @Pattern(regexp="GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|OTHER") String method,
            @NotBlank @Pattern(regexp="[A-Za-z0-9/{}_*.-]{1,180}") String route,
            @Min(100) @Max(599) int status,
            @Min(0) @Max(86400000) long durationMs,
            @Pattern(regexp="[A-Za-z0-9_]{1,80}") String exceptionType) {
        Event { if (exceptionType == null) exceptionType = "NONE"; }
        Event(String service, String correlationId, String method, String route, int status, long durationMs) {
            this(service, correlationId, method, route, status, durationMs, "NONE");
        }
    }

    @PostMapping("/internal/diagnostics/events") @ResponseStatus(HttpStatus.ACCEPTED)
    void ingest(@Valid @RequestBody Event event) { service.accept(event); }

    @GetMapping("/api/v1/admin/diagnostics")
    Map<String, Object> dashboard() { return service.snapshot(); }
}
