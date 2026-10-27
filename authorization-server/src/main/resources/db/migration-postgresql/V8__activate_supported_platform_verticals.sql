UPDATE service_module
SET status = 'ACTIVE',
    customer_access_enabled = CASE module_code
        WHEN 'PAYMENTS' THEN FALSE
        ELSE TRUE
    END,
    provider_access_enabled = CASE module_code
        WHEN 'MARKETPLACE' THEN TRUE
        WHEN 'GROCERY' THEN TRUE
        WHEN 'MEAT_SHOP' THEN TRUE
        WHEN 'PHARMACY' THEN TRUE
        WHEN 'AUTOMOTIVE' THEN TRUE
        WHEN 'GIFT_CARDS' THEN TRUE
        WHEN 'WALLET' THEN FALSE
        WHEN 'PAYMENTS' THEN FALSE
        ELSE provider_access_enabled
    END,
    requires_provider_approval = CASE module_code
        WHEN 'PAYMENTS' THEN FALSE
        WHEN 'WALLET' THEN FALSE
        ELSE TRUE
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE module_code IN ('MARKETPLACE', 'GROCERY', 'MEAT_SHOP', 'PHARMACY', 'AUTOMOTIVE', 'GIFT_CARDS', 'WALLET', 'PAYMENTS');

INSERT INTO service_module_country (
    module_id, country_id, customer_enabled, provider_onboarding_enabled, payout_enabled,
    disabled_reason, created_at, updated_at
)
SELECT module.id, country.id,
       module.customer_access_enabled,
       CASE module.module_code
           WHEN 'MARKETPLACE' THEN country.provider_onboarding_enabled
           WHEN 'GROCERY' THEN country.provider_onboarding_enabled
           WHEN 'MEAT_SHOP' THEN country.provider_onboarding_enabled
           WHEN 'PHARMACY' THEN FALSE
           WHEN 'AUTOMOTIVE' THEN country.provider_onboarding_enabled
           WHEN 'GIFT_CARDS' THEN FALSE
           WHEN 'WALLET' THEN FALSE
           WHEN 'PAYMENTS' THEN FALSE
           ELSE FALSE
       END,
       CASE module.module_code
           WHEN 'PAYMENTS' THEN FALSE
           WHEN 'WALLET' THEN FALSE
           ELSE country.payout_enabled
       END,
       CASE
           WHEN module.module_code = 'PAYMENTS' THEN 'Payments is an internal platform capability'
           WHEN module.module_code = 'WALLET' THEN 'Wallet onboarding is not enabled for this country in V3'
           WHEN module.module_code = 'PHARMACY' THEN 'Pharmacy onboarding is restricted for this country in V3'
           WHEN module.module_code = 'GIFT_CARDS' THEN 'Gift card onboarding is not enabled for this country in V3'
           WHEN country.payout_enabled THEN NULL
           ELSE 'Payout support is not enabled for this country in V3'
       END,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM service_module module
CROSS JOIN supported_country country
WHERE module.module_code IN ('MARKETPLACE', 'GROCERY', 'MEAT_SHOP', 'PHARMACY', 'AUTOMOTIVE', 'GIFT_CARDS', 'WALLET', 'PAYMENTS')
ON CONFLICT (module_id, country_id) DO UPDATE SET
    customer_enabled = EXCLUDED.customer_enabled,
    provider_onboarding_enabled = EXCLUDED.provider_onboarding_enabled,
    payout_enabled = EXCLUDED.payout_enabled,
    disabled_reason = EXCLUDED.disabled_reason,
    updated_at = CURRENT_TIMESTAMP;
