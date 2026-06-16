package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "verticals_master")
public class MarketplaceVertical {
    @Id
    @Column(name = "module_code", nullable = false, length = 50)
    private String moduleCode;

    @Column(name = "module_name", nullable = false, length = 120)
    private String moduleName;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "icon_key", nullable = false, length = 50)
    private String iconKey;

    @Column(name = "module_type", nullable = false, length = 50)
    private String moduleType;

    @Column(name = "frontend_route", nullable = false, length = 120)
    private String frontendRoute;

    @Column(name = "api_audience", nullable = false, length = 80)
    private String apiAudience;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "image_keys", length = 1000)
    private String imageKeys;

    @Column(name = "customer_access_enabled", nullable = false)
    private boolean customerAccessEnabled;

    @Column(name = "provider_access_enabled", nullable = false)
    private boolean providerAccessEnabled;

    @Column(name = "requires_provider_approval", nullable = false)
    private boolean requiresProviderApproval;

    @Column(name = "available_to_customer", nullable = false)
    private boolean availableToCustomer;

    @Column(name = "provider_access_active", nullable = false)
    private boolean providerAccessActive;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
