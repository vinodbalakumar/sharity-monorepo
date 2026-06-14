package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.admin.AdminDtos;
import com.java.vinod.authorization.server.entity.AccountStatusMaster;
import com.java.vinod.authorization.server.entity.AdminActionTypeMaster;
import com.java.vinod.authorization.server.entity.NotificationEventMaster;
import com.java.vinod.authorization.server.entity.NotificationTemplateMaster;
import com.java.vinod.authorization.server.entity.PermissionMaster;
import com.java.vinod.authorization.server.entity.RolePermissionMapping;
import com.java.vinod.authorization.server.entity.SellerStatusMaster;
import com.java.vinod.authorization.server.entity.SellerVerificationDocumentMaster;
import com.java.vinod.authorization.server.repository.AccountStatusMasterRepository;
import com.java.vinod.authorization.server.repository.AdminActionTypeMasterRepository;
import com.java.vinod.authorization.server.repository.NotificationEventMasterRepository;
import com.java.vinod.authorization.server.repository.NotificationTemplateMasterRepository;
import com.java.vinod.authorization.server.repository.PermissionMasterRepository;
import com.java.vinod.authorization.server.repository.RolePermissionMappingRepository;
import com.java.vinod.authorization.server.repository.SellerStatusMasterRepository;
import com.java.vinod.authorization.server.repository.SellerVerificationDocumentMasterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthMasterDataService {
    private final PermissionMasterRepository permissionMasterRepository;
    private final RolePermissionMappingRepository rolePermissionMappingRepository;
    private final AccountStatusMasterRepository accountStatusMasterRepository;
    private final SellerStatusMasterRepository sellerStatusMasterRepository;
    private final SellerVerificationDocumentMasterRepository sellerVerificationDocumentMasterRepository;
    private final NotificationEventMasterRepository notificationEventMasterRepository;
    private final NotificationTemplateMasterRepository notificationTemplateMasterRepository;
    private final AdminActionTypeMasterRepository adminActionTypeMasterRepository;

    public AuthMasterDataService(PermissionMasterRepository permissionMasterRepository,
                                 RolePermissionMappingRepository rolePermissionMappingRepository,
                                 AccountStatusMasterRepository accountStatusMasterRepository,
                                 SellerStatusMasterRepository sellerStatusMasterRepository,
                                 SellerVerificationDocumentMasterRepository sellerVerificationDocumentMasterRepository,
                                 NotificationEventMasterRepository notificationEventMasterRepository,
                                 NotificationTemplateMasterRepository notificationTemplateMasterRepository,
                                 AdminActionTypeMasterRepository adminActionTypeMasterRepository) {
        this.permissionMasterRepository = permissionMasterRepository;
        this.rolePermissionMappingRepository = rolePermissionMappingRepository;
        this.accountStatusMasterRepository = accountStatusMasterRepository;
        this.sellerStatusMasterRepository = sellerStatusMasterRepository;
        this.sellerVerificationDocumentMasterRepository = sellerVerificationDocumentMasterRepository;
        this.notificationEventMasterRepository = notificationEventMasterRepository;
        this.notificationTemplateMasterRepository = notificationTemplateMasterRepository;
        this.adminActionTypeMasterRepository = adminActionTypeMasterRepository;
    }

    @Transactional(readOnly = true)
    public AdminDtos.AuthMasterReferenceResponse referenceData() {
        return new AdminDtos.AuthMasterReferenceResponse(
                permissionMasterRepository.findByActiveTrueOrderBySortOrderAscPermissionNameAsc().stream().map(this::toOption).toList(),
                rolePermissionMappingRepository.findAll().stream().map(this::toRolePermission).toList(),
                accountStatusMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream().map(this::toOption).toList(),
                sellerStatusMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream().map(this::toOption).toList(),
                sellerVerificationDocumentMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream().map(this::toOption).toList(),
                notificationEventMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream().map(this::toOption).toList(),
                notificationTemplateMasterRepository.findByActiveTrueOrderBySortOrderAscSubjectAsc().stream().map(this::toTemplate).toList(),
                adminActionTypeMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream().map(this::toOption).toList()
        );
    }

    private AdminDtos.MasterOptionResponse toOption(PermissionMaster value) {
        return new AdminDtos.MasterOptionResponse(value.getPermissionCode(), value.getPermissionName(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private AdminDtos.MasterOptionResponse toOption(AccountStatusMaster value) {
        return new AdminDtos.MasterOptionResponse(value.getStatusCode(), value.getDisplayLabel(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private AdminDtos.MasterOptionResponse toOption(SellerStatusMaster value) {
        return new AdminDtos.MasterOptionResponse(value.getStatusCode(), value.getDisplayLabel(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private AdminDtos.MasterOptionResponse toOption(SellerVerificationDocumentMaster value) {
        return new AdminDtos.MasterOptionResponse(value.getDocumentCode(), value.getDisplayLabel(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private AdminDtos.MasterOptionResponse toOption(NotificationEventMaster value) {
        return new AdminDtos.MasterOptionResponse(value.getEventCode(), value.getDisplayLabel(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private AdminDtos.MasterOptionResponse toOption(AdminActionTypeMaster value) {
        return new AdminDtos.MasterOptionResponse(value.getActionCode(), value.getDisplayLabel(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private AdminDtos.RolePermissionResponse toRolePermission(RolePermissionMapping value) {
        return new AdminDtos.RolePermissionResponse(value.getRoleName(), value.getPermissionCode(), value.isGranted());
    }

    private AdminDtos.NotificationTemplateMasterResponse toTemplate(NotificationTemplateMaster value) {
        return new AdminDtos.NotificationTemplateMasterResponse(value.getTemplateCode(), value.getEventCode(),
                value.getChannel(), value.getSubject(), value.isActive(), value.getSortOrder());
    }
}
