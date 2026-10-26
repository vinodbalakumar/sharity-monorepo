package com.java.vinod.payment.service.gateway;

import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import com.java.vinod.payment.service.repository.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentGatewaySafetyTest {
    PaymentGatewayRegistry registry(Map<String, PaymentGateway> gateways) {
        return new PaymentGatewayRegistry(gateways, mock(PaymentGatewayPolicyRepository.class), mock(PaymentProviderMasterRepository.class), "mock");
    }
    @Test void simulatedCapturesAreDisabledByDefault() {
        var adapter = mock(PaymentGateway.class);
        var registry = registry(Map.of("mock", adapter));
        assertThatThrownBy(() -> registry.capture("mock", "order-1", BigDecimal.TEN, "USD")).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(adapter);
    }
    @Test void demoConfigurationMustBeExplicit() {
        var adapter = mock(PaymentGateway.class);
        when(adapter.capture("order-1", BigDecimal.TEN, "USD")).thenReturn("demo-reference");
        var registry = registry(Map.of("mock", adapter));
        ReflectionTestUtils.setField(registry, "demoTransactionsEnabled", true);
        assertThat(registry.capture("mock", "order-1", BigDecimal.TEN, "USD")).isEqualTo("demo-reference");
    }
    @Test void unsupportedProviderCannotSilentlyFallBackToSimulation() {
        var adapter = mock(PaymentGateway.class);
        var registry = registry(Map.of("mock", adapter));
        ReflectionTestUtils.setField(registry, "demoTransactionsEnabled", true);
        assertThatThrownBy(() -> registry.capture("missing", "order-1", BigDecimal.TEN, "USD")).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(adapter);
    }
    @Test void unverifiedRealAdapterCannotBeEnabledByADemoFlag() {
        var adapter = mock(PaymentGateway.class);
        var registry = registry(Map.of("paypal-real", adapter));
        ReflectionTestUtils.setField(registry, "demoTransactionsEnabled", true);
        assertThatThrownBy(() -> registry.capture("paypal-real", "order-1", BigDecimal.TEN, "USD")).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(adapter);
    }
}
