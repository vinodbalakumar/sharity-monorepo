"""Keep standalone service diagnostics consistent without cross-repository build coupling."""
from pathlib import Path

from workspace_paths import workspace_root
ROOT = workspace_root()
SERVICES = ['authorization-server', 'marketplace-service', 'payment-service', 'wallet-service',
            'platform-web-bff', 'tesla-dashboard-services', 'platform-ai-service']

FILTER = r'''package PACKAGE;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

/** Request metadata only: never log query strings, bodies, credentials or concrete resource IDs. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestCorrelationLoggingFilter.class);
    public static final String CORRELATION_ID_ATTRIBUTE = "X-Correlation-ID";
    @Autowired(required = false) private DiagnosticsPublisher diagnostics;

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                              FilterChain chain) throws ServletException, IOException {
        String incoming = request.getHeader(CORRELATION_ID_ATTRIBUTE);
        String id = incoming != null && incoming.trim().matches("[A-Za-z0-9_-]{1,64}")
                ? incoming.trim() : UUID.randomUUID().toString();
        request.setAttribute(CORRELATION_ID_ATTRIBUTE, id);
        response.setHeader(CORRELATION_ID_ATTRIBUTE, id);
        long start = System.nanoTime();
        boolean failed = false;
        try (var ignored = MDC.putCloseable("correlationId", id)) {
            try { chain.doFilter(request, response); }
            catch (ServletException | IOException | RuntimeException ex) {
                failed = true;
                request.setAttribute("diagnosticExceptionType", ex.getClass().getSimpleName());
                // Exception messages may contain SQL, tokens or customer content.
                log.error("request_exception correlationId={} exceptionType={}", id, ex.getClass().getSimpleName());
                throw ex;
            } finally {
                long ms = (System.nanoTime() - start) / 1_000_000;
                int status = failed ? 500 : response.getStatus();
                Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                String route = pattern == null ? "unmapped" : pattern.toString();
                if (!route.matches("[A-Za-z0-9/{}_*.-]{1,180}")) route = "unmapped";
                String method = request.getMethod().matches("GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS") ? request.getMethod() : "OTHER";
                log.info("request_completed correlationId={} method={} route={} status={} durationMs={}", id, method, route, status, ms);
                if (diagnostics != null && !request.getRequestURI().contains("/actuator/")
                        && !request.getRequestURI().contains("/diagnostics")) {
                    Object exception = request.getAttribute("diagnosticExceptionType");
                    String type = exception != null && exception.toString().matches("[A-Za-z0-9_]{1,80}") ? exception.toString() : "NONE";
                    diagnostics.publish(id, method, route, status, ms, type);
                }
            }
        }
    }
}
'''

