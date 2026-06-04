package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.ServiceModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceModuleRepository extends JpaRepository<ServiceModule, Long> {
    Optional<ServiceModule> findByModuleCode(String moduleCode);

    List<ServiceModule> findAllByOrderByDisplayOrderAscModuleNameAsc();

    List<ServiceModule> findByStatusOrderByDisplayOrderAscModuleNameAsc(String status);
}
