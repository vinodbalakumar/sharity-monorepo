package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.PermissionMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermissionMasterRepository extends JpaRepository<PermissionMaster, String> {
    List<PermissionMaster> findByActiveTrueOrderBySortOrderAscPermissionNameAsc();
}
