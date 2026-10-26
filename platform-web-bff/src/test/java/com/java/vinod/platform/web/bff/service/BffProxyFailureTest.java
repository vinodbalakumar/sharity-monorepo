package com.java.vinod.platform.web.bff.service;

import com.java.vinod.platform.web.bff.config.BffProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.mock.web.*;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.web.client.*;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class BffProxyFailureTest {
    @Test void downstreamServerErrorsAreSanitizedAndCorrelated() {
        var properties = mock(BffProperties.class, RETURNS_DEEP_STUBS);
        when(properties.backends().marketplaceService()).thenReturn("https://marketplace.example");
        var http = mock(RestTemplate.class);
        when(http.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(byte[].class)))
                .thenReturn(ResponseEntity.status(503).body("SQL password=secret".getBytes()));
        var proxy = new BffProxyService(properties, mock(OAuth2AuthorizedClientRepository.class), http);
        var request = new MockHttpServletRequest("GET", "/bff/public/marketplace-service/api/listings");
        request.setAttribute("X-Correlation-ID", "support-123");
        request.addHeader("X-Diagnostics-Token", "must-not-forward");
        var response = proxy.proxyPublic(request, new MockHttpServletResponse());
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(new String(response.getBody())).contains("SERVICE_UNAVAILABLE", "support-123").doesNotContain("SQL", "secret");
        verify(http).exchange(anyString(), any(HttpMethod.class), argThat((HttpEntity<?> entity) ->
                "support-123".equals(entity.getHeaders().getFirst("X-Correlation-ID")) && !entity.getHeaders().containsHeader("X-Diagnostics-Token")), eq(byte[].class));
    }
    @Test void connectionFailureReturnsUnavailableInsteadOfAnUnclassified500() {
        var properties = mock(BffProperties.class, RETURNS_DEEP_STUBS);
        when(properties.backends().marketplaceService()).thenReturn("https://marketplace.example");
        var http = mock(RestTemplate.class);
        when(http.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(byte[].class)))
                .thenThrow(new ResourceAccessException("private infrastructure"));
        var proxy = new BffProxyService(properties, mock(OAuth2AuthorizedClientRepository.class), http);
        assertThatThrownBy(() -> proxy.proxyPublic(new MockHttpServletRequest("GET", "/bff/public/marketplace-service/api/listings"), new MockHttpServletResponse()))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> {
                    assertThat(ex.getStatusCode().value()).isEqualTo(503);
                    assertThat(ex.getReason()).doesNotContain("private infrastructure");
                });
    }
}
