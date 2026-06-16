DELETE FROM user_application_access;
DELETE FROM application;
DELETE FROM provider_module_enrollment;
DELETE FROM user_module_access;
DELETE FROM user_restriction;
DELETE FROM provider_account;
DELETE FROM social_registration_session;
DELETE FROM user_social_identities;
DELETE FROM user_login_method;
DELETE FROM refresh_token;
DELETE FROM email_verification_token;
DELETE FROM password_reset_token;
DELETE FROM login_attempt;
DELETE FROM audit_log;
DELETE FROM email_delivery_log;
DELETE FROM user_role;
DELETE FROM user_credential;
DELETE FROM user_profile;
DELETE FROM app_user;

ALTER TABLE user_application_access AUTO_INCREMENT = 1;
ALTER TABLE provider_module_enrollment AUTO_INCREMENT = 1;
ALTER TABLE user_module_access AUTO_INCREMENT = 1;
ALTER TABLE user_restriction AUTO_INCREMENT = 1;
ALTER TABLE provider_account AUTO_INCREMENT = 1;
ALTER TABLE social_registration_session AUTO_INCREMENT = 1;
ALTER TABLE user_social_identities AUTO_INCREMENT = 1;
ALTER TABLE user_login_method AUTO_INCREMENT = 1;
ALTER TABLE refresh_token AUTO_INCREMENT = 1;
ALTER TABLE email_verification_token AUTO_INCREMENT = 1;
ALTER TABLE password_reset_token AUTO_INCREMENT = 1;
ALTER TABLE login_attempt AUTO_INCREMENT = 1;
ALTER TABLE audit_log AUTO_INCREMENT = 1;
ALTER TABLE email_delivery_log AUTO_INCREMENT = 1;
ALTER TABLE user_role AUTO_INCREMENT = 1;
ALTER TABLE user_credential AUTO_INCREMENT = 1;
ALTER TABLE user_profile AUTO_INCREMENT = 1;
ALTER TABLE app_user AUTO_INCREMENT = 1;
ALTER TABLE application AUTO_INCREMENT = 1;

INSERT INTO app_role (role_name, description, created_at)
VALUES
    ('USER', 'Default application user', NOW(6)),
    ('BUYER', 'Buyer account role', NOW(6)),
    ('CUSTOMER', 'Verified customer account', NOW(6)),
    ('SELLER', 'Seller account role', NOW(6)),
    ('ADMIN', 'Administrator with user-management privileges', NOW(6)),
    ('SUPER_ADMIN', 'Highest privilege administrator', NOW(6)),
    ('MODULE_ADMIN', 'Service module administrator', NOW(6)),
    ('FINANCE_ADMIN', 'Payment and payout administrator', NOW(6)),
    ('COMPLIANCE_ADMIN', 'Compliance administrator', NOW(6)),
    ('DISPUTE_AGENT', 'Marketplace dispute operator', NOW(6)),
    ('SUPPORT_AGENT', 'Customer support operator', NOW(6))
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

INSERT INTO application (app_code, app_name, description, active, created_at)
VALUES
    ('SHARITY_WEB', 'Sharity Web App', 'Primary Sharity web storefront', TRUE, NOW(6)),
    ('SHARITY_MARKETPLACE', 'Sharity Marketplace', 'Marketplace customer and seller experience', TRUE, NOW(6)),
    ('SHARITY_SELLER', 'Sharity Seller Console', 'Seller account and store management experience', TRUE, NOW(6)),
    ('SHARITY_WALLET', 'Sharity Wallet', 'Wallet summary and ledger experience', TRUE, NOW(6)),
    ('SHARITY_PAYMENT', 'Sharity Payments', 'Payment and payout operations experience', TRUE, NOW(6)),
    ('SHARITY_ADMIN', 'Sharity Admin Console', 'Administrative management console', TRUE, NOW(6))
ON DUPLICATE KEY UPDATE
    app_name = VALUES(app_name),
    description = VALUES(description),
    active = VALUES(active);

