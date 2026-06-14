package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.NotificationTemplateMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationTemplateMasterRepository extends JpaRepository<NotificationTemplateMaster, String> {
    List<NotificationTemplateMaster> findByActiveTrueOrderBySortOrderAscSubjectAsc();
}
