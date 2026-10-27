package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.platform.PlatformDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.ProviderAccount;
import com.java.vinod.authorization.server.entity.ProviderModuleEnrollment;
import com.java.vinod.authorization.server.entity.ServiceModule;
import com.java.vinod.authorization.server.entity.ServiceModuleCountry;
import com.java.vinod.authorization.server.entity.SupportedCountry;
import com.java.vinod.authorization.server.entity.UserModuleAccess;
import com.java.vinod.authorization.server.entity.UserRestriction;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.ProviderAccountRepository;
import com.java.vinod.authorization.server.repository.ProviderModuleEnrollmentRepository;
import com.java.vinod.authorization.server.repository.ServiceModuleCountryRepository;
import com.java.vinod.authorization.server.repository.ServiceModuleRepository;
import com.java.vinod.authorization.server.repository.SupportedCountryRepository;
import com.java.vinod.authorization.server.repository.UserModuleAccessRepository;
import com.java.vinod.authorization.server.repository.UserRestrictionRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PlatformAuthorizationService {
    private static final String ACTIVE = "ACTIVE";
    private static final String APPROVED = "APPROVED";
    private static final Set<String> PROVIDER_BLOCKING_RESTRICTIONS = Set.of(
            "PROVIDER_ACCESS_BLOCKED", "MODULE_ACCESS_BLOCKED", "ACCOUNT_SUSPENDED");
    private static final Set<String> PAYOUT_BLOCKING_RESTRICTIONS = Set.of(
            "PAYOUT_BLOCKED", "ACCOUNT_SUSPENDED");

    private final AppUserRepository appUserRepository;
    private final ServiceModuleRepository serviceModuleRepository;
    private final SupportedCountryRepository supportedCountryRepository;
    private final ServiceModuleCountryRepository serviceModuleCountryRepository;
    private final ProviderAccountRepository providerAccountRepository;
    private final ProviderModuleEnrollmentRepository providerModuleEnrollmentRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;
    private final UserRestrictionRepository userRestrictionRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuditService auditService;

    public PlatformAuthorizationService(AppUserRepository appUserRepository,
                                        ServiceModuleRepository serviceModuleRepository,
                                        SupportedCountryRepository supportedCountryRepository,
                                        ServiceModuleCountryRepository serviceModuleCountryRepository,
                                        ProviderAccountRepository providerAccountRepository,
                                        ProviderModuleEnrollmentRepository providerModuleEnrollmentRepository,
                                        UserModuleAccessRepository userModuleAccessRepository,
                                        UserRestrictionRepository userRestrictionRepository,
                                        UserRoleRepository userRoleRepository,
                                        AuditService auditService) {
        this.appUserRepository = appUserRepository;
        this.serviceModuleRepository = serviceModuleRepository;
        this.supportedCountryRepository = supportedCountryRepository;
        this.serviceModuleCountryRepository = serviceModuleCountryRepository;
        this.providerAccountRepository = providerAccountRepository;
        this.providerModuleEnrollmentRepository = providerModuleEnrollmentRepository;
        this.userModuleAccessRepository = userModuleAccessRepository;
        this.userRestrictionRepository = userRestrictionRepository;
        this.userRoleRepository = userRoleRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PlatformDtos.ModuleResponse> userModules(Long userId) {
        boolean customer = userRoleRepository.existsByUser_IdAndRole_RoleName(userId, "CUSTOMER");
        List<UserModuleAccess> providerAccess = userModuleAccessRepository.findByUser_IdAndAccessStatusAndRevokedAtIsNull(userId, ACTIVE);
        return serviceModuleRepository.findAllByOrderByDisplayOrderAscModuleNameAsc().stream()
                .map(module -> toModuleResponse(module, customer, hasProviderAccess(providerAccess, module)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PlatformDtos.CapabilityResponse userCapabilities(Long userId) {
        boolean customer = userRoleRepository.existsByUser_IdAndRole_RoleName(userId, "CUSTOMER");
        List<String> roles = userRoleRepository.findByUser_Id(userId).stream()
                .map(userRole -> userRole.getRole().getRoleName())
                .sorted()
                .toList();
        List<PlatformDtos.ProviderModuleAccessResponse> providerModules =
                userModuleAccessRepository.findByUser_IdAndAccessStatusAndRevokedAtIsNull(userId, ACTIVE).stream()
                        .map(access -> new PlatformDtos.ProviderModuleAccessResponse(
                                access.getProviderAccount() == null ? null : access.getProviderAccount().getPublicId(),
                                access.getModule().getModuleCode(),
                                access.getAccessType(),
                                access.getAccessStatus()))
                        .toList();
        return new PlatformDtos.CapabilityResponse(customer, !providerModules.isEmpty(), roles, providerModules);
    }

    @Transactional(readOnly = true)
    public List<PlatformDtos.ProviderAccountResponse> myProviderAccounts(Long userId) {
        return providerAccountRepository.findByOwnerUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::toProviderAccountResponse)
                .toList();
    }

    @Transactional
    public PlatformDtos.ProviderAccountResponse createProviderAccount(Long userId, PlatformDtos.CreateProviderAccountRequest request) {
        AppUser owner = findUser(userId);
        supportedCountryRepository.findByCountryCode(request.countryCode())
                .filter(SupportedCountry::isProviderOnboardingEnabled)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Provider onboarding is not enabled for country"));

        LocalDateTime now = LocalDateTime.now();
        ProviderAccount provider = new ProviderAccount();
        provider.setPublicId(UUID.randomUUID().toString());
        provider.setOwnerUser(owner);
        provider.setProviderType(request.providerType());
        provider.setDisplayName(request.displayName().trim());
        provider.setSellerScope(request.sellerScope());
        provider.setCountryCode(request.countryCode());
        provider.setDefaultCurrencyCode(request.defaultCurrencyCode());
        provider.setVerificationStatus("NOT_STARTED");
        provider.setOverallStatus("PENDING");
        provider.setCreatedAt(now);
        provider.setUpdatedAt(now);
        providerAccountRepository.save(provider);
        auditService.record(owner, owner, "PROVIDER_ACCOUNT_CREATED", "provider_account", provider.getPublicId(), null);
        return toProviderAccountResponse(provider);
    }

    @Transactional(readOnly = true)
    public PlatformDtos.ProviderAccountResponse myProviderAccount(Long userId, String providerPublicId) {
        ProviderAccount provider = findProvider(providerPublicId);
        ensureOwner(userId, provider);
        return toProviderAccountResponse(provider);
    }

    @Transactional
    public PlatformDtos.ProviderAccountResponse enrollProviderModule(Long userId, String providerPublicId, String moduleCode) {
        ProviderAccount provider = findProvider(providerPublicId);
        ensureOwner(userId, provider);
        ServiceModule module = findModule(moduleCode);
        if (!module.isProviderAccessEnabled()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Provider access is not enabled for module");
        }
        serviceModuleCountryRepository.findByModule_ModuleCodeAndCountry_CountryCode(moduleCode, provider.getCountryCode())
                .filter(ServiceModuleCountry::isProviderOnboardingEnabled)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Provider onboarding is not enabled for this module and country"));

        ProviderModuleEnrollment enrollment = providerModuleEnrollmentRepository
                .findByProviderAccount_IdAndModule_ModuleCode(provider.getId(), moduleCode)
                .orElseGet(() -> newEnrollment(provider, module));
        if ("NOT_STARTED".equals(enrollment.getEnrollmentStatus())) {
            enrollment.setEnrollmentStatus("APPLICATION_SUBMITTED");
        }
        enrollment.setUpdatedAt(LocalDateTime.now());
        providerModuleEnrollmentRepository.save(enrollment);
        auditService.record(provider.getOwnerUser(), provider.getOwnerUser(), "PROVIDER_MODULE_ENROLLED",
                "provider_module_enrollment", provider.getPublicId() + ":" + moduleCode, null);
        return toProviderAccountResponse(provider);
    }

    @Transactional(readOnly = true)
    public List<PlatformDtos.ProviderEnrollmentResponse> providerModules(Long userId, String providerPublicId) {
        ProviderAccount provider = findProvider(providerPublicId);
        ensureOwner(userId, provider);
        return providerModuleEnrollmentRepository.findByProviderAccount_IdOrderByCreatedAtDesc(provider.getId()).stream()
                .map(this::toEnrollmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlatformDtos.InternalProviderAccountResponse internalProviderAccount(String providerPublicId) {
        ProviderAccount provider = findProvider(providerPublicId);
        return new PlatformDtos.InternalProviderAccountResponse(
                provider.getPublicId(),
                provider.getOwnerUser().getPublicId(),
                provider.getDisplayName(),
                provider.getSellerScope() == null ? "NATIONAL" : provider.getSellerScope(),
                provider.getCountryCode(),
                provider.getDefaultCurrencyCode(),
                provider.getVerificationStatus(),
                provider.getOverallStatus(),
                provider.isPayoutsEnabled(),
                provider.isChargesEnabled());
    }

    @Transactional(readOnly = true)
    public List<PlatformDtos.ModuleResponse> adminModules() {
        return serviceModuleRepository.findAllByOrderByDisplayOrderAscModuleNameAsc().stream()
                .map(module -> toModuleResponse(module, false, false))
                .toList();
    }

    @Transactional
    public PlatformDtos.ModuleResponse upsertModule(PlatformDtos.ModuleUpsertRequest request) {
        ServiceModule module = serviceModuleRepository.findByModuleCode(request.moduleCode()).orElseGet(ServiceModule::new);
        boolean creating = module.getId() == null;
        LocalDateTime now = LocalDateTime.now();
        module.setModuleCode(request.moduleCode());
        module.setModuleName(request.moduleName());
        module.setDescription(request.description());
        module.setModuleType(request.moduleType());
        module.setIconKey(request.iconKey());
        module.setDisplayOrder(request.displayOrder());
        module.setCustomerAccessEnabled(request.customerAccessEnabled());
        module.setProviderAccessEnabled(request.providerAccessEnabled());
        module.setRequiresProviderApproval(request.requiresProviderApproval());
        module.setStatus(request.status());
        module.setFrontendRoute(request.frontendRoute());
        module.setApiAudience(request.apiAudience());
        if (creating) {
            module.setCreatedAt(now);
        }
        module.setUpdatedAt(now);
        return toModuleResponse(serviceModuleRepository.save(module), false, false);
    }

    @Transactional(readOnly = true)
    public List<PlatformDtos.ProviderAccountResponse> pendingProviders() {
        List<ProviderAccount> pendingAccounts = providerAccountRepository.findByOverallStatusOrderByCreatedAtAsc("PENDING");
        List<ProviderAccount> submittedEnrollments = providerModuleEnrollmentRepository
                .findByEnrollmentStatusOrderByCreatedAtAsc("APPLICATION_SUBMITTED").stream()
                .map(ProviderModuleEnrollment::getProviderAccount)
                .toList();
        return java.util.stream.Stream.concat(pendingAccounts.stream(), submittedEnrollments.stream())
                .distinct()
                .map(this::toProviderAccountResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlatformDtos.ProviderAccountResponse adminProvider(String providerPublicId) {
        return toProviderAccountResponse(findProvider(providerPublicId));
    }

    @Transactional
    public PlatformDtos.ProviderAccountResponse updateProviderModuleStatus(Long actorUserId, String providerPublicId,
                                                                          String moduleCode,
                                                                          PlatformDtos.ProviderStatusUpdateRequest request) {
        AppUser actor = findUser(actorUserId);
        ProviderAccount provider = findProvider(providerPublicId);
        ServiceModule module = findModule(moduleCode);
        ProviderModuleEnrollment enrollment = providerModuleEnrollmentRepository
                .findByProviderAccount_IdAndModule_ModuleCode(provider.getId(), moduleCode)
                .orElseGet(() -> newEnrollment(provider, module));
        enrollment.setEnrollmentStatus(request.enrollmentStatus());
        enrollment.setSellingEnabled(request.sellingEnabled());
        enrollment.setServiceEnabled(request.serviceEnabled());
        enrollment.setPayoutEligible(request.payoutEligible());
        enrollment.setDisabledReason(request.disabledReason());
        if (APPROVED.equals(request.enrollmentStatus())) {
            enrollment.setApprovedByUser(actor);
            enrollment.setApprovedAt(LocalDateTime.now());
            provider.setOverallStatus(ACTIVE);
            provider.setVerificationStatus(APPROVED);
            grantProviderOwnerAccess(provider, module, actor);
        } else if ("RESTRICTED".equals(request.enrollmentStatus()) || "SUSPENDED".equals(request.enrollmentStatus())) {
            provider.setOverallStatus(request.enrollmentStatus());
        }
        enrollment.setUpdatedAt(LocalDateTime.now());
        provider.setUpdatedAt(LocalDateTime.now());
        providerModuleEnrollmentRepository.save(enrollment);
        auditService.record(actor, provider.getOwnerUser(), "PROVIDER_MODULE_STATUS_UPDATED",
                "provider_module_enrollment", providerPublicId + ":" + moduleCode, null);
        return toProviderAccountResponse(provider);
    }

    @Transactional(readOnly = true)
    public List<PlatformDtos.SupportedCountryResponse> supportedCountries() {
        return supportedCountryRepository.findAllByOrderByCountryNameAsc().stream()
                .map(this::toCountryResponse)
                .toList();
    }

    @Transactional
    public PlatformDtos.SupportedCountryResponse updateSupportedCountry(String countryCode,
                                                                        PlatformDtos.SupportedCountryUpdateRequest request) {
        SupportedCountry country = supportedCountryRepository.findByCountryCode(countryCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Country not found"));
        country.setCountryName(request.countryName());
        country.setDefaultCurrencyCode(request.defaultCurrencyCode());
        country.setPhoneDialCode(request.phoneDialCode());
        country.setRegistrationEnabled(request.registrationEnabled());
        country.setPurchasingEnabled(request.purchasingEnabled());
        country.setProviderOnboardingEnabled(request.providerOnboardingEnabled());
        country.setPayoutEnabled(request.payoutEnabled());
        country.setStatus(request.status());
        country.setUpdatedAt(LocalDateTime.now());
        return toCountryResponse(country);
    }

    @Transactional
    public void updateModuleCountry(String countryCode, String moduleCode, PlatformDtos.ModuleCountryUpdateRequest request) {
        ServiceModule module = findModule(moduleCode);
        SupportedCountry country = supportedCountryRepository.findByCountryCode(countryCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Country not found"));
        ServiceModuleCountry moduleCountry = serviceModuleCountryRepository.findByModule_ModuleCodeAndCountry_CountryCode(moduleCode, countryCode)
                .orElseGet(() -> {
                    ServiceModuleCountry created = new ServiceModuleCountry();
                    created.setModule(module);
                    created.setCountry(country);
                    created.setCreatedAt(LocalDateTime.now());
                    return created;
                });
        moduleCountry.setCustomerEnabled(request.customerEnabled());
        moduleCountry.setProviderOnboardingEnabled(request.providerOnboardingEnabled());
        moduleCountry.setPayoutEnabled(request.payoutEnabled());
        moduleCountry.setDisabledReason(request.disabledReason());
        moduleCountry.setUpdatedAt(LocalDateTime.now());
        serviceModuleCountryRepository.save(moduleCountry);
    }

    @Transactional
    public PlatformDtos.RestrictionResponse addRestriction(Long actorUserId, String targetPublicId,
                                                          PlatformDtos.RestrictionRequest request) {
        AppUser actor = findUser(actorUserId);
        AppUser target = appUserRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        UserRestriction restriction = new UserRestriction();
        restriction.setPublicId(UUID.randomUUID().toString());
        restriction.setUser(target);
        restriction.setModule(request.moduleCode() == null ? null : findModule(request.moduleCode()));
        restriction.setProviderAccount(request.providerPublicId() == null ? null : findProvider(request.providerPublicId()));
        restriction.setRestrictionType(request.restrictionType());
        restriction.setReason(request.reason());
        restriction.setCreatedByUser(actor);
        restriction.setCreatedAt(LocalDateTime.now());
        restriction.setExpiresAt(request.expiresAt());
        userRestrictionRepository.save(restriction);
        auditService.record(actor, target, "USER_RESTRICTION_CREATED", "user_restriction", restriction.getPublicId(), null);
        return toRestrictionResponse(restriction);
    }

    @Transactional
    public void revokeRestriction(Long actorUserId, String targetPublicId, Long restrictionId) {
        AppUser actor = findUser(actorUserId);
        AppUser target = appUserRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        UserRestriction restriction = userRestrictionRepository.findById(restrictionId)
                .filter(value -> value.getUser().getId().equals(target.getId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Restriction not found"));
        restriction.setRevokedByUser(actor);
        restriction.setRevokedAt(LocalDateTime.now());
        auditService.record(actor, target, "USER_RESTRICTION_REVOKED", "user_restriction", restriction.getPublicId(), null);
    }

    @Transactional(readOnly = true)
    public PlatformDtos.ProviderEligibilityResponse providerEligibility(String providerPublicId, String moduleCode) {
        ProviderAccount provider = findProvider(providerPublicId);
        ProviderModuleEnrollment enrollment = providerModuleEnrollmentRepository
                .findByProviderAccount_IdAndModule_ModuleCode(provider.getId(), moduleCode)
                .orElse(null);
        boolean restricted = hasActiveRestriction(provider.getOwnerUser().getId(), PROVIDER_BLOCKING_RESTRICTIONS)
                || hasActiveRestriction(provider.getOwnerUser().getId(), PAYOUT_BLOCKING_RESTRICTIONS);
        boolean eligible = ACTIVE.equals(provider.getOverallStatus())
                && enrollment != null
                && APPROVED.equals(enrollment.getEnrollmentStatus())
                && enrollment.isSellingEnabled()
                && !restricted;
        return new PlatformDtos.ProviderEligibilityResponse(
                eligible,
                providerPublicId,
                moduleCode,
                provider.getOverallStatus(),
                enrollment == null ? "NOT_STARTED" : enrollment.getEnrollmentStatus(),
                enrollment != null && enrollment.isSellingEnabled(),
                enrollment != null && enrollment.isPayoutEligible(),
                restricted);
    }

    @Transactional(readOnly = true)
    public PlatformDtos.ActiveRestrictionsResponse  activeRestrictions(String userPublicId) {
        List<PlatformDtos.RestrictionResponse> restrictions = userRestrictionRepository
                .findByUser_PublicIdAndRevokedAtIsNull(userPublicId).stream()
                .filter(this::isActive)
                .map(this::toRestrictionResponse)
                .toList();
        return new PlatformDtos.ActiveRestrictionsResponse(userPublicId, restrictions);
    }

    private ProviderModuleEnrollment newEnrollment(ProviderAccount provider, ServiceModule module) {
        ProviderModuleEnrollment enrollment = new ProviderModuleEnrollment();
        enrollment.setProviderAccount(provider);
        enrollment.setModule(module);
        enrollment.setEnrollmentStatus("NOT_STARTED");
        enrollment.setCreatedAt(LocalDateTime.now());
        enrollment.setUpdatedAt(LocalDateTime.now());
        return enrollment;
    }

    private void grantProviderOwnerAccess(ProviderAccount provider, ServiceModule module, AppUser actor) {
        userModuleAccessRepository.findByUser_IdAndModule_IdAndProviderAccount_IdAndAccessTypeAndRevokedAtIsNull(
                provider.getOwnerUser().getId(), module.getId(), provider.getId(), "PROVIDER_OWNER")
                .orElseGet(() -> {
                    UserModuleAccess access = new UserModuleAccess();
                    access.setUser(provider.getOwnerUser());
                    access.setModule(module);
                    access.setProviderAccount(provider);
                    access.setAccessType("PROVIDER_OWNER");
                    access.setAccessStatus(ACTIVE);
                    access.setAssignedByUser(actor);
                    access.setAssignedAt(LocalDateTime.now());
                    return userModuleAccessRepository.save(access);
                });
    }

    private PlatformDtos.ModuleResponse toModuleResponse(ServiceModule module, boolean customer, boolean providerAccessActive) {
        return new PlatformDtos.ModuleResponse(
                module.getModuleCode(),
                module.getModuleName(),
                module.getDescription(),
                module.getModuleType(),
                module.getIconKey(),
                module.getDisplayOrder(),
                module.isCustomerAccessEnabled(),
                module.isProviderAccessEnabled(),
                module.isRequiresProviderApproval(),
                module.getStatus(),
                module.getFrontendRoute(),
                module.getApiAudience(),
                customer && ACTIVE.equals(module.getStatus()) && module.isCustomerAccessEnabled(),
                providerAccessActive);
    }

    private PlatformDtos.ProviderAccountResponse toProviderAccountResponse(ProviderAccount provider) {
        List<PlatformDtos.ProviderEnrollmentResponse> enrollments =
                providerModuleEnrollmentRepository.findByProviderAccount_IdOrderByCreatedAtDesc(provider.getId()).stream()
                        .map(this::toEnrollmentResponse)
                        .toList();
        return new PlatformDtos.ProviderAccountResponse(
                provider.getPublicId(),
                provider.getDisplayName(),
                provider.getProviderType(),
            provider.getSellerScope() == null ? "NATIONAL" : provider.getSellerScope(),
                provider.getCountryCode(),
                provider.getDefaultCurrencyCode(),
                provider.getVerificationStatus(),
                provider.getOverallStatus(),
                provider.isPayoutsEnabled(),
                provider.isChargesEnabled(),
                enrollments);
    }

    private PlatformDtos.ProviderEnrollmentResponse toEnrollmentResponse(ProviderModuleEnrollment enrollment) {
        return new PlatformDtos.ProviderEnrollmentResponse(
                enrollment.getModule().getModuleCode(),
                enrollment.getModule().getModuleName(),
                enrollment.getEnrollmentStatus(),
                enrollment.isSellingEnabled(),
                enrollment.isServiceEnabled(),
                enrollment.isPayoutEligible(),
                enrollment.getDisabledReason());
    }

    private PlatformDtos.SupportedCountryResponse toCountryResponse(SupportedCountry country) {
        return new PlatformDtos.SupportedCountryResponse(
                country.getCountryCode(),
                country.getCountryName(),
                country.getDefaultCurrencyCode(),
                country.getPhoneDialCode(),
                country.isRegistrationEnabled(),
                country.isPurchasingEnabled(),
                country.isProviderOnboardingEnabled(),
                country.isPayoutEnabled(),
                country.getStatus());
    }

    private PlatformDtos.RestrictionResponse toRestrictionResponse(UserRestriction restriction) {
        return new PlatformDtos.RestrictionResponse(
                restriction.getId(),
                restriction.getPublicId(),
                restriction.getUser().getPublicId(),
                restriction.getModule() == null ? null : restriction.getModule().getModuleCode(),
                restriction.getProviderAccount() == null ? null : restriction.getProviderAccount().getPublicId(),
                restriction.getRestrictionType(),
                restriction.getReason(),
                restriction.getCreatedAt(),
                restriction.getExpiresAt(),
                restriction.getRevokedAt());
    }

    private boolean hasProviderAccess(List<UserModuleAccess> accessList, ServiceModule module) {
        return accessList.stream().anyMatch(access -> access.getModule().getId().equals(module.getId()));
    }

    private boolean hasActiveRestriction(Long userId, Set<String> restrictionTypes) {
        return userRestrictionRepository.findByUser_IdAndRevokedAtIsNull(userId).stream()
                .filter(this::isActive)
                .anyMatch(restriction -> restrictionTypes.contains(restriction.getRestrictionType()));
    }

    private boolean isActive(UserRestriction restriction) {
        return restriction.getRevokedAt() == null
                && (restriction.getExpiresAt() == null || restriction.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    private AppUser findUser(Long userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private ServiceModule findModule(String moduleCode) {
        return serviceModuleRepository.findByModuleCode(moduleCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Module not found"));
    }

    private ProviderAccount findProvider(String providerPublicId) {
        return providerAccountRepository.findByPublicId(providerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Provider account not found"));
    }

    private void ensureOwner(Long userId, ProviderAccount provider) {
        if (!provider.getOwnerUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Provider account does not belong to authenticated user");
        }
    }
}
