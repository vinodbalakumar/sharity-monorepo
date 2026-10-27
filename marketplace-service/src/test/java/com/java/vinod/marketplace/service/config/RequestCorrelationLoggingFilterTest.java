package com.java.vinod.marketplace.service.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RequestCorrelationLoggingFilterTest {
    @Test
    void reusesIncomingCorrelationIdAndReturnsItInTheResponse() throws Exception {
        RequestCorrelationLoggingFilter filter = new RequestCorrelationLoggingFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/marketplace-service/api/v1/marketplace/verticals");
        request.addHeader(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE, "trace-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE)).isEqualTo("trace-123");
        assertThat(request.getAttribute(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE)).isEqualTo("trace-123");
    }
}
