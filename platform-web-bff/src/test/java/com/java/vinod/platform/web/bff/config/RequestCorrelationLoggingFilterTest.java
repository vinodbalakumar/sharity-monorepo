package com.java.vinod.platform.web.bff.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RequestCorrelationLoggingFilterTest {
    @Test void rejectsUnboundedAndUnsafeIncomingReferences() throws Exception {
        for (String supplied : new String[]{"x".repeat(1000), "user@example.com", "trace\r\nInjected: value"}) {
            var request = new MockHttpServletRequest("GET", "/bff/login");
            request.addHeader("X-Correlation-ID", supplied);
            var response = new MockHttpServletResponse();
            new RequestCorrelationLoggingFilter().doFilter(request, response, new MockFilterChain());
            assertThat(response.getHeader("X-Correlation-ID")).matches("[A-Za-z0-9_-]{1,64}").isNotEqualTo(supplied);
        }
    }
    @Test
    void reusesIncomingCorrelationIdAndReturnsItInTheResponse() throws Exception {
        RequestCorrelationLoggingFilter filter = new RequestCorrelationLoggingFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/bff/login");
        request.addHeader(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE, "trace-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE)).isEqualTo("trace-123");
        assertThat(request.getAttribute(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE)).isEqualTo("trace-123");
    }
}
