package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserApplicationAccess;
import com.java.vinod.authorization.server.entity.UserApplicationAccessId;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserApplicationAccessRepository extends JpaRepository<UserApplicationAccess, UserApplicationAccessId> {
    List<UserApplicationAccess> findByUser_Id(Long userId);

    @Query("""
            select distinct a.appCode
            from UserApplicationAccess ua
            join ua.application a
            where ua.user.id = :userId
            order by a.appCode
            """)
    List<String> findAppCodesByUserId(@Param("userId") Long userId);

    boolean existsByUser_IdAndApplication_AppCode(Long userId, String appCode);
}
