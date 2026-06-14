package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.RolePermissionMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionMappingRepository extends JpaRepository<RolePermissionMapping, Long> {
    List<RolePermissionMapping> findByRoleNameIgnoreCaseAndGrantedTrue(String roleName);
}
