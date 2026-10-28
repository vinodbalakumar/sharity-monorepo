-- Historical demo reset: run only as part of the existing migration sequence.
TRUNCATE TABLE user_application_access, application, provider_module_enrollment,
    user_module_access, user_restriction, provider_account, social_registration_session,
    user_social_identities, user_login_method, refresh_token, email_verification_token,
    password_reset_token, login_attempt, audit_log, email_delivery_log, user_role,
    user_credential, user_profile, app_user RESTART IDENTITY;

INSERT INTO app_role (role_name, description, created_at)
VALUES
    ('USER', 'Default application user', CURRENT_TIMESTAMP(6)),
    ('BUYER', 'Buyer account role', CURRENT_TIMESTAMP(6)),
    ('CUSTOMER', 'Verified customer account', CURRENT_TIMESTAMP(6)),
    ('SELLER', 'Seller account role', CURRENT_TIMESTAMP(6)),
    ('ADMIN', 'Administrator with user-management privileges', CURRENT_TIMESTAMP(6)),
    ('SUPER_ADMIN', 'Highest privilege administrator', CURRENT_TIMESTAMP(6)),
    ('MODULE_ADMIN', 'Service module administrator', CURRENT_TIMESTAMP(6)),
    ('FINANCE_ADMIN', 'Payment and payout administrator', CURRENT_TIMESTAMP(6)),
    ('COMPLIANCE_ADMIN', 'Compliance administrator', CURRENT_TIMESTAMP(6)),
    ('DISPUTE_AGENT', 'Marketplace dispute operator', CURRENT_TIMESTAMP(6)),
    ('SUPPORT_AGENT', 'Customer support operator', CURRENT_TIMESTAMP(6))
ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO application (app_code, app_name, description, active, created_at)
VALUES
    ('SHARITY_WEB', 'Sharity Web App', 'Primary Sharity web storefront', TRUE, CURRENT_TIMESTAMP(6)),
    ('SHARITY_MARKETPLACE', 'Sharity Marketplace', 'Marketplace customer and seller experience', TRUE, CURRENT_TIMESTAMP(6)),
    ('SHARITY_SELLER', 'Sharity Seller Console', 'Seller account and store management experience', TRUE, CURRENT_TIMESTAMP(6)),
    ('SHARITY_WALLET', 'Sharity Wallet', 'Wallet summary and ledger experience', TRUE, CURRENT_TIMESTAMP(6)),
    ('SHARITY_PAYMENT', 'Sharity Payments', 'Payment and payout operations experience', TRUE, CURRENT_TIMESTAMP(6)),
    ('SHARITY_ADMIN', 'Sharity Admin Console', 'Administrative management console', TRUE, CURRENT_TIMESTAMP(6))
ON CONFLICT (app_code) DO UPDATE SET
    app_name = EXCLUDED.app_name, description = EXCLUDED.description, active = EXCLUDED.active;

INSERT INTO app_user (
    public_id, email, normalized_email, username, normalized_username, status,
    email_verified, phone_verified, profile_completion_status, profile_completed_at, terms_accepted_at,
    failed_login_count, locked_until, last_login_at, created_at, updated_at, deleted_at
)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'customer@sharity.local', 'customer@sharity.local', 'customer.demo', 'customer.demo',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), 0, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), NULL),
    ('22222222-2222-2222-2222-222222222202', 'vinodbalakumar0594@gmail.com', 'vinodbalakumar0594@gmail.com', 'vinod.balakumar', 'vinod.balakumar',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), 0, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), NULL),
    ('22222222-2222-2222-2222-222222222203', 'admin@sharity.local', 'admin@sharity.local', 'admin.demo', 'admin.demo',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), 0, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), NULL),
    ('22222222-2222-2222-2222-222222222204', 'superadmin@sharity.local', 'superadmin@sharity.local', 'superadmin.demo', 'superadmin.demo',
     'ACTIVE', TRUE, TRUE, 'COMPLETE', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), 0, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), NULL);

INSERT INTO user_credential (user_id, password_hash, password_changed_at, password_reset_required, created_at, updated_at)
SELECT id, '$2a$10$u7t/x3OARkTJ23ZOZj/8qejFm0TbGDqrbPcF2t0KCbokewm6dxLMi',
       CURRENT_TIMESTAMP(6), FALSE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM app_user;

INSERT INTO user_profile (
    user_id, first_name, last_name, phone_number, profile_image_url, country_code, country_name,
    phone_dial_code, date_of_birth, gender, preferred_currency, preferred_timezone, locale, created_at, updated_at
)
SELECT u.id, p.first_name, p.last_name, p.phone_number, NULL, 'USA', 'United States',
       '+1', p.date_of_birth::date, p.gender, 'USD', 'America/Phoenix', 'en-US', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM (VALUES
    ('customer.demo', 'Priya', 'Shah', '4155550101', '1998-02-06', 'FEMALE'),
    ('vinod.balakumar', 'Vinod', 'Balakumar', '4155550102', '1990-08-14', 'MALE'),
    ('admin.demo', 'Asha', 'Mehta', '4155550103', '1992-04-22', 'FEMALE'),
    ('superadmin.demo', 'Sharity', 'Admin', '4155550104', '1988-11-03', 'OTHER')
) AS p(username, first_name, last_name, phone_number, date_of_birth, gender)
JOIN app_user u ON u.username = p.username;

INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
SELECT u.id, r.id, CURRENT_TIMESTAMP(6), admin.id
FROM app_user u
CROSS JOIN app_role r
JOIN app_user admin ON admin.username = 'superadmin.demo'
WHERE (u.username = 'customer.demo' AND r.role_name IN ('USER', 'BUYER', 'CUSTOMER'))
   OR (u.username = 'vinod.balakumar' AND r.role_name IN ('USER', 'BUYER', 'SELLER'))
   OR (u.username = 'admin.demo' AND r.role_name IN ('USER', 'ADMIN'))
   OR (u.username = 'superadmin.demo' AND r.role_name IN (
       'USER', 'ADMIN', 'SUPER_ADMIN', 'MODULE_ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_ADMIN', 'DISPUTE_AGENT', 'SUPPORT_AGENT'));

INSERT INTO user_login_method (
    user_id, provider, provider_subject, provider_email, provider_email_verified, password_credential_id, enabled, created_at, updated_at
)
SELECT u.id, 'LOCAL', NULL, u.email, TRUE, c.id, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM app_user u JOIN user_credential c ON c.user_id = u.id;

INSERT INTO provider_account (
    public_id, owner_user_id, provider_type, display_name, seller_scope, country_code, default_currency_code,
    verification_status, overall_status, payment_provider, payment_provider_account_ref, payouts_enabled, charges_enabled,
    created_at, updated_at
)
SELECT p.public_id, u.id, 'INDIVIDUAL', p.display_name, 'GLOBAL', 'USA', 'USD',
       'APPROVED', 'ACTIVE', NULL, NULL, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM (VALUES
    ('11111111-1111-1111-1111-111111111101', 'Sharity Digital Deals'),
    ('11111111-1111-1111-1111-111111111102', 'Sharity Gaming Vault'),
    ('11111111-1111-1111-1111-111111111103', 'Sharity Jewellery Atelier'),
    ('11111111-1111-1111-1111-111111111104', 'Sharity Jewellery Studio')
) AS p(public_id, display_name)
JOIN app_user u ON u.username = 'vinod.balakumar';

INSERT INTO provider_module_enrollment (
    provider_account_id, module_id, enrollment_status, selling_enabled, service_enabled, payout_eligible,
    approved_by_user_id, approved_at, disabled_reason, created_at, updated_at
)
SELECT p.id, m.id, 'APPROVED', TRUE, FALSE, TRUE, admin.id, CURRENT_TIMESTAMP(6), NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM provider_account p
JOIN service_module m ON m.module_code = 'MARKETPLACE'
JOIN app_user admin ON admin.username = 'superadmin.demo';

INSERT INTO user_module_access (
    user_id, module_id, provider_account_id, access_type, access_status, assigned_by_user_id, assigned_at, revoked_by_user_id, revoked_at
)
SELECT u.id, m.id, p.id, CASE u.username
    WHEN 'customer.demo' THEN 'CUSTOMER'
    WHEN 'vinod.balakumar' THEN 'PROVIDER_OWNER'
    ELSE 'ADMIN' END,
    'ACTIVE', admin.id, CURRENT_TIMESTAMP(6), NULL, NULL
FROM app_user u
JOIN service_module m ON m.module_code IN ('MARKETPLACE', 'WALLET', 'PAYMENTS')
JOIN app_user admin ON admin.username = 'superadmin.demo'
LEFT JOIN provider_account p ON u.username = 'vinod.balakumar'
    AND p.public_id = '11111111-1111-1111-1111-111111111101'
WHERE u.username <> 'customer.demo' OR m.module_code <> 'PAYMENTS';

INSERT INTO user_application_access (user_id, application_id, assigned_at, assigned_by)
SELECT u.id, a.id, CURRENT_TIMESTAMP(6), admin.id
FROM app_user u
CROSS JOIN application a
JOIN app_user admin ON admin.username = 'superadmin.demo'
WHERE (u.username = 'customer.demo' AND a.app_code IN ('SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_WALLET'))
   OR (u.username = 'vinod.balakumar' AND a.app_code IN ('SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_SELLER', 'SHARITY_WALLET'))
   OR (u.username IN ('admin.demo', 'superadmin.demo') AND a.app_code IN (
       'SHARITY_WEB', 'SHARITY_MARKETPLACE', 'SHARITY_PAYMENT', 'SHARITY_WALLET', 'SHARITY_ADMIN'));
