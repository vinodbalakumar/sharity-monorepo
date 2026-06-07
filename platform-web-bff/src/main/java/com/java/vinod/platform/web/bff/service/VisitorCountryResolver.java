package com.java.vinod.platform.web.bff.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class VisitorCountryResolver {
    private static final String DEFAULT_COUNTRY = "US";
    private static final Map<String, String> COUNTRY_NAMES = Map.of(
            "US", "United States",
            "IN", "India",
            "CA", "Canada",
            "GB", "United Kingdom",
            "AU", "Australia"
    );
    private static final Set<String> TRUSTED_COUNTRY_HEADERS = Set.of(
            "CF-IPCountry",
            "CloudFront-Viewer-Country",
            "X-Vercel-IP-Country",
            "X-AppEngine-Country",
            "X-Country-Code"
    );

    public VisitorCountry resolve(HttpServletRequest request, String requestedCountryCode) {
        String explicit = normalizeCountry(requestedCountryCode);
        if (explicit != null) {
            return country(explicit, "query");
        }

        for (String header : TRUSTED_COUNTRY_HEADERS) {
            String value = normalizeCountry(request.getHeader(header));
            if (value != null && !"XX".equals(value) && !"T1".equals(value)) {
                return country(value, "header:" + header);
            }
        }

        String acceptLanguageCountry = countryFromAcceptLanguage(request.getHeader("Accept-Language"));
        if (acceptLanguageCountry != null) {
            return country(acceptLanguageCountry, "accept-language");
        }

        return country(DEFAULT_COUNTRY, "default");
    }

    public String normalizeCountry(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return normalized.matches("[A-Z]{2}") ? normalized : null;
    }

    private VisitorCountry country(String countryCode, String source) {
        return new VisitorCountry(
                countryCode,
                COUNTRY_NAMES.getOrDefault(countryCode, countryCode),
                source,
                COUNTRY_NAMES.containsKey(countryCode)
        );
    }

    private String countryFromAcceptLanguage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (String token : value.split(",")) {
            String languageTag = token.split(";")[0].trim();
            Locale locale = Locale.forLanguageTag(languageTag);
            String country = normalizeCountry(locale.getCountry());
            if (country != null) {
                return country;
            }
        }
        return null;
    }

    public record VisitorCountry(String countryCode, String countryName, String source, boolean supported) {
    }
}
