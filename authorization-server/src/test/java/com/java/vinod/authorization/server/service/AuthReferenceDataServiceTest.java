package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.RegistrationGenderOption;
import com.java.vinod.authorization.server.entity.SupportedCountry;
import com.java.vinod.authorization.server.repository.RegistrationGenderOptionRepository;
import com.java.vinod.authorization.server.repository.SupportedCountryRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthReferenceDataServiceTest {

    @Test
    void registrationOptionsReturnsActiveCountriesAndGenders() {
        SupportedCountryRepository countries = mock(SupportedCountryRepository.class);
        RegistrationGenderOptionRepository genders = mock(RegistrationGenderOptionRepository.class);
        AuthReferenceDataService service = new AuthReferenceDataService(countries, genders);

        SupportedCountry country = new SupportedCountry();
        country.setCountryCode("USA");
        country.setCountryName("United States");
        country.setDefaultCurrencyCode("USD");
        country.setPhoneDialCode("+1");
        country.setStatus("ACTIVE");
        country.setCreatedAt(LocalDateTime.now());
        country.setUpdatedAt(LocalDateTime.now());
        when(countries.findAllByOrderByCountryNameAsc()).thenReturn(List.of(country));

        RegistrationGenderOption gender = new RegistrationGenderOption();
        gender.setGenderCode("MALE");
        gender.setDisplayLabel("Male");
        gender.setSortOrder(10);
        gender.setStatus("ACTIVE");
        gender.setCreatedAt(LocalDateTime.now());
        gender.setUpdatedAt(LocalDateTime.now());
        when(genders.findAllByStatusOrderBySortOrderAscDisplayLabelAsc("ACTIVE")).thenReturn(List.of(gender));

        AuthDtos.RegistrationOptionsResponse response = service.registrationOptions();

        assertThat(response.countries()).containsExactly(
                new AuthDtos.RegistrationCountryOption("USA", "United States", "+1", "USD"));
        assertThat(response.genders()).containsExactly(
                new AuthDtos.RegistrationGenderOption("MALE", "Male"));
    }
}
