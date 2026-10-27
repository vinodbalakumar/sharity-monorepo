package com.java.vinod.platform.web.bff.config;

import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import static org.mockito.Mockito.*;

class DiagnosticLogBridgeTest {
    @Test void forwardsOnlyErrorMetadataAndTheExceptionCategory() {
        var publisher = mock(DiagnosticsPublisher.class);
        var bridge = new DiagnosticLogBridge(publisher);
        bridge.start();
        try (var ignored = MDC.putCloseable("correlationId", "background-ref-123")) {
            var logger = LoggerFactory.getLogger("com.java.vinod.example.BillingWorker");
            logger.info("Ordinary log content");
            logger.error("Private sample content must not be sent to diagnostics", new IllegalStateException("Private sample exception text"));
            verify(publisher).publish("background-ref-123", "OTHER", "BillingWorker.logError", 500, 0, "IllegalStateException");
            verifyNoMoreInteractions(publisher);
        } finally { bridge.close(); }
    }
}
