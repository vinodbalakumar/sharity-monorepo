DELETE FROM wallet_event_inbox;
DELETE FROM wallet_balance_snapshot;
DELETE FROM wallet_ledger_entry;
DELETE FROM wallet_account;

ALTER TABLE wallet_event_inbox AUTO_INCREMENT = 1;
ALTER TABLE wallet_balance_snapshot AUTO_INCREMENT = 1;
ALTER TABLE wallet_ledger_entry AUTO_INCREMENT = 1;
ALTER TABLE wallet_account AUTO_INCREMENT = 1;

INSERT INTO wallet_account (
    public_id, owner_type, owner_public_id, currency_code, wallet_status, created_at, updated_at
)
VALUES
    ('66666666-6666-6666-6666-666666666601', 'CUSTOMER', '22222222-2222-2222-2222-222222222201', 'USD', 'ACTIVE', NOW(6), NOW(6)),
    ('66666666-6666-6666-6666-666666666602', 'PROVIDER_ACCOUNT', '11111111-1111-1111-1111-111111111101', 'USD', 'ACTIVE', NOW(6), NOW(6)),
    ('66666666-6666-6666-6666-666666666603', 'PROVIDER_ACCOUNT', '11111111-1111-1111-1111-111111111103', 'USD', 'ACTIVE', NOW(6), NOW(6));

SET @customer_wallet_id := (SELECT id FROM wallet_account WHERE public_id = '66666666-6666-6666-6666-666666666601');
SET @provider_101_wallet_id := (SELECT id FROM wallet_account WHERE public_id = '66666666-6666-6666-6666-666666666602');
SET @provider_103_wallet_id := (SELECT id FROM wallet_account WHERE public_id = '66666666-6666-6666-6666-666666666603');

INSERT INTO wallet_event_inbox (
    source_service, source_event_id, event_type, payload_json, processing_status, received_at, processed_at
)
VALUES
    ('PAYMENT', 'payment-capture-1001', 'PAYMENT_CAPTURED', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'payment-capture-1002', 'PAYMENT_CAPTURED', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'provider-pending-1001', 'PROVIDER_PENDING_EARNING', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'payout-eligible-1001', 'PAYOUT_ELIGIBLE', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'payout-paid-1001', 'PAYOUT_PAID', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'provider-pending-1002', 'PROVIDER_PENDING_EARNING', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'payout-eligible-1002', 'PAYOUT_ELIGIBLE', '{}', 'PROCESSED', NOW(6), NOW(6)),
    ('PAYMENT', 'payout-paid-1002', 'PAYOUT_PAID', '{}', 'PROCESSED', NOW(6), NOW(6));

INSERT INTO wallet_ledger_entry (
    public_id, wallet_account_id, source_service, source_event_id, marketplace_order_public_id, payment_order_public_id,
    entry_type, direction, amount, currency_code, entry_status, description, created_at
)
VALUES
    ('77777777-7777-7777-7777-777777777701', @customer_wallet_id, 'PAYMENT', 'payment-capture-1001',
     '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
     'CUSTOMER_PAYMENT', 'DEBIT', 26.2500, 'USD', 'POSTED', 'Digital order payment captured', NOW(6)),
    ('77777777-7777-7777-7777-777777777702', @customer_wallet_id, 'PAYMENT', 'payment-capture-1002',
     '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444402',
     'CUSTOMER_PAYMENT', 'DEBIT', 82.9500, 'USD', 'POSTED', 'Jewellery order payment captured', NOW(6)),
    ('77777777-7777-7777-7777-777777777703', @provider_101_wallet_id, 'PAYMENT', 'provider-pending-1001',
     '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
     'PROVIDER_PENDING_EARNING', 'CREDIT', 23.7500, 'USD', 'POSTED', 'Digital order pending earning', NOW(6)),
    ('77777777-7777-7777-7777-777777777704', @provider_101_wallet_id, 'PAYMENT', 'payout-eligible-1001',
     '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
     'PROVIDER_AVAILABLE_EARNING', 'CREDIT', 23.7500, 'USD', 'POSTED', 'Digital order released for payout', NOW(6)),
    ('77777777-7777-7777-7777-777777777705', @provider_101_wallet_id, 'PAYMENT', 'payout-paid-1001',
     '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
     'PROVIDER_PAYOUT', 'DEBIT', 23.7500, 'USD', 'POSTED', 'Digital order payout paid', NOW(6)),
    ('77777777-7777-7777-7777-777777777706', @provider_103_wallet_id, 'PAYMENT', 'provider-pending-1002',
     '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444402',
     'PROVIDER_PENDING_EARNING', 'CREDIT', 75.0500, 'USD', 'POSTED', 'Jewellery order pending earning', NOW(6)),
    ('77777777-7777-7777-7777-777777777707', @provider_103_wallet_id, 'PAYMENT', 'payout-eligible-1002',
     '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444402',
     'PROVIDER_AVAILABLE_EARNING', 'CREDIT', 75.0500, 'USD', 'POSTED', 'Jewellery order released for payout', NOW(6)),
    ('77777777-7777-7777-7777-777777777708', @provider_103_wallet_id, 'PAYMENT', 'payout-paid-1002',
     '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444402',
     'PROVIDER_PAYOUT', 'DEBIT', 75.0500, 'USD', 'POSTED', 'Jewellery order payout paid', NOW(6));

INSERT INTO wallet_balance_snapshot (
    wallet_account_id, pending_amount, available_amount, paid_amount, reversed_amount, currency_code, calculated_at
)
VALUES
    (@customer_wallet_id, 0.0000, 0.0000, 109.2000, 0.0000, 'USD', NOW(6)),
    (@provider_101_wallet_id, 0.0000, 0.0000, 23.7500, 0.0000, 'USD', NOW(6)),
    (@provider_103_wallet_id, 0.0000, 0.0000, 75.0500, 0.0000, 'USD', NOW(6));
