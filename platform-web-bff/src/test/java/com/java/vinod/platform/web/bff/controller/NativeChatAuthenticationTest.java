package com.java.vinod.platform.web.bff.controller;

import com.java.vinod.platform.web.bff.security.SharityAccessTokenAuthenticationFilter;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.*;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class NativeChatAuthenticationTest {
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void nativeBearerCreatesVerifiedIdentityWithExistingRolePrefix() throws Exception {
        var decoder=mock(JwtDecoder.class);
        var jwt=Jwt.withTokenValue("native-token").header("alg","RS256").issuer("https://identity.example").subject("buyer").claim("roles",List.of("ROLE_CUSTOMER")).build();
        when(decoder.decode("native-token")).thenReturn(jwt);
        var request=new MockHttpServletRequest("GET","/bff/ai/conversations");request.addHeader("Authorization","Bearer native-token");
        new SharityAccessTokenAuthenticationFilter(decoder).doFilter(request,new MockHttpServletResponse(),(req,res)->{
            var auth=SecurityContextHolder.getContext().getAuthentication();assertEquals(jwt,auth.getPrincipal());
            assertEquals("ROLE_CUSTOMER",auth.getAuthorities().iterator().next().getAuthority());
        });
        verify(decoder).decode("native-token");
    }
    @Test void invalidBearerCannotSilentlyBecomeAGuest() throws Exception {
        var decoder=mock(JwtDecoder.class);when(decoder.decode("expired")).thenThrow(new BadJwtException("expired"));
        var request=new MockHttpServletRequest("POST","/bff/ai/chat");request.addHeader("Authorization","Bearer expired");
        var response=new MockHttpServletResponse();
        new SharityAccessTokenAuthenticationFilter(decoder).doFilter(request,response,(req,res)->fail("Invalid bearer continued"));
        assertEquals(401,response.getStatus());assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
