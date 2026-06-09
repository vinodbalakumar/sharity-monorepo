ALTER TABLE user_profile
    ADD COLUMN country_code VARCHAR(3) NULL,
    ADD COLUMN preferred_currency VARCHAR(3) NULL,
    ADD COLUMN preferred_timezone VARCHAR(100) NULL,
    ADD COLUMN locale VARCHAR(20) NULL;

INSERT INTO app_role (role_name, description, created_at)
VALUES
    ('CUSTOMER', 'Verified customer account', CURRENT_TIMESTAMP),
    ('SUPPORT_AGENT', 'Customer support operator', CURRENT_TIMESTAMP),
    ('COMPLIANCE_ADMIN', 'Compliance administrator', CURRENT_TIMESTAMP),
    ('DISPUTE_AGENT', 'Marketplace dispute operator', CURRENT_TIMESTAMP),
    ('MODULE_ADMIN', 'Service module administrator', CURRENT_TIMESTAMP),
    ('FINANCE_ADMIN', 'Payment and payout administrator', CURRENT_TIMESTAMP)
ON CONFLICT (role_name) DO UPDATE SET
    description = EXCLUDED.description;

CREATE TABLE service_module (
    id BIGSERIAL NOT NULL,
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
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_service_module_code UNIQUE (module_code)
);

CREATE TABLE supported_country (
    id BIGSERIAL NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    default_currency_code VARCHAR(3) NOT NULL,
    registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    purchasing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    provider_onboarding_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_supported_country_code UNIQUE (country_code)
);

CREATE TABLE service_module_country (
    id BIGSERIAL NOT NULL,
    module_id BIGINT NOT NULL,
    country_id BIGINT NOT NULL,
    customer_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    provider_onboarding_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    disabled_reason VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_service_module_country UNIQUE (module_id, country_id),
    CONSTRAINT fk_service_module_country_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_service_module_country_country FOREIGN KEY (country_id) REFERENCES supported_country (id)
);