PUBLISHER = r'''package PACKAGE;

import jakarta.annotation.PreDestroy;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Bounded best-effort delivery, separate from the request thread. Never retries customer operations. */
@Component
public class DiagnosticsPublisher {
    private static final Logger log = LoggerFactory.getLogger(DiagnosticsPublisher.class);
    private final String service, token;
    private final URI endpoint;
    private final boolean enabled;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    private final AtomicLong dropped = new AtomicLong();
    private final ThreadPoolExecutor sender = new ThreadPoolExecutor(1, 1, 30, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(128), task -> { var t = new Thread(task, "diagnostics-sender"); t.setDaemon(true); return t; },
            new ThreadPoolExecutor.AbortPolicy());

    public DiagnosticsPublisher(@Value("${spring.application.name:__SERVICE__}") String service,
            @Value("${app.diagnostics.enabled:false}") boolean enabled,
            @Value("${app.diagnostics.url:http://localhost:8086/internal/diagnostics/events}") String url,
            @Value("${app.diagnostics.token:}") String token) {
        this.service = "__SERVICE__"; // Stable allowlisted identity, independent of display name.
        this.endpoint = URI.create(url);
        this.token = token;
        this.enabled = enabled && token.length() >= 32;
        if (enabled && !this.enabled) throw new IllegalArgumentException("Diagnostics requires a token of at least 32 characters");
        if (enabled && !("https".equals(endpoint.getScheme()) || ("http".equals(endpoint.getScheme())
                && java.util.Set.of("localhost", "127.0.0.1", "::1").contains(endpoint.getHost())))) {
            throw new IllegalArgumentException("Diagnostics requires HTTPS outside loopback");
        }
    }
    public void publish(String id, String method, String route, int status, long durationMs, String exceptionType) {
        if (!enabled) return;
        String json = "{\"service\":\"" + service + "\",\"correlationId\":\"" + id
                + "\",\"method\":\"" + method + "\",\"route\":\"" + route
                + "\",\"status\":" + status + ",\"durationMs\":" + durationMs + ",\"exceptionType\":\"" + exceptionType + "\"}";
        try { sender.execute(() -> {
            try {
                var result = http.send(HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(3))
                        .header("Content-Type", "application/json").header("X-Diagnostics-Token", token)
                        .POST(HttpRequest.BodyPublishers.ofString(json)).build(), HttpResponse.BodyHandlers.discarding());
                if (result.statusCode() != 202) drop();
            } catch (InterruptedException ex) { Thread.currentThread().interrupt(); drop(); }
            catch (Exception ex) { drop(); }
        }); } catch (RejectedExecutionException ex) { drop(); }
    }
    private void drop() {
        long count = dropped.incrementAndGet();
        if (count == 1 || count % 100 == 0) log.warn("diagnostics_delivery_dropped service={} total={}", service, count);
    }
    @PreDestroy public void close() { sender.shutdownNow(); http.close(); }
}
'''

ADVICE = r'''package PACKAGE;

import java.util.Map;
import org.slf4j.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;

/** Fallback for unhandled application errors; existing domain handlers retain their contracts. */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class SafeFailureAdvice {
    private static final Logger log = LoggerFactory.getLogger(SafeFailureAdvice.class);
    @ExceptionHandler({org.springframework.web.bind.MethodArgumentNotValidException.class,
            org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
            jakarta.validation.ConstraintViolationException.class})
    ResponseEntity<?> invalid(Exception ex, HttpServletRequest request) { return error(400, request, ex); }
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    ResponseEntity<?> denied(Exception ex, HttpServletRequest request) { return error(403, request, ex); }
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException ex, HttpServletRequest request) {
        return error(ex.getStatusCode().value(), request, ex);
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception ex, HttpServletRequest request) { return error(500, request, ex); }
    private ResponseEntity<?> error(int status, HttpServletRequest request, Exception ex) {
        request.setAttribute("diagnosticExceptionType", ex.getClass().getSimpleName());
        String id = String.valueOf(request.getAttribute("X-Correlation-ID"));
        log.warn("application_error correlationId={} status={} exceptionType={}", id, status, ex.getClass().getSimpleName());
        String code = status >= 500 ? "SERVICE_UNAVAILABLE" : status == 404 ? "NOT_FOUND" : status == 403 ? "ACCESS_DENIED" : "REQUEST_REJECTED";
        String message = status >= 500 ? "This service is temporarily unavailable. Please try again shortly."
                : status == 404 ? "The requested item could not be found."
                : status == 403 ? "You do not have permission to perform this action." : "Please check your request and try again.";
        return ResponseEntity.status(status).body(Map.of("code", code, "message", message, "correlationId", id));
    }
}
'''

