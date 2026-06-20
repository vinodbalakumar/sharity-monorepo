package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.AssetStorageProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssetStorageProviderRepository extends JpaRepository<AssetStorageProvider, Long> {
    Optional<AssetStorageProvider> findFirstByActiveTrueOrderByUpdatedAtDesc();

    Optional<AssetStorageProvider> findByProviderCodeAndActiveTrue(String providerCode);
}
