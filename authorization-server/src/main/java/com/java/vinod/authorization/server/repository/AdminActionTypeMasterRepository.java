package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.AdminActionTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminActionTypeMasterRepository extends JpaRepository<AdminActionTypeMaster, String> {
    List<AdminActionTypeMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}