INSERT INTO app_user (
    public_id, email, normalized_email, username, normalized_username, status,
    email_verified, phone_verified, profile_completion_status, profile_completed_at, terms_accepted_at,
    failed_login_count, locked_until, last_login_at, created_at, updated_at, deleted_at
)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'customer@sharity.local', 'customer@sharity.local', 'customer.demo', 'customer.demo',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', NOW(6), NOW(6), 0, NULL, NOW(6), NOW(6), NOW(6), NULL),
    ('22222222-2222-2222-2222-222222222202', 'vinodbalakumar0594@gmail.com', 'vinodbalakumar0594@gmail.com', 'vinod.balakumar', 'vinod.balakumar',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', NOW(6), NOW(6), 0, NULL, NOW(6), NOW(6), NOW(6), NULL),
    ('22222222-2222-2222-2222-222222222203', 'admin@sharity.local', 'admin@sharity.local', 'admin.demo', 'admin.demo',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', NOW(6), NOW(6), 0, NULL, NOW(6), NOW(6), NOW(6), NULL),
    ('22222222-2222-2222-2222-222222222204', 'superadmin@sharity.local', 'superadmin@sharity.local', 'superadmin.demo', 'superadmin.demo',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', NOW(6), NOW(6), 0, NULL, NOW(6), NOW(6), NOW(6), NULL);

SET @customer_user_id := (SELECT id FROM app_user WHERE public_id = '22222222-2222-2222-2222-222222222201');
SET @seller_user_id := (SELECT id FROM app_user WHERE public_id = '22222222-2222-2222-2222-222222222202');
SET @admin_user_id := (SELECT id FROM app_user WHERE public_id = '22222222-2222-2222-2222-222222222203');
SET @super_admin_user_id := (SELECT id FROM app_user WHERE public_id = '22222222-2222-2222-2222-222222222204');

INSERT INTO user_credential (
    user_id, password_hash, password_changed_at, password_reset_required, created_at, updated_at
)
VALUES
    (@customer_user_id, '$2a$10$/JSzGsCWZXW3xEMqD.UARuvfDcAmMW5MmMP.ATpBqJx1IPcWFkjly', NOW(6), FALSE, NOW(6), NOW(6)),
    (@seller_user_id, '$2a$10$hT5PXfi4MfgrYWiVdZeopeIxFRJRsA4O2tFHvWDdVLm8puIyTZEsS', NOW(6), FALSE, NOW(6), NOW(6)),
    (@admin_user_id, '$2a$10$TGDJTrz4yVSJQj2IZAxtmuxkB7xsFubwi9WfaWWU4TdJzOgL3gHhe', NOW(6), FALSE, NOW(6), NOW(6)),
    (@super_admin_user_id, '$2a$10$Mwv2LRtiBAgPGJuwroLx1es9AeVz8NrHAwTViif.D0y3JnCCMyi2.', NOW(6), FALSE, NOW(6), NOW(6));

INSERT INTO user_profile (
    user_id, first_name, last_name, phone_number, profile_image_url, country_code, country_name,
    phone_dial_code, date_of_birth, gender, preferred_currency, preferred_timezone, locale, created_at, updated_at
)
VALUES
    (@customer_user_id, 'Priya', 'Shah', '4155550101', NULL, 'USA', 'United States', '+1', '1998-02-06', 'FEMALE', 'USD', 'America/Phoenix', 'en-US', NOW(6), NOW(6)),
    (@seller_user_id, 'Vinod', 'Balakumar', '4155550102', NULL, 'USA', 'United States', '+1', '1990-08-14', 'MALE', 'USD', 'America/Phoenix', 'en-US', NOW(6), NOW(6)),
    (@admin_user_id, 'Asha', 'Mehta', '4155550103', NULL, 'USA', 'United States', '+1', '1992-04-22', 'FEMALE', 'USD', 'America/Phoenix', 'en-US', NOW(6), NOW(6)),
    (@super_admin_user_id, 'Sharity', 'Admin', '4155550104', NULL, 'USA', 'United States', '+1', '1988-11-03', 'OTHER', 'USD', 'America/Phoenix', 'en-US', NOW(6), NOW(6));

INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
SELECT @customer_user_id, id, NOW(6), @super_admin_user_id FROM app_role WHERE role_name IN ('USER', 'BUYER', 'CUSTOMER');

INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
SELECT @seller_user_id, id, NOW(6), @super_admin_user_id FROM app_role WHERE role_name IN ('USER', 'BUYER', 'SELLER');

INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
SELECT @admin_user_id, id, NOW(6), @super_admin_user_id FROM app_role WHERE role_name IN ('USER', 'ADMIN');

INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
SELECT @super_admin_user_id, id, NOW(6), @super_admin_user_id
FROM app_role
WHERE role_name IN ('USER', 'ADMIN', 'SUPER_ADMIN', 'MODULE_ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_ADMIN', 'DISPUTE_AGENT', 'SUPPORT_AGENT');

INSERT INTO user_login_method (
    user_id, provider, provider_subject, provider_email, provider_email_verified, password_credential_id, enabled, created_at, updated_at
)
VALUES
    (@customer_user_id, 'LOCAL', NULL, 'customer@sharity.local', TRUE, (SELECT id FROM user_credential WHERE user_id = @customer_user_id), TRUE, NOW(6), NOW(6)),
    (@seller_user_id, 'LOCAL', NULL, 'vinodbalakumar0594@gmail.com', TRUE, (SELECT id FROM user_credential WHERE user_id = @seller_user_id), TRUE, NOW(6), NOW(6)),
    (@admin_user_id, 'LOCAL', NULL, 'admin@sharity.local', TRUE, (SELECT id FROM user_credential WHERE user_id = @admin_user_id), TRUE, NOW(6), NOW(6)),
    (@super_admin_user_id, 'LOCAL', NULL, 'superadmin@sharity.local', TRUE, (SELECT id FROM user_credential WHERE user_id = @super_admin_user_id), TRUE, NOW(6), NOW(6));

INSERT INTO provider_account (
    public_id, owner_user_id, provider_type, display_name, seller_scope, country_code, default_currency_code,
    verification_status, overall_status, payment_provider, payment_provider_account_ref, payouts_enabled, charges_enabled,
    created_at, updated_at
)
VALUES
    ('11111111-1111-1111-1111-111111111101', @seller_user_id, 'INDIVIDUAL', 'Sharity Digital Deals', 'GLOBAL', 'USA', 'USD', 'APPROVED', 'ACTIVE', NULL, NULL, TRUE, TRUE, NOW(6), NOW(6)),
    ('11111111-1111-1111-1111-111111111102', @seller_user_id, 'INDIVIDUAL', 'Sharity Gaming Vault', 'GLOBAL', 'USA', 'USD', 'APPROVED', 'ACTIVE', NULL, NULL, TRUE, TRUE, NOW(6), NOW(6)),
    ('11111111-1111-1111-1111-111111111103', @seller_user_id, 'INDIVIDUAL', 'Sharity Jewellery Atelier', 'GLOBAL', 'USA', 'USD', 'APPROVED', 'ACTIVE', NULL, NULL, TRUE, TRUE, NOW(6), NOW(6)),
    ('11111111-1111-1111-1111-111111111104', @seller_user_id, 'INDIVIDUAL', 'Sharity Jewellery Studio', 'GLOBAL', 'USA', 'USD', 'APPROVED', 'ACTIVE', NULL, NULL, TRUE, TRUE, NOW(6), NOW(6));

SET @provider_101 := (SELECT id FROM provider_account WHERE public_id = '11111111-1111-1111-1111-111111111101');
SET @provider_102 := (SELECT id FROM provider_account WHERE public_id = '11111111-1111-1111-1111-111111111102');
SET @provider_103 := (SELECT id FROM provider_account WHERE public_id = '11111111-1111-1111-1111-111111111103');
SET @provider_104 := (SELECT id FROM provider_account WHERE public_id = '11111111-1111-1111-1111-111111111104');
SET @marketplace_module_id := (SELECT id FROM service_module WHERE module_code = 'MARKETPLACE');
SET @wallet_module_id := (SELECT id FROM service_module WHERE module_code = 'WALLET');
SET @payments_module_id := (SELECT id FROM service_module WHERE module_code = 'PAYMENTS');
SET @superadmin_role_id := (SELECT id FROM app_role WHERE role_name = 'SUPER_ADMIN');

INSERT INTO provider_module_enrollment (
    provider_account_id, module_id, enrollment_status, selling_enabled, service_enabled, payout_eligible,
    approved_by_user_id, approved_at, disabled_reason, created_at, updated_at
)
VALUES
    (@provider_101, @marketplace_module_id, 'APPROVED', TRUE, FALSE, TRUE, @super_admin_user_id, NOW(6), NULL, NOW(6), NOW(6)),
    (@provider_102, @marketplace_module_id, 'APPROVED', TRUE, FALSE, TRUE, @super_admin_user_id, NOW(6), NULL, NOW(6), NOW(6)),
    (@provider_103, @marketplace_module_id, 'APPROVED', TRUE, FALSE, TRUE, @super_admin_user_id, NOW(6), NULL, NOW(6), NOW(6)),
    (@provider_104, @marketplace_module_id, 'APPROVED', TRUE, FALSE, TRUE, @super_admin_user_id, NOW(6), NULL, NOW(6), NOW(6));

INSERT INTO user_module_access (
    user_id, module_id, provider_account_id, access_type, access_status, assigned_by_user_id, assigned_at, revoked_by_user_id, revoked_at
)
VALUES
    (@customer_user_id, @marketplace_module_id, NULL, 'CUSTOMER', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@customer_user_id, @wallet_module_id, NULL, 'CUSTOMER', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@seller_user_id, @marketplace_module_id, @provider_101, 'PROVIDER_OWNER', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@seller_user_id, @wallet_module_id, @provider_101, 'PROVIDER_OWNER', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@seller_user_id, @payments_module_id, @provider_101, 'PROVIDER_OWNER', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@admin_user_id, @marketplace_module_id, NULL, 'ADMIN', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@admin_user_id, @wallet_module_id, NULL, 'ADMIN', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@admin_user_id, @payments_module_id, NULL, 'ADMIN', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@super_admin_user_id, @marketplace_module_id, NULL, 'ADMIN', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@super_admin_user_id, @wallet_module_id, NULL, 'ADMIN', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL),
    (@super_admin_user_id, @payments_module_id, NULL, 'ADMIN', 'ACTIVE', @super_admin_user_id, NOW(6), NULL, NULL);

INSERT INTO user_application_access (user_id, application_id, assigned_at, assigned_by)
SELECT @customer_user_id, id, NOW(6), @super_admin_user_id FROM application WHERE app_code IN ('SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_WALLET');

INSERT INTO user_application_access (user_id, application_id, assigned_at, assigned_by)
SELECT @seller_user_id, id, NOW(6), @super_admin_user_id FROM application WHERE app_code IN ('SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_SELLER', 'SHARITY_WALLET');

INSERT INTO user_application_access (user_id, application_id, assigned_at, assigned_by)
SELECT @admin_user_id, id, NOW(6), @super_admin_user_id FROM application WHERE app_code IN ('SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_PAYMENT', 'SHARITY_WALLET', 'SHARITY_ADMIN');

INSERT INTO user_application_access (user_id, application_id, assigned_at, assigned_by)
SELECT @super_admin_user_id, id, NOW(6), @super_admin_user_id FROM application WHERE app_code IN ('SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_PAYMENT', 'SHARITY_WALLET', 'SHARITY_ADMIN');
