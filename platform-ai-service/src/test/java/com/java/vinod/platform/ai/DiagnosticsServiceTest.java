package com.java.vinod.platform.ai;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiagnosticsServiceTest {
    @Test void inferenceIncidentsKeepMeasurementsWithoutRequestingMoreInference() {
        var model = org.mockito.Mockito.mock(org.springframework.ai.chat.model.ChatModel.class);
        org.mockito.Mockito.when(model.getOptions()).thenReturn(org.springframework.ai.chat.prompt.ChatOptions.builder().build());
        var service = new DiagnosticsService(Optional.of(model), true, 2000);
        try {
            service.accept(new DiagnosticsController.Event("platform-ai-service", "ai-ref", "POST", "/internal/chat/chat", 200, 9000));
            service.accept(new DiagnosticsController.Event("platform-web-bff", "bff-ref", "POST", "/bff/ai/chat", 503, 95000));
            var incidents = (List<?>) service.snapshot().get("incidents");
            assertThat(incidents).hasSize(2);
            assertThat(incidents.toString()).contains("NOT_REQUESTED", "9000", "95000", "ai-ref", "bff-ref").doesNotContain("PENDING");
            org.mockito.Mockito.verify(model, org.mockito.Mockito.never()).call(org.mockito.ArgumentMatchers.any(org.springframework.ai.chat.prompt.Prompt.class));
        } finally { service.close(); }
    }

    @Test void providerFailureDoesNotBreakIngestionOrAdministratorReads() throws Exception {
        var model = org.mockito.Mockito.mock(org.springframework.ai.chat.model.ChatModel.class);
        org.mockito.Mockito.when(model.getOptions()).thenReturn(org.springframework.ai.chat.prompt.ChatOptions.builder().build());
        org.mockito.Mockito.when(model.call(org.mockito.ArgumentMatchers.any(org.springframework.ai.chat.prompt.Prompt.class)))
                .thenThrow(new IllegalStateException("private provider details"));
        var service = new DiagnosticsService(Optional.of(model), true, 2000);
        try {
            service.accept(event(503, 3000));
            org.junit.jupiter.api.Assertions.assertTimeoutPreemptively(Duration.ofSeconds(5), () -> {
                while (!service.snapshot().get("incidents").toString().contains("UNAVAILABLE")) Thread.onSpinWait();
            });
            assertThat(service.snapshot().get("incidents").toString()).doesNotContain("private provider details");
            service.accept(event(200, 1));
        } finally { service.close(); }
    }

    DiagnosticsController.Event event(int status, long ms) {
        return new DiagnosticsController.Event("payment-service", "ref-123", "POST", "/api/payments/{id}", status, ms);
    }
    @Test void slowRequestsAreMeasuredWithoutAnAiProvider() {
        var service = new DiagnosticsService(Optional.empty(), true, 2000);
        try {
            service.accept(event(200, 2500));
            var snapshot = service.snapshot();
            assertThat(snapshot.get("aiEnabled")).isEqualTo(false);
            var incidents = (List<?>) snapshot.get("incidents");
            assertThat(incidents).hasSize(1);
            assertThat(incidents.getFirst().toString()).contains("SLOW_REQUEST", "DISABLED", "ref-123", "cause");
        } finally { service.close(); }
    }
    @Test void duplicateIncidentsDoNotTriggerAnAiStormButRequestsStillCount() {
        var service = new DiagnosticsService(Optional.empty(), false, 2000);
        try {
            for (int i = 0; i < 100; i++) service.accept(event(503, 10));
            var data = service.snapshot();
            assertThat((List<?>) data.get("incidents")).hasSize(1);
            assertThat(data.get("services").toString()).contains("requests=100", "errors=100");
        } finally { service.close(); }
    }
    @Test void healthyRequestsDoNotBecomeAiIncidents() {
        var service = new DiagnosticsService(Optional.empty(), false, 2000);
        try {
            service.accept(event(200, 12));
            assertThat((List<?>)service.snapshot().get("incidents")).isEmpty();
            assertThat(service.snapshot().get("services").toString()).contains("NO_DATA", "TRAFFIC_OBSERVED");
        } finally { service.close(); }
    }
    @Test void backgroundLogErrorsBecomeIncidentsWithoutInflatingHttpRequestCounts() {
        var service = new DiagnosticsService(Optional.empty(), false, 2000);
        try {
            service.accept(new DiagnosticsController.Event("payment-service", "job-ref-1", "OTHER", "BillingWorker.logError", 500, 0, "IOException"));
            assertThat(service.snapshot().get("incidents").toString()).contains("LOG_ERROR", "BillingWorker.logError");
            assertThat(service.snapshot().get("services").toString()).doesNotContain("requests=1");
        } finally { service.close(); }
    }
    @Test void storageIsBoundedUnderSustainedTraffic() {
        var service = new DiagnosticsService(Optional.empty(), false, 2000);
        try {
            for (int i = 0; i < 6000; i++) service.accept(event(200, 12));
            assertThat(service.snapshot().get("services").toString()).contains("requests=5000").doesNotContain("requests=6000");
        } finally { service.close(); }
    }
    @Test void unknownServicesCannotAllocateUnlimitedBuckets() {
        var service = new DiagnosticsService(Optional.empty(), false, 2000);
        try {
            assertThatThrownBy(() -> service.accept(new DiagnosticsController.Event("untrusted", "id", "GET", "/", 200, 2)))
                    .isInstanceOf(IllegalArgumentException.class);
        } finally { service.close(); }
    }
    @Test void oldSamplesBecomeStaleThenExpire() {
        class MutableClock extends Clock {
            Instant now = Instant.parse("2026-10-25T00:00:00Z");
            public ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(ZoneId zone) { return this; }
            public Instant instant() { return now; }
        }
        var clock = new MutableClock();
        var service = new DiagnosticsService(Optional.empty(), false, 2000, clock);
        try {
            service.accept(event(200, 12)); clock.now = clock.now.plusSeconds(100);
            assertThat(service.snapshot().get("services").toString()).contains("STALE");
            clock.now = clock.now.plusSeconds(901);
            assertThat(service.snapshot().get("services").toString()).doesNotContain("STALE", "TRAFFIC_OBSERVED");
        } finally { service.close(); }
    }
}
