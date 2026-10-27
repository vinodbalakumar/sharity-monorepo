DO $$
DECLARE
    vinod_user_id BIGINT;
    seller_role_id BIGINT;
    vinod_provider_id BIGINT;
    marketplace_module_id BIGINT;
BEGIN
    SELECT id INTO vinod_user_id
    FROM app_user
    WHERE normalized_email = 'vinod@gmail.com'
    LIMIT 1;

    IF vinod_user_id IS NULL THEN
        RETURN;
    END IF;

    SELECT id INTO seller_role_id
    FROM role
    WHERE role_name = 'SELLER'
    LIMIT 1;

    IF seller_role_id IS NOT NULL THEN
        INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
        VALUES (vinod_user_id, seller_role_id, CURRENT_TIMESTAMP(6), NULL)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    SELECT id INTO vinod_provider_id
    FROM provider_account
    WHERE owner_user_id = vinod_user_id
    ORDER BY updated_at DESC, id DESC
    LIMIT 1;

    IF vinod_provider_id IS NULL THEN
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
        VALUES (
            gen_random_uuid()::text,
            vinod_user_id,
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
            CURRENT_TIMESTAMP(6),
            CURRENT_TIMESTAMP(6)
        )
        RETURNING id INTO vinod_provider_id;
    END IF;

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
        updated_at = CURRENT_TIMESTAMP(6)
    WHERE id = vinod_provider_id;

    SELECT id INTO marketplace_module_id
    FROM service_module
    WHERE module_code = 'MARKETPLACE'
    LIMIT 1;

    IF marketplace_module_id IS NULL THEN
        RETURN;
    END IF;

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
    VALUES (
        vinod_provider_id,
        marketplace_module_id,
        'APPROVED',
        TRUE,
        TRUE,
        TRUE,
        vinod_user_id,
        CURRENT_TIMESTAMP(6),
        NULL,
        CURRENT_TIMESTAMP(6),
        CURRENT_TIMESTAMP(6)
    )
    ON CONFLICT (provider_account_id, module_id) DO NOTHING;

    UPDATE provider_module_enrollment
    SET enrollment_status = 'APPROVED',
        selling_enabled = TRUE,
        service_enabled = TRUE,
        payout_eligible = TRUE,
        disabled_reason = NULL,
        approved_by_user_id = vinod_user_id,
        approved_at = CURRENT_TIMESTAMP(6),
        updated_at = CURRENT_TIMESTAMP(6)
    WHERE provider_account_id = vinod_provider_id
      AND module_id = marketplace_module_id;

    IF NOT EXISTS (
        SELECT 1
        FROM user_module_access access
        WHERE access.user_id = vinod_user_id
          AND access.module_id = marketplace_module_id
          AND access.provider_account_id = vinod_provider_id
          AND access.access_type = 'PROVIDER_OWNER'
          AND access.revoked_at IS NULL
    ) THEN
        INSERT INTO user_module_access (
            user_id,
            module_id,
            provider_account_id,
            access_type,
            access_status,
            assigned_by_user_id,
            assigned_at
        )
        VALUES (
            vinod_user_id,
            marketplace_module_id,
            vinod_provider_id,
            'PROVIDER_OWNER',
            'ACTIVE',
            vinod_user_id,
            CURRENT_TIMESTAMP(6)
        );
    END IF;
END $$;
