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
    updated_at = NOW(6)
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
       NOW(6), NOW(6)
FROM service_module module
CROSS JOIN supported_country country
WHERE module.module_code IN ('MARKETPLACE', 'GROCERY', 'MEAT_SHOP', 'PHARMACY', 'AUTOMOTIVE', 'GIFT_CARDS', 'WALLET', 'PAYMENTS')
ON DUPLICATE KEY UPDATE
    customer_enabled = VALUES(customer_enabled),
    provider_onboarding_enabled = VALUES(provider_onboarding_enabled),
    payout_enabled = VALUES(payout_enabled),
    disabled_reason = VALUES(disabled_reason),
    updated_at = NOW(6);
