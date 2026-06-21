-- Seed homepage order history so the public home page can show the most selected products

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-001', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-rings-001';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-002', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-rings-002';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-003', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-rings-003';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-004', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-rings-004';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-005', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-earrings-001';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-006', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-earrings-002';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-007', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-earrings-003';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-008', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-giftcard-001';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-009', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-gaming-001';

INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
    customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
)
SELECT
    'homepage-popular-010', l.id, '22222222-2222-2222-2222-222222222299', l.provider_account_public_id,
    '22222222-2222-2222-2222-222222222290', 'USA', 'USA', l.currency_code, l.price_amount, 1.2500,
    l.price_amount + 1.2500, l.price_amount - 1.2500, 'COMPLETED', 'CAPTURED', 'DELIVERED', 'PAID',
    NOW(), NOW(), NOW(), NULL, NOW(), NOW(), NOW()
FROM listing l
WHERE l.public_id = 'sold-rings-005';
