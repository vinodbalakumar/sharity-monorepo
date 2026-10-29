-- Manual MySQL 8 local demo seed; never run as a startup migration.
-- Connect to loopback and set @confirm_local_demo=1 and @local_demo_hostname
-- to the independently verified local server hostname before sourcing this file.
-- Run in batch mode without --force so any failed guard closes/rolls back the session.
CREATE TEMPORARY TABLE storefront_demo_guard (
    approved BOOLEAN NOT NULL CHECK (approved = TRUE)
);
INSERT INTO storefront_demo_guard VALUES (
    COALESCE(@confirm_local_demo = 1 AND DATABASE() = 'marketplace_db'
        AND @@hostname = @local_demo_hostname, FALSE)
);

START TRANSACTION;
SET @storefront_demo_time = NOW(6);

CREATE TEMPORARY TABLE storefront_demo_candidates AS
SELECT eligible.* FROM (
    SELECT l.*,
        ROW_NUMBER() OVER (PARTITION BY l.category_code ORDER BY l.public_id) AS category_position
    FROM listing l
    JOIN listing_status_master s ON s.status_code = l.listing_status
    WHERE l.demo_seed = TRUE AND s.active = TRUE AND s.customer_visible = TRUE
        AND l.stock_quantity > 0 AND l.price_amount >= 0
        AND NULLIF(TRIM(l.provider_account_public_id), '') IS NOT NULL
        AND NULLIF(TRIM(l.created_by_user_public_id), '') IS NOT NULL
) eligible
ORDER BY category_position, category_code, public_id
LIMIT 24;

INSERT INTO storefront_demo_guard
SELECT COUNT(*) = 24 FROM storefront_demo_candidates;

-- Stable IDs and the reserved synthetic buyer isolate demo orders from real sales.
INSERT INTO order_header (
    public_id, listing_id, customer_user_public_id,
    provider_account_public_id, provider_owner_user_public_id,
    customer_country_code, provider_country_code, transaction_currency_code,
    item_amount, platform_fee_amount, customer_total_amount, provider_expected_amount,
    order_status, payment_status, fulfillment_status, payout_status,
    purchased_at, provider_delivered_at, customer_accepted_at, completed_at,
    created_at, updated_at, purchase_request_key
)
SELECT
    MD5(CONCAT('local-storefront-demo:', l.public_id)),
    l.id, '00000000-0000-4000-8000-00000000d008',
    l.provider_account_public_id, l.created_by_user_public_id,
    NULL, NULLIF(TRIM(l.provider_country_code), ''), l.currency_code,
    l.price_amount, 0, l.price_amount, l.price_amount,
    'COMPLETED', 'CAPTURED',
    CASE WHEN l.product_type = 'DIGITAL' THEN 'ACCESS_READY' ELSE 'DELIVERED' END, 'PAID',
    @storefront_demo_time, @storefront_demo_time, @storefront_demo_time, @storefront_demo_time,
    @storefront_demo_time, @storefront_demo_time, CONCAT('local-storefront-demo:', l.public_id)
FROM storefront_demo_candidates l
WHERE NOT EXISTS (
    SELECT 1 FROM order_header o
    WHERE o.public_id = MD5(CONCAT('local-storefront-demo:', l.public_id))
        OR o.purchase_request_key = CONCAT('local-storefront-demo:', l.public_id)
);

UPDATE order_header o
JOIN storefront_demo_candidates l ON l.id = o.listing_id
SET o.purchased_at = @storefront_demo_time,
    o.provider_delivered_at = @storefront_demo_time,
    o.customer_accepted_at = @storefront_demo_time,
    o.completed_at = @storefront_demo_time,
    o.created_at = @storefront_demo_time,
    o.updated_at = @storefront_demo_time
WHERE o.public_id = MD5(CONCAT('local-storefront-demo:', l.public_id))
    AND o.customer_user_public_id = '00000000-0000-4000-8000-00000000d008'
    AND o.purchase_request_key = CONCAT('local-storefront-demo:', l.public_id)
    AND o.order_status = 'COMPLETED' AND o.payment_status = 'CAPTURED';

-- Abort on identity collisions; never overwrite an unrelated order.
INSERT INTO storefront_demo_guard
SELECT COUNT(*) = 24
FROM storefront_demo_candidates l
JOIN order_header o ON o.listing_id = l.id
WHERE o.public_id = MD5(CONCAT('local-storefront-demo:', l.public_id))
    AND o.customer_user_public_id = '00000000-0000-4000-8000-00000000d008'
    AND o.purchase_request_key = CONCAT('local-storefront-demo:', l.public_id)
    AND o.order_status = 'COMPLETED' AND o.payment_status = 'CAPTURED'
    AND o.created_at = @storefront_demo_time;

SELECT public_id, title, category_code FROM storefront_demo_candidates
ORDER BY category_position, category_code, public_id;
COMMIT;
DROP TEMPORARY TABLE storefront_demo_candidates;
DROP TEMPORARY TABLE storefront_demo_guard;
