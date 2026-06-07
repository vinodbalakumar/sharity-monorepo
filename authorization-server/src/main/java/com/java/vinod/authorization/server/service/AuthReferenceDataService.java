package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.RegistrationGenderOption;
import com.java.vinod.authorization.server.entity.SupportedCountry;
import com.java.vinod.authorization.server.repository.RegistrationGenderOptionRepository;
import com.java.vinod.authorization.server.repository.SupportedCountryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthReferenceDataService {
    private static final String ACTIVE = "ACTIVE";

    private final SupportedCountryRepository supportedCountryRepository;
    private final RegistrationGenderOptionRepository registrationGenderOptionRepository;

    public AuthReferenceDataService(SupportedCountryRepository supportedCountryRepository,
                                    RegistrationGenderOptionRepository registrationGenderOptionRepository) {
        this.supportedCountryRepository = supportedCountryRepository;
        this.registrationGenderOptionRepository = registrationGenderOptionRepository;
    }

    @Transactional(readOnly = true)
    public AuthDtos.RegistrationOptionsResponse registrationOptions() {
        List<AuthDtos.RegistrationCountryOption> countries = supportedCountryRepository.findAllByOrderByCountryNameAsc().stream()
                .filter(country -> ACTIVE.equalsIgnoreCase(country.getStatus()))
                .map(this::toCountryOption)
                .toList();
        List<AuthDtos.RegistrationGenderOption> genders = registrationGenderOptionRepository
                .findAllByStatusOrderBySortOrderAscDisplayLabelAsc(ACTIVE).stream()
                .map(this::toGenderOption)
                .toList();
        return new AuthDtos.RegistrationOptionsResponse(countries, genders);
    }

    private AuthDtos.RegistrationCountryOption toCountryOption(SupportedCountry country) {
        return new AuthDtos.RegistrationCountryOption(
                country.getCountryCode(),
                country.getCountryName(),
                country.getPhoneDialCode(),
                country.getDefaultCurrencyCode());
    }

    private AuthDtos.RegistrationGenderOption toGenderOption(RegistrationGenderOption option) {
        return new AuthDtos.RegistrationGenderOption(option.getGenderCode(), option.getDisplayLabel());
    }
}
