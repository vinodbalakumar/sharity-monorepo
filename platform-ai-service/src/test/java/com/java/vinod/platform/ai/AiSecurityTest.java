package com.java.vinod.platform.ai;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.*;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = AiSecurityTest.Config.class)
@TestPropertySource(properties = {"app.jwt.jwk-set-uri=https://identity.example/jwks", "app.jwt.issuer=https://identity.example", "app.jwt.audience=auth-clients"})
class AiSecurityTest {
    @Configuration @EnableWebMvc @EnableWebSecurity @Import(AiSecurityConfig.class)
    static class Config {
        @Bean ListingDraftController drafts() { return new ListingDraftController(Optional.empty(), false); }
    }
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    @BeforeEach void setup() { mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build(); }

    @Test void anonymousCannotGenerate() throws Exception {
        mvc.perform(post("/api/v1/ai/listing-draft").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Gift card\",\"details\":\"Unused\"}"))
                .andExpect(status().isUnauthorized());
    }
    @Test void ordinaryUsersCannotManageFounderContent() throws Exception {
        mvc.perform(get("/api/ai/admin/founder/posts").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isForbidden());
    }
    @Test void buyerCannotGenerate() throws Exception {
        mvc.perform(post("/api/v1/ai/listing-draft").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Gift card\",\"details\":\"Unused\"}"))
                .andExpect(status().isForbidden());
    }
    @Test void sellerGetsUnavailableWhileDisabled() throws Exception {
        mvc.perform(post("/api/v1/ai/listing-draft").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Gift card\",\"details\":\"Unused\"}"))
                .andExpect(status().isServiceUnavailable());
    }
    @Test void malformedSellerInputIsRejected() throws Exception {
        mvc.perform(post("/api/v1/ai/listing-draft").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\",\"details\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}
