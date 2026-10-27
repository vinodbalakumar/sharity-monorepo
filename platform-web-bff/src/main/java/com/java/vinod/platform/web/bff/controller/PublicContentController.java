package com.java.vinod.platform.web.bff.controller;

import com.java.vinod.platform.web.bff.dto.PublicContentDtos;
import com.java.vinod.platform.web.bff.service.PublicContentService;
import com.java.vinod.platform.web.bff.service.VisitorCountryResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicContentController {
    private final VisitorCountryResolver countryResolver;
    private final PublicContentService publicContentService;

    public PublicContentController(VisitorCountryResolver countryResolver, PublicContentService publicContentService) {
        this.countryResolver = countryResolver;
        this.publicContentService = publicContentService;
    }

    @GetMapping("/bff/public/context")
    public PublicContentDtos.VisitorContextResponse context(HttpServletRequest request,
                                                            @RequestParam(required = false) String countryCode,
                                                            @RequestParam(required = false) String locale) {
        return publicContentService.context(countryResolver.resolve(request, countryCode), locale);
    }

    @GetMapping("/bff/public/content/pages/{slug}")
    public PublicContentDtos.PublicContentPageResponse page(@PathVariable String slug,
                                                            HttpServletRequest request,
                                                            @RequestParam(required = false) String countryCode,
                                                            @RequestParam(required = false) String locale) {
        return publicContentService.page(slug, countryResolver.resolve(request, countryCode), locale);
    }

    @GetMapping("/api/public/legal/policies/{policyCode}")
    public PublicContentDtos.PublicLegalPolicyResponse policy(@PathVariable String policyCode,
                                                              HttpServletRequest request,
                                                              @RequestParam(required = false) String countryCode,
                                                              @RequestParam(required = false) String locale) {
        return publicContentService.policy(policyCode, countryResolver.resolve(request, countryCode), locale);
    }
}