OPERATIONS = r'''package PACKAGE;

import io.micrometer.observation.*;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.*;
import org.springframework.stereotype.Component;

/** Fixed operation names only; method arguments, results, SQL and exception messages are excluded. */
@Aspect @Component
public class OperationTimingAspect {
    private static final Logger log = LoggerFactory.getLogger(OperationTimingAspect.class);
    private final ObservationRegistry registry;
    private final DiagnosticsPublisher diagnostics;
    private final long slowMs;
    public OperationTimingAspect(ObservationRegistry registry, DiagnosticsPublisher diagnostics,
            @org.springframework.beans.factory.annotation.Value("${app.diagnostics.slow-ms:2000}") long slowMs) {
        this.registry = registry; this.diagnostics = diagnostics; this.slowMs = Math.max(100, slowMs);
    }
    @Around("@within(org.springframework.stereotype.Service) && execution(public * *(..))")
    public Object time(ProceedingJoinPoint point) throws Throwable {
        String operation = point.getSignature().getDeclaringType().getSimpleName() + "." + point.getSignature().getName();
        Observation observation = Observation.createNotStarted("sharity.operation", registry)
                .lowCardinalityKeyValue("operation", operation).start();
        long start = System.nanoTime();
        String failure = "NONE";
        int status = 200;
        try (var ignored = observation.openScope()) {
            try { return point.proceed(); }
            catch (Throwable ex) {
                failure = ex.getClass().getSimpleName();
                status = ex instanceof org.springframework.web.ErrorResponse error ? error.getStatusCode().value()
                        : ex instanceof org.springframework.security.access.AccessDeniedException ? 403 : 500;
                // Record only the exception category, avoiding messages in exported span events.
                observation.lowCardinalityKeyValue("outcome", "error");
                log.warn("operation_failed operation={} correlationId={} exceptionType={}", operation,
                        MDC.get("correlationId"), ex.getClass().getSimpleName());
                throw ex;
            } finally {
                long ms = (System.nanoTime() - start) / 1_000_000;
                if (ms >= slowMs) log.warn("slow_operation operation={} correlationId={} durationMs={}", operation, MDC.get("correlationId"), ms);
                if ((status >= 500 || ms >= slowMs) && operation.matches("[A-Za-z0-9_.]{1,180}")) {
                    String id = MDC.get("correlationId");
                    if (id == null || !id.matches("[A-Za-z0-9_-]{1,64}")) id = java.util.UUID.randomUUID().toString();
                    diagnostics.publish(id, "OTHER", operation, status, ms,
                            failure.matches("[A-Za-z0-9_]{1,80}") ? failure : "UnknownException");
                }
                observation.stop();
            }
        }
    }
}
'''

LOGS = r'''package PACKAGE;

import ch.qos.logback.classic.*;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.*;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Classifies application ERROR logs without copying their messages or arguments to AI. */
@Component
public class DiagnosticLogBridge {
    private final DiagnosticsPublisher diagnostics;
    private AppenderBase<ILoggingEvent> appender;
    private Logger root;
    public DiagnosticLogBridge(DiagnosticsPublisher diagnostics) { this.diagnostics = diagnostics; }
    @PostConstruct public void start() {
        if (!(LoggerFactory.getILoggerFactory() instanceof LoggerContext context)) return;
        root = context.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
        appender = new AppenderBase<>() {
            @Override protected void append(ILoggingEvent event) {
                String logger = event.getLoggerName();
                if (!event.getLevel().isGreaterOrEqual(Level.ERROR) || logger == null || !logger.startsWith("com.java.vinod.")) return;
                String operation = logger.substring(logger.lastIndexOf('.') + 1) + ".logError";
                if (!operation.matches("[A-Za-z0-9_.]{1,180}")) return;
                String id = event.getMDCPropertyMap().get("correlationId");
                if (id == null || !id.matches("[A-Za-z0-9_-]{1,64}")) id = java.util.UUID.randomUUID().toString();
                var cause = event.getThrowableProxy();
                for (int depth = 0; cause != null && cause.getCause() != null && depth < 8; depth++) cause = cause.getCause();
                String category = cause == null ? "LoggedError" : cause.getClassName().substring(cause.getClassName().lastIndexOf('.') + 1);
                if (!category.matches("[A-Za-z0-9_]{1,80}")) category = "LoggedError";
                // Do not call getFormattedMessage(), getArgumentArray() or ThrowableProxy.getMessage().
                diagnostics.publish(id, "OTHER", operation, 500, 0, category);
            }
        };
        appender.setContext(context); appender.setName("sharity-diagnostic-metadata"); appender.start(); root.addAppender(appender);
    }
    @PreDestroy public void close() { if (root != null && appender != null) { root.detachAppender(appender); appender.stop(); } }
}
'''

