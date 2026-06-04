package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserRole;
import com.java.vinod.authorization.server.entity.UserRoleId;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    List<UserRole> findByUser_Id(Long userId);

    @Query("""
            select distinct r.roleName
            from UserRole ur
            join ur.role r
            where ur.user.id = :userId
            order by r.roleName
            """)
    List<String> findRoleNamesByUserId(@Param("userId") Long userId);

    boolean existsByUser_IdAndRole_RoleName(Long userId, String roleName);
}
