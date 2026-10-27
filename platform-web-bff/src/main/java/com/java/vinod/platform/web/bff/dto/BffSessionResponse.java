package com.java.vinod.platform.web.bff.dto;

import java.util.List;

public record BffSessionResponse(
        boolean authenticated,
        String publicId,
        String email,
        String name,
        String phone,
        List<String> roles,
        List<String> applications,
        String csrfToken
) {}
