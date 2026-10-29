package com.java.vinod.wallet.service.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class InternalServiceTokenFilterTest {
    @Test
    void rejectsMissingConfigurationAtStartup() {
        for (String token : new String[] {null, "", " \t "}) {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> new InternalServiceTokenFilter(token))
                    .withMessageContaining("app.internal.service-token must not be blank");
        }
    }

    @Test
    void rejectsInternalRequestWithoutToken() throws Exception {
        InternalServiceTokenFilter filter = new InternalServiceTokenFilter("secret");
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/wallet-service/internal/api/v1/demo");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void allowsInternalRequestWithToken() throws Exception {
        InternalServiceTokenFilter filter = new InternalServiceTokenFilter("secret");
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/wallet-service/internal/api/v1/demo");
        request.addHeader("X-Internal-Service-Token", "secret");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
    }
}
