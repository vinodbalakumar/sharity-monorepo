package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.AccountStatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountStatusMasterRepository extends JpaRepository<AccountStatusMaster, String> {
    List<AccountStatusMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}
