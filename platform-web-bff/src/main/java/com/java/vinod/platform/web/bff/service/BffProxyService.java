package com.java.vinod.platform.web.bff.service;

import com.java.vinod.platform.web.bff.config.BffProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class BffProxyService {
    private static final String REGISTRATION_ID = "sharity-web-bff";
    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            HttpHeaders.CONNECTION,
            "Keep-Alive",
            HttpHeaders.PROXY_AUTHENTICATE,
            HttpHeaders.PROXY_AUTHORIZATION,
            HttpHeaders.TE,
            HttpHeaders.TRAILER,
            HttpHeaders.TRANSFER_ENCODING,
            HttpHeaders.UPGRADE,
            HttpHeaders.CONTENT_LENGTH
    );

    private final BffProperties properties;
    private final OAuth2AuthorizedClientRepository authorizedClientRepository;
    private final RestTemplate restTemplate;

    public BffProxyService(BffProperties properties,
                           OAuth2AuthorizedClientRepository authorizedClientRepository,
                           RestTemplate restTemplate) {
        this.properties = properties;
        this.authorizedClientRepository = authorizedClientRepository;
        this.restTemplate = restTemplate;
        this.restTemplate.setErrorHandler(new NoOpErrorHandler());
    }

    public ResponseEntity<byte[]> proxy(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        String bearerToken = bearerToken(request, response, authentication);
        String path = request.getRequestURI().substring("/bff/api/".length());
        int slash = path.indexOf('/');
        if (slash < 0) {
            throw new ResponseStatusException(NOT_FOUND, "Missing backend route");
        }
        String serviceKey = path.substring(0, slash);
        String backendBase = backendBase(serviceKey);
        String backendPath = path.substring(slash);
        String query = request.getQueryString();
        String target = backendBase + backendPath + (query == null ? "" : "?" + query);

        HttpHeaders headers = new HttpHeaders();
        request.getHeaderNames().asIterator().forEachRemaining(header -> {
                if (!HttpHeaders.AUTHORIZATION.equalsIgnoreCase(header)
                        && !HttpHeaders.COOKIE.equalsIgnoreCase(header)
                        && !HttpHeaders.CONTENT_LENGTH.equalsIgnoreCase(header)
                        && !HttpHeaders.HOST.equalsIgnoreCase(header)) {
                headers.add(header, request.getHeader(header));
                }
            });
        headers.setBearerAuth(bearerToken);
        if (headers.get(HttpHeaders.ACCEPT) == null) {
            headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        }
        byte[] body = readBody(request);
        HttpEntity<byte[]> entity = allowsRequestBody(request.getMethod()) && body.length > 0
                ? new HttpEntity<>(body, headers)
                : new HttpEntity<>(headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod());
        ResponseEntity<byte[]> backendResponse = restTemplate.exchange(target, method, entity, byte[].class);
        return ResponseEntity.status(backendResponse.getStatusCode())
                .headers(responseHeaders -> backendResponse.getHeaders().forEach((key, values) -> {
                    if (!HttpHeaders.SET_COOKIE.equalsIgnoreCase(key)
                            && HOP_BY_HOP_HEADERS.stream().noneMatch(header -> header.equalsIgnoreCase(key))) {
                        responseHeaders.put(key, values);
                    }
                }))
                .body(backendResponse.getBody());
    }

    private String bearerToken(HttpServletRequest request,
                               HttpServletResponse response,
                               Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauth2Token) {
            OAuth2AuthorizedClient client = authorizedClientRepository.loadAuthorizedClient(
                    REGISTRATION_ID, oauth2Token, request);
            if (client == null || client.getAccessToken() == null) {
                throw new ResponseStatusException(UNAUTHORIZED, "Login required");
            }
            OAuth2AccessToken token = client.getAccessToken();
            if (token.getTokenValue() == null || token.getTokenValue().isBlank()) {
                throw new ResponseStatusException(UNAUTHORIZED, "Login required");
            }
            return token.getTokenValue();
        }
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof Jwt jwt) {
            if (jwt.getTokenValue() == null || jwt.getTokenValue().isBlank()) {
                throw new ResponseStatusException(UNAUTHORIZED, "Login required");
            }
            return jwt.getTokenValue();
        }
        throw new ResponseStatusException(UNAUTHORIZED, "Login required");
    }

    private String backendBase(String serviceKey) {
        return switch (serviceKey) {
            case "authorization-server" -> properties.backends().authorizationServer();
            case "marketplace-service" -> properties.backends().marketplaceService();
            case "payment-service" -> properties.backends().paymentService();
            case "wallet-service" -> properties.backends().walletService();
            default -> throw new ResponseStatusException(NOT_FOUND, "Unknown backend service");
        };
    }

    private byte[] readBody(HttpServletRequest request) {
        try {
            return StreamUtils.copyToByteArray(request.getInputStream());
        } catch (Exception exception) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Unable to read request body", exception);
        }
    }

    private boolean allowsRequestBody(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }

    private boolean isMultipart(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.toLowerCase().startsWith(MediaType.MULTIPART_FORM_DATA_VALUE);
    }

    private static final class NoOpErrorHandler extends DefaultResponseErrorHandler {
        @Override
        public boolean hasError(ClientHttpResponse response) throws IOException {
            return false;
        }
    }
}
