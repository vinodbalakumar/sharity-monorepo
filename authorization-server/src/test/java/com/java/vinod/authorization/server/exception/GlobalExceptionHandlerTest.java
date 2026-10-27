package com.java.vinod.authorization.server.exception;

import com.java.vinod.authorization.server.config.RequestCorrelationLoggingFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {
    @Test
    void problemDetailIncludesSafeCorrelationId() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setAttribute(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE, "trace-123");

        ProblemDetail detail = handler.handleAuthentication(new BadCredentialsException("bad credentials"), request);

        assertThat(detail.getProperties()).containsEntry("correlationId", "trace-123");
        assertThat(detail.getProperties()).containsEntry("errorCode", "UNAUTHORIZED");
    }
}
