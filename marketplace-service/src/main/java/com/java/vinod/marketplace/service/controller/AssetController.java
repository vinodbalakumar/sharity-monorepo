package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.AssetDtos;
import com.java.vinod.marketplace.service.service.AssetStorageService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/marketplace")
public class AssetController {
    private final AssetStorageService assetStorageService;

    public AssetController(AssetStorageService assetStorageService) {
        this.assetStorageService = assetStorageService;
    }

    @PostMapping(value = "/provider/listings/{listingPublicId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AssetDtos.ImageAssetResponse uploadSellerListingImage(@PathVariable String listingPublicId,
                                                                 @RequestPart("file") MultipartFile file,
                                                                 @RequestParam(required = false) String altText,
                                                                 @AuthenticationPrincipal Jwt jwt) {
        return assetStorageService.uploadSellerListingImage(listingPublicId, file, altText, jwt);
    }

    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AssetDtos.ImageAssetResponse uploadProfileImage(@RequestPart("file") MultipartFile file,
                                                           @RequestParam(required = false) String altText,
                                                           @AuthenticationPrincipal Jwt jwt) {
        return assetStorageService.uploadProfileImage(file, altText, jwt);
    }
}
