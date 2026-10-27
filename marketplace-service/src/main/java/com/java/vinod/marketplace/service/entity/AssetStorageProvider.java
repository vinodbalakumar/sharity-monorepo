package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "asset_storage_provider")
public class AssetStorageProvider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "provider_code", nullable = false, unique = true, length = 40)
    private String providerCode;

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Column(name = "bucket_name", nullable = false, length = 120)
    private String bucketName;

    @Column(name = "endpoint_url", length = 500)
    private String endpointUrl;

    @Column(name = "public_base_url", nullable = false, length = 500)
    private String publicBaseUrl;

    @Column(name = "region_code", length = 80)
    private String regionCode;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
