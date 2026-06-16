DELETE FROM dispute_event;
DELETE FROM dispute_evidence;
DELETE FROM dispute;
DELETE FROM payment_event_outbox;
DELETE FROM payment_webhook_event;
DELETE FROM refund_transaction;
DELETE FROM provider_payout;
DELETE FROM payment_transaction;
DELETE FROM payment_order;

ALTER TABLE dispute_event AUTO_INCREMENT = 1;
ALTER TABLE dispute_evidence AUTO_INCREMENT = 1;
ALTER TABLE dispute AUTO_INCREMENT = 1;
ALTER TABLE payment_event_outbox AUTO_INCREMENT = 1;
ALTER TABLE payment_webhook_event AUTO_INCREMENT = 1;
ALTER TABLE refund_transaction AUTO_INCREMENT = 1;
ALTER TABLE provider_payout AUTO_INCREMENT = 1;
ALTER TABLE payment_transaction AUTO_INCREMENT = 1;
ALTER TABLE payment_order AUTO_INCREMENT = 1;

INSERT INTO payment_order (
    public_id, marketplace_order_public_id, customer_user_public_id, provider_account_public_id, currency_code,
    customer_charge_amount, platform_fee_amount, provider_payable_amount, payment_provider, provider_payment_reference,
    payment_status, payout_eligibility_status, created_at, updated_at
)
VALUES
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201',
     '11111111-1111-1111-1111-111111111101', 'USD', 26.25, 1.25, 23.75, 'STRIPE_TEST', 'pi_demo_1001',
     'CAPTURED', 'ELIGIBLE', NOW(6), NOW(6)),
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201',
     '11111111-1111-1111-1111-111111111103', 'USD', 82.95, 3.95, 75.05, 'PAYPAL_MOCK', 'pp_demo_1002',
     'CAPTURED', 'ELIGIBLE', NOW(6), NOW(6));

SET @payment_order_1_id := (SELECT id FROM payment_order WHERE public_id = '44444444-4444-4444-4444-444444444401');
SET @payment_order_2_id := (SELECT id FROM payment_order WHERE public_id = '44444444-4444-4444-4444-444444444402');

INSERT INTO payment_transaction (
    public_id, payment_order_id, transaction_type, amount, currency_code, provider_transaction_reference,
    transaction_status, failure_code, failure_message, created_at
)
VALUES
    ('44444444-4444-4444-4444-444444444501', @payment_order_1_id, 'CAPTURE', 26.25, 'USD', 'pi_demo_1001',
     'CAPTURED', NULL, NULL, NOW(6)),
    ('44444444-4444-4444-4444-444444444502', @payment_order_2_id, 'CAPTURE', 82.95, 'USD', 'pp_demo_1002',
     'CAPTURED', NULL, NULL, NOW(6));

INSERT INTO provider_payout (
    public_id, payment_order_id, provider_account_public_id, amount, currency_code, payout_status, payout_hold_reason,
    payment_provider, provider_payout_reference, eligible_at, release_requested_at, paid_at, created_at, updated_at
)
VALUES
    ('44444444-4444-4444-4444-444444444601', @payment_order_1_id, '11111111-1111-1111-1111-111111111101',
     23.75, 'USD', 'PAID', NULL, 'STRIPE_TEST', 'payout_demo_1001', NOW(6), NOW(6), NOW(6), NOW(6), NOW(6)),
    ('44444444-4444-4444-4444-444444444602', @payment_order_2_id, '11111111-1111-1111-1111-111111111103',
     75.05, 'USD', 'PAID', NULL, 'PAYPAL_MOCK', 'payout_demo_1002', NOW(6), NOW(6), NOW(6), NOW(6), NOW(6));
