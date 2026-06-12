SET @vinod_user_id = (
    SELECT id
    FROM app_user
    WHERE normalized_email = 'vinod@gmail.com'
    LIMIT 1
);

SET @seller_role_id = (
    SELECT id
    FROM role
    WHERE role_name = 'SELLER'
    LIMIT 1
);

INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
SELECT @vinod_user_id, @seller_role_id, NOW(6), NULL
FROM DUAL
WHERE @vinod_user_id IS NOT NULL
  AND @seller_role_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM user_role
      WHERE user_id = @vinod_user_id
        AND role_id = @seller_role_id
  );

INSERT INTO provider_account (
    public_id,
    owner_user_id,
    provider_type,
    display_name,
    seller_scope,
    country_code,
    default_currency_code,
    verification_status,
    overall_status,
    payment_provider,
    payment_provider_account_ref,
    payouts_enabled,
    charges_enabled,
    created_at,
    updated_at
)
SELECT
    UUID(),
    @vinod_user_id,
    'INDIVIDUAL',
    'Vinod Seller Store',
    'NATIONAL',
    'USA',
    'USD',
    'APPROVED',
    'ACTIVE',
    'PAYPAL',
    'seed-vinod-marketplace',
    TRUE,
    TRUE,
    NOW(6),
    NOW(6)
FROM DUAL
WHERE @vinod_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM provider_account
      WHERE owner_user_id = @vinod_user_id
  );

SET @vinod_provider_id = (
    SELECT id
    FROM provider_account
    WHERE owner_user_id = @vinod_user_id
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
);

UPDATE provider_account
SET display_name = 'Vinod Seller Store',
    seller_scope = 'NATIONAL',
    country_code = 'USA',
    default_currency_code = 'USD',
    verification_status = 'APPROVED',
    overall_status = 'ACTIVE',
    payment_provider = 'PAYPAL',
    payment_provider_account_ref = 'seed-vinod-marketplace',
    payouts_enabled = TRUE,
    charges_enabled = TRUE,
    updated_at = NOW(6)
WHERE id = @vinod_provider_id;

INSERT INTO provider_module_enrollment (
    provider_account_id,
    module_id,
    enrollment_status,
    selling_enabled,
    service_enabled,
    payout_eligible,
    approved_by_user_id,
    approved_at,
    disabled_reason,
    created_at,
    updated_at
)
SELECT
    @vinod_provider_id,
    module.id,
    'APPROVED',
    TRUE,
    TRUE,
    TRUE,
    @vinod_user_id,
    NOW(6),
    NULL,
    NOW(6),
    NOW(6)
FROM service_module module
WHERE module.module_code = 'MARKETPLACE'
  AND @vinod_provider_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM provider_module_enrollment enrollment
      WHERE enrollment.provider_account_id = @vinod_provider_id
        AND enrollment.module_id = module.id
  );

UPDATE provider_module_enrollment enrollment
JOIN service_module module ON module.id = enrollment.module_id
SET enrollment.enrollment_status = 'APPROVED',
    enrollment.selling_enabled = TRUE,
    enrollment.service_enabled = TRUE,
    enrollment.payout_eligible = TRUE,
    enrollment.disabled_reason = NULL,
    enrollment.approved_by_user_id = @vinod_user_id,
    enrollment.approved_at = NOW(6),
    enrollment.updated_at = NOW(6)
WHERE enrollment.provider_account_id = @vinod_provider_id
  AND module.module_code = 'MARKETPLACE';

INSERT INTO user_module_access (
    user_id,
    module_id,
    provider_account_id,
    access_type,
    access_status,
    assigned_by_user_id,
    assigned_at
)
SELECT
    @vinod_user_id,
    module.id,
    @vinod_provider_id,
    'PROVIDER_OWNER',
    'ACTIVE',
    @vinod_user_id,
    NOW(6)
FROM service_module module
WHERE module.module_code = 'MARKETPLACE'
  AND @vinod_provider_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM user_module_access access
      WHERE access.user_id = @vinod_user_id
        AND access.module_id = module.id
        AND access.provider_account_id = @vinod_provider_id
        AND access.access_type = 'PROVIDER_OWNER'
        AND access.revoked_at IS NULL
  );
