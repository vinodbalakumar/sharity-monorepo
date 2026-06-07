package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.AssetUploadEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetUploadEventRepository extends JpaRepository<AssetUploadEvent, Long> {
}
