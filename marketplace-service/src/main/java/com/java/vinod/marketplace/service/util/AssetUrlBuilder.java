package com.java.vinod.marketplace.service.util;

import org.springframework.stereotype.Component;

@Component
public class AssetUrlBuilder {
    private static final String DEFAULT_CDN_BASE_URL = "https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev";

    public String buildUrl(String imageKey) {
        if (imageKey == null || imageKey.isBlank()) {
            return null;
        }
        return DEFAULT_CDN_BASE_URL + "/" + imageKey;
    }

    public String buildUrl(String imageKey, String cdnBaseUrl) {
        if (imageKey == null || imageKey.isBlank()) {
            return null;
        }
        String baseUrl = cdnBaseUrl != null && !cdnBaseUrl.isBlank()
            ? cdnBaseUrl
            : DEFAULT_CDN_BASE_URL;
        return baseUrl + "/" + imageKey;
    }
}
