DELETE FROM asset_upload_event;
DELETE FROM cart_item;
DELETE FROM cart;
DELETE FROM customer_acceptance;
DELETE FROM delivery_submission;
DELETE FROM order_status_history;
DELETE FROM dispute_case;
DELETE FROM marketplace_event_outbox;
DELETE FROM order_header;

ALTER TABLE asset_upload_event ALTER COLUMN id RESTART WITH 1;
ALTER TABLE cart_item ALTER COLUMN id RESTART WITH 1;
ALTER TABLE cart ALTER COLUMN id RESTART WITH 1;
ALTER TABLE customer_acceptance ALTER COLUMN id RESTART WITH 1;
ALTER TABLE delivery_submission ALTER COLUMN id RESTART WITH 1;
ALTER TABLE order_status_history ALTER COLUMN id RESTART WITH 1;
ALTER TABLE dispute_case ALTER COLUMN id RESTART WITH 1;
ALTER TABLE marketplace_event_outbox ALTER COLUMN id RESTART WITH 1;
ALTER TABLE order_header ALTER COLUMN id RESTART WITH 1;

DO $$
DECLARE
    v_customer_public_id CHAR(36) := '22222222-2222-2222-2222-222222222201';
    v_seller_public_id CHAR(36) := '22222222-2222-2222-2222-222222222202';
    v_digital_listing_public_id CHAR(36) := 'sharity-digital-gift-001';
    v_physical_listing_public_id CHAR(36) := 'sharity-jewellery-001';
    v_digital_provider_public_id CHAR(36) := '11111111-1111-1111-1111-111111111101';
    v_physical_provider_public_id CHAR(36) := '11111111-1111-1111-1111-111111111103';
    v_digital_listing_id BIGINT;
    v_physical_listing_id BIGINT;
    v_cart_db_id BIGINT;
    v_order_1_id BIGINT;
    v_order_2_id BIGINT;
BEGIN
    SELECT id INTO v_digital_listing_id FROM listing WHERE public_id = v_digital_listing_public_id;
    SELECT id INTO v_physical_listing_id FROM listing WHERE public_id = v_physical_listing_public_id;

    INSERT INTO cart (
        cart_id, customer_id, total_items, subtotal, discount_amount, tax_amount, total, currency_code, cart_status,
        last_modified_at, created_at
    )
    VALUES (
        'cart-1001', v_customer_public_id, 1, 79.0000, 0.0000, 0.0000, 79.0000, 'USD', 'ACTIVE',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

    SELECT id INTO v_cart_db_id FROM cart WHERE cart_id = 'cart-1001';

    INSERT INTO cart_item (
        cart_item_id, cart_id, listing_id, listing_title, provider_id, provider_name, quantity, unit_price, line_total,
        discount_per_unit, line_discount, delivery_type, vertical_code, item_status, added_at, updated_at
    )
    VALUES (
        'cart-item-1001', v_cart_db_id, v_physical_listing_public_id, 'Imitation Jewellery Pendant Set',
        v_physical_provider_public_id, 'Sharity Jewellery Atelier', 1, 79.0000, 79.0000, 0.0000, 0.0000,
        'SHIPPING', 'JEWELLERY', 'ADDED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

    INSERT INTO order_header (
        public_id, listing_id, customer_user_public_id, provider_account_public_id, provider_owner_user_public_id,
        customer_country_code, provider_country_code, transaction_currency_code, item_amount, platform_fee_amount,
        customer_total_amount, provider_expected_amount, order_status, payment_status, fulfillment_status, payout_status,
        purchased_at, provider_delivered_at, customer_accepted_at, dispute_opened_at, completed_at, created_at, updated_at
    )
    VALUES
        ('33333333-3333-3333-3333-333333333301', v_digital_listing_id, v_customer_public_id, v_digital_provider_public_id,
         v_seller_public_id, 'USA', 'USA', 'USD', 25.0000, 1.2500, 26.2500, 23.7500, 'COMPLETED', 'CAPTURED',
         'ACCESS_READY', 'PAID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('33333333-3333-3333-3333-333333333302', v_physical_listing_id, v_customer_public_id, v_physical_provider_public_id,
         v_seller_public_id, 'USA', 'USA', 'USD', 79.0000, 3.9500, 82.9500, 75.0500, 'COMPLETED', 'CAPTURED',
         'DELIVERED', 'PAID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    SELECT id INTO v_order_1_id FROM order_header WHERE public_id = '33333333-3333-3333-3333-333333333301';
    SELECT id INTO v_order_2_id FROM order_header WHERE public_id = '33333333-3333-3333-3333-333333333302';

    INSERT INTO order_status_history (
        order_id, status_type, old_status, new_status, changed_by_user_public_id, reason, created_at
    )
    VALUES
        (v_order_1_id, 'ORDER', 'PENDING', 'COMPLETED', v_customer_public_id, 'Digital order completed in demo seed', CURRENT_TIMESTAMP),
        (v_order_2_id, 'ORDER', 'PENDING', 'COMPLETED', v_seller_public_id, 'Jewellery order completed in demo seed', CURRENT_TIMESTAMP);

    INSERT INTO delivery_submission (
        order_id, submitted_by_user_public_id, delivery_method, delivery_reference, provider_notes, submitted_at
    )
    VALUES
        (v_order_1_id, v_seller_public_id, 'INSTANT', 'Secure digital reveal completed', 'Digital delivery is ready for buyer reveal.', CURRENT_TIMESTAMP),
        (v_order_2_id, v_seller_public_id, 'SHIPPING', 'TRK-DEMO-1002', 'Packed and handed to shipping partner.', CURRENT_TIMESTAMP);

    INSERT INTO customer_acceptance (
        order_id, customer_user_public_id, acceptance_status, customer_notes, confirmed_at, created_at
    )
    VALUES
        (v_order_1_id, v_customer_public_id, 'ACCEPTED', 'Digital item received successfully.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_order_2_id, v_customer_public_id, 'ACCEPTED', 'Item looks good and matches the listing.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
END $$;
