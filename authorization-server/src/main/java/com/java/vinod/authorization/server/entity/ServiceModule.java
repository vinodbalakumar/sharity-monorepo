package com.java.vinod.authorization.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "service_module")
public class ServiceModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module_code", nullable = false, unique = true, length = 50)
    private String moduleCode;

    @Column(name = "module_name", nullable = false, length = 100)
    private String moduleName;

    @Column(length = 255)
    private String description;

    @Column(name = "module_type", nullable = false, length = 40)
    private String moduleType;

    @Column(name = "icon_key", length = 100)
    private String iconKey;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "customer_access_enabled", nullable = false)
    private boolean customerAccessEnabled;

    @Column(name = "provider_access_enabled", nullable = false)
    private boolean providerAccessEnabled;

    @Column(name = "requires_provider_approval", nullable = false)
    private boolean requiresProviderApproval;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "frontend_route", length = 255)
    private String frontendRoute;

    @Column(name = "api_audience", length = 100)
    private String apiAudience;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
