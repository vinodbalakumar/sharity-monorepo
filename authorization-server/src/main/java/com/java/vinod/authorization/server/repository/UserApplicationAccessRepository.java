package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserApplicationAccess;
import com.java.vinod.authorization.server.entity.UserApplicationAccessId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserApplicationAccessRepository extends JpaRepository<UserApplicationAccess, UserApplicationAccessId> {
    List<UserApplicationAccess> findByUser_Id(Long userId);

    boolean existsByUser_IdAndApplication_AppCode(Long userId, String appCode);
}
