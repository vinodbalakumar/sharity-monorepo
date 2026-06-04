package com.java.vinod.authorization.server.enums;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum PlatformVerticalCode {
    MARKETPLACE,
    GROCERY,
    MEAT_SHOP,
    PHARMACY,
    AUTOMOTIVE,
    GIFT_CARDS,
    WALLET,
    PAYMENTS;

    private static final Set<String> SUPPORTED_CODES = Arrays.stream(values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    public static boolean isSupported(String moduleCode) {
        return moduleCode != null && SUPPORTED_CODES.contains(moduleCode.trim().toUpperCase());
    }
}
