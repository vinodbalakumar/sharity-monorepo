ALTER TABLE user_profile
    ADD COLUMN country_code VARCHAR(3) NULL AFTER profile_image_url,
    ADD COLUMN preferred_currency VARCHAR(3) NULL AFTER country_code,
    ADD COLUMN preferred_timezone VARCHAR(100) NULL AFTER preferred_currency,
    ADD COLUMN locale VARCHAR(20) NULL AFTER preferred_timezone;

INSERT INTO app_role (role_name, description, created_at)
VALUES
    ('CUSTOMER', 'Verified customer account', NOW(6)),
    ('SUPPORT_AGENT', 'Customer support operator', NOW(6)),
    ('COMPLIANCE_ADMIN', 'Compliance administrator', NOW(6)),
    ('DISPUTE_AGENT', 'Marketplace dispute operator', NOW(6)),
    ('MODULE_ADMIN', 'Service module administrator', NOW(6)),
    ('FINANCE_ADMIN', 'Payment and payout administrator', NOW(6))
ON DUPLICATE KEY UPDATE description = VALUES(description);

CREATE TABLE service_module (
    id BIGINT NOT NULL AUTO_INCREMENT,
    module_code VARCHAR(50) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    module_type VARCHAR(40) NOT NULL,
    icon_key VARCHAR(100) NULL,
    display_order INT NOT NULL DEFAULT 0,
    customer_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    provider_access_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    requires_provider_approval BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    frontend_route VARCHAR(255) NULL,
    api_audience VARCHAR(100) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_service_module_code UNIQUE (module_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE supported_country (
    id BIGINT NOT NULL AUTO_INCREMENT,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    default_currency_code VARCHAR(3) NOT NULL,
    registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    purchasing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    provider_onboarding_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_supported_country_code UNIQUE (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE service_module_country (
    id BIGINT NOT NULL AUTO_INCREMENT,
    module_id BIGINT NOT NULL,
    country_id BIGINT NOT NULL,
    customer_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    provider_onboarding_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    disabled_reason VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_service_module_country UNIQUE (module_id, country_id),
    CONSTRAINT fk_service_module_country_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_service_module_country_country FOREIGN KEY (country_id) REFERENCES supported_country (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE provider_account (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    provider_type VARCHAR(40) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    default_currency_code VARCHAR(3) NOT NULL,
    verification_status VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED',
    overall_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_provider VARCHAR(50) NULL,
    payment_provider_account_ref VARCHAR(255) NULL,
    payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provider_account_public_id UNIQUE (public_id),
    CONSTRAINT fk_provider_account_owner FOREIGN KEY (owner_user_id) REFERENCES app_user (id),
    INDEX idx_provider_account_owner (owner_user_id),
    INDEX idx_provider_account_status (overall_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE provider_module_enrollment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    provider_account_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    enrollment_status VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED',
    selling_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    service_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    payout_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_user_id BIGINT NULL,
    approved_at DATETIME(6) NULL,
    disabled_reason VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provider_module_enrollment UNIQUE (provider_account_id, module_id),
    CONSTRAINT fk_provider_module_enrollment_provider FOREIGN KEY (provider_account_id) REFERENCES provider_account (id),
    CONSTRAINT fk_provider_module_enrollment_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_provider_module_enrollment_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES app_user (id),
    INDEX idx_provider_module_enrollment_status (enrollment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_module_access (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    provider_account_id BIGINT NULL,
    access_type VARCHAR(40) NOT NULL,
    access_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    assigned_by_user_id BIGINT NULL,
    assigned_at DATETIME(6) NOT NULL,
    revoked_by_user_id BIGINT NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_module_access_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_module_access_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_user_module_access_provider FOREIGN KEY (provider_account_id) REFERENCES provider_account (id),
    CONSTRAINT fk_user_module_access_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_module_access_revoked_by FOREIGN KEY (revoked_by_user_id) REFERENCES app_user (id),
    INDEX idx_user_module_access_user_status (user_id, access_status),
    INDEX idx_user_module_access_provider (provider_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_restriction (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    module_id BIGINT NULL,
    provider_account_id BIGINT NULL,
    restriction_type VARCHAR(40) NOT NULL,
    reason VARCHAR(255) NULL,
    created_by_user_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NULL,
    revoked_by_user_id BIGINT NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_restriction_public_id UNIQUE (public_id),
    CONSTRAINT fk_user_restriction_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_restriction_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_user_restriction_provider FOREIGN KEY (provider_account_id) REFERENCES provider_account (id),
    CONSTRAINT fk_user_restriction_created_by FOREIGN KEY (created_by_user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_restriction_revoked_by FOREIGN KEY (revoked_by_user_id) REFERENCES app_user (id),
    INDEX idx_user_restriction_user_active (user_id, revoked_at, expires_at),
    INDEX idx_user_restriction_provider_active (provider_account_id, revoked_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO service_module (
    module_code, module_name, description, module_type, icon_key, display_order,
    customer_access_enabled, provider_access_enabled, requires_provider_approval,
    status, frontend_route, api_audience, created_at, updated_at
)
VALUES
    ('MARKETPLACE', 'Marketplace', 'Customer-to-provider commerce marketplace', 'MULTI_VENDOR_COMMERCE', 'store', 10, TRUE, TRUE, TRUE, 'ACTIVE', '/marketplace', 'MARKETPLACE_API', NOW(6), NOW(6)),
    ('WALLET', 'Wallet', 'Payment activity and provider earnings view', 'FINANCIAL_FEATURE', 'wallet', 20, TRUE, FALSE, FALSE, 'ACTIVE', '/wallet', 'WALLET_API', NOW(6), NOW(6)),
    ('PAYMENTS', 'Payments', 'Internal payment orchestration service', 'INTERNAL_SERVICE', 'credit-card', 30, FALSE, FALSE, FALSE, 'ACTIVE', NULL, 'PAYMENT_API', NOW(6), NOW(6)),
    ('GROCERY', 'Grocery', 'Grocery commerce module', 'MERCHANT_COMMERCE', 'shopping-basket', 40, TRUE, TRUE, TRUE, 'COMING_SOON', '/grocery', NULL, NOW(6), NOW(6)),
    ('MEAT_SHOP', 'Meat Shop', 'Meat shop commerce module', 'MERCHANT_COMMERCE', 'beef', 50, TRUE, TRUE, TRUE, 'COMING_SOON', '/meat-shop', NULL, NOW(6), NOW(6)),
    ('PHARMACY', 'Pharmacy', 'Regulated pharmacy module', 'REGULATED_COMMERCE', 'pill', 60, FALSE, FALSE, TRUE, 'COMING_SOON', '/pharmacy', NULL, NOW(6), NOW(6)),
    ('LOGISTICS', 'Logistics', 'Logistics service network', 'SERVICE_NETWORK', 'truck', 70, TRUE, TRUE, TRUE, 'COMING_SOON', '/logistics', NULL, NOW(6), NOW(6)),
    ('AUTOMOTIVE', 'Automotive', 'Automotive services module', 'MERCHANT_SERVICE', 'car', 80, TRUE, TRUE, TRUE, 'COMING_SOON', '/automotive', NULL, NOW(6), NOW(6)),
    ('GIFT_CARDS', 'Gift Cards', 'Gift cards marketplace module', 'HIGH_RISK_MARKETPLACE', 'gift', 90, FALSE, FALSE, TRUE, 'COMING_SOON', '/gift-cards', NULL, NOW(6), NOW(6)),
    ('TESLA_DASHBOARD', 'Tesla Dashboard', 'Connected Tesla dashboard integration', 'CONNECTED_INTEGRATION', 'gauge', 100, TRUE, FALSE, FALSE, 'ACTIVE', '/tesla', 'TESLA_DASHBOARD_API', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    module_name = VALUES(module_name),
    description = VALUES(description),
    module_type = VALUES(module_type),
    icon_key = VALUES(icon_key),
    display_order = VALUES(display_order),
    customer_access_enabled = VALUES(customer_access_enabled),
    provider_access_enabled = VALUES(provider_access_enabled),
    requires_provider_approval = VALUES(requires_provider_approval),
    status = VALUES(status),
    frontend_route = VALUES(frontend_route),
    api_audience = VALUES(api_audience),
    updated_at = NOW(6);

INSERT INTO supported_country (
    country_code, country_name, default_currency_code, registration_enabled, purchasing_enabled,
    provider_onboarding_enabled, payout_enabled, status, created_at, updated_at
)
VALUES
    ('USA', 'United States', 'USD', TRUE, TRUE, TRUE, TRUE, 'ACTIVE', NOW(6), NOW(6)),
    ('IND', 'India', 'INR', TRUE, TRUE, TRUE, FALSE, 'ACTIVE', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    country_name = VALUES(country_name),
    default_currency_code = VALUES(default_currency_code),
    registration_enabled = VALUES(registration_enabled),
    purchasing_enabled = VALUES(purchasing_enabled),
    provider_onboarding_enabled = VALUES(provider_onboarding_enabled),
    payout_enabled = VALUES(payout_enabled),
    status = VALUES(status),
    updated_at = NOW(6);

INSERT INTO service_module_country (
    module_id, country_id, customer_enabled, provider_onboarding_enabled, payout_enabled,
    disabled_reason, created_at, updated_at
)
SELECT module.id, country.id,
       module.customer_access_enabled,
       module.provider_access_enabled AND country.provider_onboarding_enabled,
       country.payout_enabled,
       CASE WHEN country.payout_enabled THEN NULL ELSE 'Payout support is not enabled for this country in V3' END,
       NOW(6), NOW(6)
FROM service_module module
CROSS JOIN supported_country country
WHERE module.module_code IN ('MARKETPLACE', 'WALLET', 'TESLA_DASHBOARD')
ON DUPLICATE KEY UPDATE
    customer_enabled = VALUES(customer_enabled),
    provider_onboarding_enabled = VALUES(provider_onboarding_enabled),
    payout_enabled = VALUES(payout_enabled),
    disabled_reason = VALUES(disabled_reason),
    updated_at = NOW(6);
