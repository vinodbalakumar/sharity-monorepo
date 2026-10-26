package com.java.vinod.platform.ai;

import jakarta.annotation.PreDestroy;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.slf4j.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Metadata-based incident triage. AI output is advisory and cannot execute actions. */
@Service
class DiagnosticsService {
    private static final Logger log = LoggerFactory.getLogger(DiagnosticsService.class);
    private static final List<String> SERVICES = List.of("authorization-server", "marketplace-service", "payment-service",
            "wallet-service", "platform-web-bff", "tesla-dashboard-services", "platform-ai-service");
    private final Clock clock;
    private final long slowMs;
    private final ChatClient ai;
    private final boolean aiEnabled;
    private final Map<String, Deque<Sample>> samples = new LinkedHashMap<>();
    private final Deque<Incident> incidents = new ArrayDeque<>();
    private final Map<String, Instant> lastAnalysis = new HashMap<>();
    private long droppedAnalyses;
    private final ThreadPoolExecutor worker = new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(16), task -> { var t = new Thread(task, "incident-analysis"); t.setDaemon(true); return t; },
            new ThreadPoolExecutor.AbortPolicy());

    @org.springframework.beans.factory.annotation.Autowired
    DiagnosticsService(Optional<ChatModel> model, @Value("${app.diagnostics.ai-enabled:false}") boolean enabled,
                       @Value("${app.diagnostics.slow-ms:2000}") long slowMs) {
        this(model, enabled, slowMs, Clock.systemUTC());
    }
    DiagnosticsService(Optional<ChatModel> model, boolean enabled, long slowMs, Clock clock) {
        this.ai = model.map(ChatClient::create).orElse(null);
        this.aiEnabled = enabled && ai != null;
        this.slowMs = Math.max(100, slowMs);
        this.clock = clock;
        SERVICES.forEach(name -> samples.put(name, new ArrayDeque<>()));
    }
    record Sample(Instant time, int status, long ms) {}
    static final class Incident {
        public final String id = UUID.randomUUID().toString();
        public final Instant time;
        public final DiagnosticsController.Event event;
        public final String kind;
        public volatile String analysisStatus, explanation;
        Incident(Instant time, DiagnosticsController.Event event, String kind, String status) {
            this.time = time; this.event = event; this.kind = kind; this.analysisStatus = status;
            this.explanation = kind.equals("LOG_ERROR") ? "An application ERROR log was observed. Inspect the correlated logs for the recorded operation and exception category. No raw log content was sent to AI."
                    : kind.equals("SLOW_REQUEST")
                    ? "The request exceeded the configured latency threshold. Inspect its downstream spans, database timing and thread/connection pools. Timing alone does not establish the cause."
                    : "The service returned a server error. Inspect the correlated service logs and dependency spans. The cause has not been established.";
        }
    }
    synchronized void accept(DiagnosticsController.Event event) {
        Deque<Sample> bucket = samples.get(event.service());
        if (bucket == null) throw new IllegalArgumentException("Unknown service");
        Instant now = clock.instant();
        prune(bucket, now);
        if (!event.method().equals("OTHER")) bucket.addLast(new Sample(now, event.status(), event.durationMs()));
        while (bucket.size() > 5000) bucket.removeFirst();
        if (event.status() < 500 && event.durationMs() < slowMs) return;
        String kind = event.method().equals("OTHER") && event.route().endsWith(".logError") ? "LOG_ERROR" : event.status() >= 500 ? "SERVER_ERROR" : "SLOW_REQUEST";
        String fingerprint = event.service() + ":" + event.method() + ":" + event.route() + ":" + kind;
        // Bound incident volume and AI spend; metrics above still count every delivered request.
        lastAnalysis.entrySet().removeIf(e -> e.getValue().isBefore(now.minusSeconds(60)));
        if (lastAnalysis.containsKey(fingerprint)) return;
        if (lastAnalysis.size() >= 256) { droppedAnalyses++; return; }
        lastAnalysis.put(fingerprint, now);
        // Inference must not create more inference while the provider is already busy.
        boolean inferenceTraffic = event.service().equals("platform-ai-service")
                || (event.service().equals("platform-web-bff") && event.route().equals("/bff/ai/chat"));
        Incident incident = new Incident(now, event, kind, inferenceTraffic ? "NOT_REQUESTED" : aiEnabled ? "PENDING" : "DISABLED");
        if (inferenceTraffic) incident.explanation += " No additional model analysis is queued for AI inference traffic. Check provider latency, resource usage and correlated logs.";
        incidents.addFirst(incident);
        while (incidents.size() > 200) incidents.removeLast();
        log.warn("incident_detected id={} service={} correlationId={} status={} durationMs={} kind={}",
                incident.id, event.service(), event.correlationId(), event.status(), event.durationMs(), kind);
        if (aiEnabled && !inferenceTraffic) {
            try { worker.execute(() -> analyze(incident)); }
            catch (RejectedExecutionException ex) { incident.analysisStatus = "BUSY"; droppedAnalyses++; }
        }
    }
    private void analyze(Incident incident) {
        try {
            var event = incident.event;
            // Do not include identifiers, bodies, paths, log messages or model tools.
            String result = ai.prompt().system("""
                    You assist marketplace operators with read-only incident diagnosis.
                    Use only supplied measurements. Clearly label possible causes as hypotheses.
                    State that root cause cannot be established from these measurements alone.
                    Suggest at most three concrete checks using traces, database metrics and pool saturation.
                    Never recommend automatic retries of payments, disabling security, deleting data, or running commands.
                    Return plain text, at most 180 words. No HTML or Markdown links.
                    """
                    ).user("Service: " + event.service() + "; measurement: " + (event.method().equals("OTHER") ? "service operation " + event.route() : "HTTP request") + "; outcome status code: " + event.status()
                            + "; elapsed milliseconds: " + event.durationMs() + "; threshold: " + slowMs
                            + "; exception category: " + event.exceptionType()).call().content();
            if (result == null || result.isBlank() || result.length() > 3000) throw new IllegalStateException("Invalid analysis");
            incident.explanation = result.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]", "");
            incident.analysisStatus = "AVAILABLE";
        } catch (RuntimeException ex) {
            incident.analysisStatus = "UNAVAILABLE";
            log.warn("incident_ai_unavailable incidentId={} exceptionType={}", incident.id, ex.getClass().getSimpleName());
        }
    }
    synchronized Map<String, Object> snapshot() {
        Instant now = clock.instant();
        List<Map<String, Object>> services = new ArrayList<>();
        samples.forEach((name, bucket) -> {
            prune(bucket, now);
            var latencies = bucket.stream().mapToLong(Sample::ms).sorted().toArray();
            var last = bucket.peekLast();
            long errors = bucket.stream().filter(s -> s.status() >= 500).count();
            services.add(Map.of("service", name, "requests", bucket.size(), "errors", errors,
                    "p95Ms", latencies.length == 0 ? 0 : latencies[(int)Math.ceil(latencies.length * .95) - 1],
                    "lastSeen", last == null ? "" : last.time().toString(),
                    "state", last == null ? "NO_DATA" : last.time().isBefore(now.minusSeconds(90)) ? "STALE"
                            : errors > 0 ? "ERRORS_OBSERVED" : "TRAFFIC_OBSERVED"));
        });
        List<Map<String, Object>> recent = incidents.stream().filter(i -> i.time.isAfter(now.minusSeconds(3600))).map(i -> Map.<String,Object>of(
                "id", i.id, "time", i.time.toString(), "service", i.event.service(), "correlationId", i.event.correlationId(),
                "status", i.event.status(), "durationMs", i.event.durationMs(), "kind", i.kind,
                "analysisStatus", i.analysisStatus, "explanation", i.explanation,
                "operation", i.event.method().equals("OTHER") ? i.event.route() : "HTTP request")).toList();
        return Map.of("generatedAt", now.toString(), "windowSeconds", 900, "slowThresholdMs", slowMs,
                "aiEnabled", aiEnabled, "services", services, "incidents", recent, "droppedAnalyses", droppedAnalyses,
                "notice", "Best-effort delivered request samples, capped at 5000 per service in 15 minutes. Recent incidents are held in memory for up to one hour and reset on restart. No data does not mean healthy. Use retained centralized logs and traces for investigation.");
    }
    private void prune(Deque<Sample> bucket, Instant now) {
        while (!bucket.isEmpty() && bucket.peekFirst().time().isBefore(now.minusSeconds(900))) bucket.removeFirst();
    }
    @PreDestroy void close() { worker.shutdownNow(); }
}