CREATE TABLE provider_account (
    id BIGSERIAL NOT NULL,
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
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provider_account_public_id UNIQUE (public_id),
    CONSTRAINT fk_provider_account_owner FOREIGN KEY (owner_user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_provider_account_owner ON provider_account (owner_user_id);
CREATE INDEX idx_provider_account_status ON provider_account (overall_status);

CREATE TABLE provider_module_enrollment (
    id BIGSERIAL NOT NULL,
    provider_account_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    enrollment_status VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED',
    selling_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    service_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    payout_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_user_id BIGINT NULL,
    approved_at TIMESTAMP(6) NULL,
    disabled_reason VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provider_module_enrollment UNIQUE (provider_account_id, module_id),
    CONSTRAINT fk_provider_module_enrollment_provider FOREIGN KEY (provider_account_id) REFERENCES provider_account (id),
    CONSTRAINT fk_provider_module_enrollment_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_provider_module_enrollment_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_provider_module_enrollment_status ON provider_module_enrollment (enrollment_status);

CREATE TABLE user_module_access (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    provider_account_id BIGINT NULL,
    access_type VARCHAR(40) NOT NULL,
    access_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    assigned_by_user_id BIGINT NULL,
    assigned_at TIMESTAMP(6) NOT NULL,
    revoked_by_user_id BIGINT NULL,
    revoked_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_module_access_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_module_access_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_user_module_access_provider FOREIGN KEY (provider_account_id) REFERENCES provider_account (id),
    CONSTRAINT fk_user_module_access_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_module_access_revoked_by FOREIGN KEY (revoked_by_user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_user_module_access_user_status ON user_module_access (user_id, access_status);
CREATE INDEX idx_user_module_access_provider ON user_module_access (provider_account_id);

CREATE TABLE user_restriction (
    id BIGSERIAL NOT NULL,
    public_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    module_id BIGINT NULL,
    provider_account_id BIGINT NULL,
    restriction_type VARCHAR(40) NOT NULL,
    reason VARCHAR(255) NULL,
    created_by_user_id BIGINT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NULL,
    revoked_by_user_id BIGINT NULL,
    revoked_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_restriction_public_id UNIQUE (public_id),
    CONSTRAINT fk_user_restriction_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_restriction_module FOREIGN KEY (module_id) REFERENCES service_module (id),
    CONSTRAINT fk_user_restriction_provider FOREIGN KEY (provider_account_id) REFERENCES provider_account (id),
    CONSTRAINT fk_user_restriction_created_by FOREIGN KEY (created_by_user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_restriction_revoked_by FOREIGN KEY (revoked_by_user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_user_restriction_user_active ON user_restriction (user_id, revoked_at, expires_at);
CREATE INDEX idx_user_restriction_provider_active ON user_restriction (provider_account_id, revoked_at, expires_at);

INSERT INTO service_module (
    module_code, module_name, description, module_type, icon_key, display_order,
    customer_access_enabled, provider_access_enabled, requires_provider_approval,
    status, frontend_route, api_audience, created_at, updated_at
)
VALUES
    ('MARKETPLACE', 'Marketplace', 'Customer-to-provider commerce marketplace', 'MULTI_VENDOR_COMMERCE', 'store', 10, TRUE, TRUE, TRUE, 'ACTIVE', '/marketplace', 'MARKETPLACE_API', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('WALLET', 'Wallet', 'Payment activity and provider earnings view', 'FINANCIAL_FEATURE', 'wallet', 20, TRUE, FALSE, FALSE, 'ACTIVE', '/wallet', 'WALLET_API', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PAYMENTS', 'Payments', 'Internal payment orchestration service', 'INTERNAL_SERVICE', 'credit-card', 30, FALSE, FALSE, FALSE, 'ACTIVE', NULL, 'PAYMENT_API', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('GROCERY', 'Grocery', 'Grocery commerce module', 'MERCHANT_COMMERCE', 'shopping-basket', 40, TRUE, TRUE, TRUE, 'COMING_SOON', '/grocery', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MEAT_SHOP', 'Meat Shop', 'Meat shop commerce module', 'MERCHANT_COMMERCE', 'beef', 50, TRUE, TRUE, TRUE, 'COMING_SOON', '/meat-shop', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHARMACY', 'Pharmacy', 'Regulated pharmacy module', 'REGULATED_COMMERCE', 'pill', 60, FALSE, FALSE, TRUE, 'COMING_SOON', '/pharmacy', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('LOGISTICS', 'Logistics', 'Logistics service network', 'SERVICE_NETWORK', 'truck', 70, TRUE, TRUE, TRUE, 'COMING_SOON', '/logistics', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('AUTOMOTIVE', 'Automotive', 'Automotive services module', 'MERCHANT_SERVICE', 'car', 80, TRUE, TRUE, TRUE, 'COMING_SOON', '/automotive', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('GIFT_CARDS', 'Gift Cards', 'Gift cards marketplace module', 'HIGH_RISK_MARKETPLACE', 'gift', 90, FALSE, FALSE, TRUE, 'COMING_SOON', '/gift-cards', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('TESLA_DASHBOARD', 'Tesla Dashboard', 'Connected Tesla dashboard integration', 'CONNECTED_INTEGRATION', 'gauge', 100, TRUE, FALSE, FALSE, 'ACTIVE', '/tesla', 'TESLA_DASHBOARD_API', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (module_code) DO UPDATE SET
    module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    module_type = EXCLUDED.module_type,
    icon_key = EXCLUDED.icon_key,
    display_order = EXCLUDED.display_order,
    customer_access_enabled = EXCLUDED.customer_access_enabled,
    provider_access_enabled = EXCLUDED.provider_access_enabled,
    requires_provider_approval = EXCLUDED.requires_provider_approval,
    status = EXCLUDED.status,
    frontend_route = EXCLUDED.frontend_route,
    api_audience = EXCLUDED.api_audience,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO supported_country (
    country_code, country_name, default_currency_code, registration_enabled, purchasing_enabled,
    provider_onboarding_enabled, payout_enabled, status, created_at, updated_at
)
VALUES
    ('USA', 'United States', 'USD', TRUE, TRUE, TRUE, TRUE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('IND', 'India', 'INR', TRUE, TRUE, TRUE, FALSE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (country_code) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    default_currency_code = EXCLUDED.default_currency_code,
    registration_enabled = EXCLUDED.registration_enabled,
    purchasing_enabled = EXCLUDED.purchasing_enabled,
    provider_onboarding_enabled = EXCLUDED.provider_onboarding_enabled,
    payout_enabled = EXCLUDED.payout_enabled,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO service_module_country (
    module_id, country_id, customer_enabled, provider_onboarding_enabled, payout_enabled,
    disabled_reason, created_at, updated_at
)
SELECT module.id, country.id,
       module.customer_access_enabled,
       module.provider_access_enabled AND country.provider_onboarding_enabled,
       country.payout_enabled,
       CASE WHEN country.payout_enabled THEN NULL ELSE 'Payout support is not enabled for this country in V3' END,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM service_module module
CROSS JOIN supported_country country
WHERE module.module_code IN ('MARKETPLACE', 'WALLET', 'TESLA_DASHBOARD')
ON CONFLICT (module_id, country_id) DO UPDATE SET
    customer_enabled = EXCLUDED.customer_enabled,
    provider_onboarding_enabled = EXCLUDED.provider_onboarding_enabled,
    payout_enabled = EXCLUDED.payout_enabled,
    disabled_reason = EXCLUDED.disabled_reason,
    updated_at = CURRENT_TIMESTAMP;
