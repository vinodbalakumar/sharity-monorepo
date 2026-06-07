package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    Optional<Asset> findByPublicId(String publicId);

    List<Asset> findByOwnerTypeAndOwnerIdAndAssetStatusOrderByCreatedAtDesc(String ownerType, String ownerId, String assetStatus);
}
