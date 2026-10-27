package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.entity.CurrencyMaster;
import com.java.vinod.marketplace.service.repository.CurrencyMasterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MarketplaceCurrencyService {
    private static final Logger log = LoggerFactory.getLogger(MarketplaceCurrencyService.class);
    private final CurrencyMasterRepository currencyMasterRepository;
    private final RestClient restClient;
    private final String authorizationCountryUrl;
    private final String internalServiceToken;
    private final Map<String, String> countryCurrencyCache = new ConcurrentHashMap<>();

    public MarketplaceCurrencyService(CurrencyMasterRepository currencyMasterRepository,
                                      @Value("${app.services.authorization-country-url}") String authorizationCountryUrl,
                                      @Value("${app.internal.service-token}") String internalServiceToken) {
        this.currencyMasterRepository = currencyMasterRepository;
        this.restClient = RestClient.builder().build();
        this.authorizationCountryUrl = authorizationCountryUrl;
        this.internalServiceToken = internalServiceToken;
    }

    @Transactional(readOnly = true)
    public String resolveCurrencyCodeForCountry(String countryCode) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        if (normalizedCountry == null) {
            return null;
        }
        return countryCurrencyCache.computeIfAbsent(normalizedCountry, this::loadCountryCurrencyCode);
    }

    @Transactional(readOnly = true)
    public CurrencyView viewPrice(BigDecimal sourceAmount, String sourceCurrencyCode, String fulfillmentScope, String shopperCountryCode) {
        String safeSourceCurrency = normalizeCurrencyCode(sourceCurrencyCode);
        String safeFulfillmentScope = fulfillmentScope == null ? "NATIONAL" : fulfillmentScope.trim().toUpperCase();
        String targetCurrencyCode = "GLOBAL".equals(safeFulfillmentScope)
                ? resolveCurrencyCodeForCountry(shopperCountryCode)
                : null;
        if (targetCurrencyCode == null || targetCurrencyCode.isBlank()) {
            targetCurrencyCode = safeSourceCurrency;
        }

        BigDecimal displayAmount = convert(sourceAmount, safeSourceCurrency, targetCurrencyCode);
        return new CurrencyView(targetCurrencyCode, displayAmount);
    }

    @Transactional(readOnly = true)
    public BigDecimal convert(BigDecimal amount, String sourceCurrencyCode, String targetCurrencyCode) {
        if (amount == null) {
            return null;
        }
        String safeSourceCurrency = normalizeCurrencyCode(sourceCurrencyCode);
        String safeTargetCurrency = normalizeCurrencyCode(targetCurrencyCode);
        if (safeSourceCurrency == null || safeTargetCurrency == null || safeSourceCurrency.equals(safeTargetCurrency)) {
            return amount.setScale(2, RoundingMode.HALF_UP);
        }

        CurrencyMaster source = currencyMasterRepository.findById(safeSourceCurrency).orElse(null);
        CurrencyMaster target = currencyMasterRepository.findById(safeTargetCurrency).orElse(null);
        if (source == null || target == null || !source.isActive() || !target.isActive()) {
            log.warn("Currency conversion fallback used because master data is missing: source={}, target={}", safeSourceCurrency, safeTargetCurrency);
            return amount.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal amountInUsd = amount.multiply(source.getUsdExchangeRate());
        BigDecimal converted = amountInUsd.divide(target.getUsdExchangeRate(), 2, RoundingMode.HALF_UP);
        return converted;
    }

    private String loadCountryCurrencyCode(String countryCode) {
        if (authorizationCountryUrl == null || authorizationCountryUrl.isBlank() || internalServiceToken == null || internalServiceToken.isBlank()) {
            return null;
        }
        try {
            CountryLookupResponse response = restClient.get()
                    .uri(authorizationCountryUrl + "/supported-countries/" + countryCode)
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .retrieve()
                    .body(CountryLookupResponse.class);
            if (response == null || response.defaultCurrencyCode() == null || response.defaultCurrencyCode().isBlank()) {
                return null;
            }
            return normalizeCurrencyCode(response.defaultCurrencyCode());
        } catch (RestClientException exception) {
            log.warn("Unable to resolve shopper currency for countryCode={}", countryCode, exception);
            return null;
        }
    }

    private String normalizeCountryCode(String requested) {
        if (requested == null || requested.isBlank()) {
            return null;
        }
        String normalized = requested.trim().toUpperCase();
        return switch (normalized) {
            case "US", "USA" -> "USA";
            case "CA", "CAN" -> "CAN";
            case "GB", "UK", "GBR" -> "GBR";
            case "IN", "IND" -> "IND";
            case "AU", "AUS" -> "AUS";
            case "DE", "DEU" -> "DEU";
            case "FR", "FRA" -> "FRA";
            case "ES", "ESP" -> "ESP";
            case "MX", "MEX" -> "MEX";
            case "JP", "JPN" -> "JPN";
            case "KR", "KOR" -> "KOR";
            case "AE", "ARE" -> "ARE";
            default -> normalized;
        };
    }

    private String normalizeCurrencyCode(String requested) {
        if (requested == null || requested.isBlank()) {
            return null;
        }
        return requested.trim().toUpperCase();
    }

    public record CurrencyView(String displayCurrencyCode, BigDecimal displayPriceAmount) {
    }

    private record CountryLookupResponse(String countryCode, String countryName, String phoneDialCode,
                                         String defaultCurrencyCode) {
    }
}
