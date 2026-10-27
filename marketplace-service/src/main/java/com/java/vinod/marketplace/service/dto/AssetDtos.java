package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;

public final class AssetDtos {
    private AssetDtos() {
    }

    public record ImageAssetResponse(String assetId,
                                     String providerCode,
                                     String bucketName,
                                     String objectKey,
                                     String publicUrl,
                                     String assetType,
                                     String ownerType,
                                     String ownerId,
                                     String contentType,
                                     Long fileSizeBytes,
                                     String altText,
                                     String visibility,
                                     String status,
                                     LocalDateTime createdAt) {
    }
}
