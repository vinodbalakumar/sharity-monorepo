package com.java.vinod.platform.ai;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import static org.assertj.core.api.Assertions.assertThat;

/** Real embedded HTTP server, including auto-configuration and both security filter chains. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "app.diagnostics.enabled=false", "app.diagnostics.ai-enabled=false", "app.ai.enabled=false",
        "spring.ai.model.chat=none", "app.diagnostics.token=verification-only-diagnostics-token-123456789",
        "management.tracing.export.otlp.enabled=false", "management.otlp.metrics.export.enabled=false", "management.logging.export.otlp.enabled=false" })
class DiagnosticsRuntimeTest {
    @Value("${local.server.port}") int port;
    final String token = "verification-only-diagnostics-token-123456789";
    final String payload = "{\"service\":\"payment-service\",\"correlationId\":\"smoke-ref-123\",\"method\":\"POST\",\"route\":\"/payments/{id}\",\"status\":503,\"durationMs\":3100,\"exceptionType\":\"SocketTimeoutException\"}";
    int post(String body, boolean trusted) throws Exception {
        try (var http = HttpClient.newHttpClient()) {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/internal/diagnostics/events"))
                    .timeout(Duration.ofSeconds(5)).header("Content-Type", "application/json");
            if (trusted) request.header("X-Diagnostics-Token", token);
            return http.send(request.POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.discarding()).statusCode();
        }
    }
    @Test void startupAndTrustedIngestionWorkWithAiDisabled() throws Exception { assertThat(post(payload, true)).isEqualTo(202); }
    @Test void ingestionRejectsUnauthenticatedTraffic() throws Exception { assertThat(post(payload, false)).isEqualTo(401); }
    @Test void metadataValidationSurvivesTheFullFilterChain() throws Exception { assertThat(post(payload.replace("payment-service", "untrusted-service"), true)).isEqualTo(400); }
    @Test void oversizedPayloadsAreRejected() throws Exception { assertThat(post("x".repeat(5000), true)).isEqualTo(413); }
    @Test void anonymousUsersCannotReadAdminIncidents() throws Exception {
        try (var http = HttpClient.newHttpClient()) {
            assertThat(http.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/admin/diagnostics"))
                    .timeout(Duration.ofSeconds(5)).build(), HttpResponse.BodyHandlers.discarding()).statusCode()).isEqualTo(401);
        }
    }
}
