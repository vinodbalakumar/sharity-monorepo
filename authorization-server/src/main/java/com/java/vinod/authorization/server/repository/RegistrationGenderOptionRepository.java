package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.RegistrationGenderOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationGenderOptionRepository extends JpaRepository<RegistrationGenderOption, Long> {
    List<RegistrationGenderOption> findAllByStatusOrderBySortOrderAscDisplayLabelAsc(String status);
}
