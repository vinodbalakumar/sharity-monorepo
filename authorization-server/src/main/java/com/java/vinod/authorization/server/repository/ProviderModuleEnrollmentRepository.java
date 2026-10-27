package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.ProviderModuleEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderModuleEnrollmentRepository extends JpaRepository<ProviderModuleEnrollment, Long> {
    Optional<ProviderModuleEnrollment> findByProviderAccount_PublicIdAndModule_ModuleCode(String providerPublicId, String moduleCode);

    Optional<ProviderModuleEnrollment> findByProviderAccount_IdAndModule_ModuleCode(Long providerAccountId, String moduleCode);

    List<ProviderModuleEnrollment> findByProviderAccount_IdOrderByCreatedAtDesc(Long providerAccountId);

    List<ProviderModuleEnrollment> findByEnrollmentStatusOrderByCreatedAtAsc(String enrollmentStatus);
}
