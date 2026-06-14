package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.NotificationEventMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationEventMasterRepository extends JpaRepository<NotificationEventMaster, String> {
    List<NotificationEventMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}