for name in SERVICES:
    java = ROOT / name / 'src/main/java'
    existing = list(java.rglob('RequestCorrelationLoggingFilter.java'))
    if existing:
        dest = existing[0].parent
    else:
        app = next(java.rglob('*Application.java'))
        dest = app.parent / 'diagnostics'
    dest.mkdir(parents=True, exist_ok=True)
    package = '.'.join(dest.relative_to(java).parts)
    for filename, template in [('RequestCorrelationLoggingFilter.java', FILTER), ('DiagnosticsPublisher.java', PUBLISHER), ('SafeFailureAdvice.java', ADVICE), ('OperationTimingAspect.java', OPERATIONS), ('DiagnosticLogBridge.java', LOGS)]:
        (dest / filename).write_text(template.replace('PACKAGE', package).replace('__SERVICE__', name), encoding='utf-8')
    props = ROOT / name / 'src/main/resources/application.properties'
    text = props.read_text(encoding='utf-8')
    if '# Shared diagnostic delivery' not in text:
        text += '\n# Shared diagnostic delivery: metadata only; no AI calls on customer request threads.\napp.diagnostics.enabled=${DIAGNOSTICS_ENABLED:false}\napp.diagnostics.url=${DIAGNOSTICS_URL:http://localhost:8086/internal/diagnostics/events}\napp.diagnostics.token=${DIAGNOSTICS_TOKEN:}\nserver.error.include-message=never\nserver.error.include-stacktrace=never\n'
    props.write_text(text, encoding='utf-8')
    if 'app.diagnostics.slow-ms=' not in text:
        text += '\napp.diagnostics.slow-ms=${DIAGNOSTICS_SLOW_MS:2000}\n'
        props.write_text(text, encoding='utf-8')
    pom = ROOT / name / 'pom.xml'
    xml = pom.read_text(encoding='utf-8')
    if '<opentelemetry.version>' not in xml:
        xml = xml.replace('<properties>', '<properties>\n        <opentelemetry.version>1.62.0</opentelemetry.version>', 1)
    dependencies = [('org.springframework.boot', 'spring-boot-starter-actuator'), ('org.springframework.boot', 'spring-boot-starter-opentelemetry'),
                    ('org.springframework', 'spring-aop'), ('org.aspectj', 'aspectjweaver')]
    for group, artifact in dependencies:
        if '<artifactId>' + artifact + '</artifactId>' not in xml:
            # Insert into application dependencies, never the BOM's dependencyManagement block.
            index = xml.index('<dependencies>', xml.index('</dependencyManagement>') if '</dependencyManagement>' in xml else 0) + len('<dependencies>')
            xml = xml[:index] + '\n        <dependency><groupId>' + group + '</groupId><artifactId>' + artifact + '</artifactId></dependency>' + xml[index:]
    pom.write_text(xml, encoding='utf-8')
    if '# Optional trace export' not in text:
        text += '\n# Optional trace export; configure a private collector before enabling.\nmanagement.tracing.sampling.probability=${TRACING_SAMPLE_PROBABILITY:0.1}\nmanagement.tracing.export.otlp.enabled=${OTEL_EXPORT_ENABLED:false}\nmanagement.opentelemetry.tracing.export.otlp.endpoint=${OTEL_TRACES_ENDPOINT:http://localhost:4318/v1/traces}\nlogging.structured.format.console=logstash\n'
        props.write_text(text, encoding='utf-8')
    text = props.read_text(encoding='utf-8').replace('management.opentelemetry.tracing.export.otlp.enabled=', 'management.tracing.export.otlp.enabled=')
    if 'management.otlp.metrics.export.enabled=' not in text:
        text += '\nmanagement.otlp.metrics.export.enabled=${OTEL_EXPORT_ENABLED:false}\nmanagement.otlp.metrics.export.url=${OTEL_METRICS_ENDPOINT:http://localhost:4318/v1/metrics}\nmanagement.logging.export.otlp.enabled=${OTEL_EXPORT_ENABLED:false}\nmanagement.opentelemetry.logging.export.otlp.endpoint=${OTEL_LOGS_ENDPOINT:http://localhost:4318/v1/logs}\n'
    props.write_text(text, encoding='utf-8')
print('Installed metadata diagnostics in', len(SERVICES), 'services')
