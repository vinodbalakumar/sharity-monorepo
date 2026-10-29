\set ON_ERROR_STOP on
\if :{?confirm_local_demo}
\else
    DO $$ BEGIN
        RAISE EXCEPTION 'Pass -v confirm_local_demo=true for the disposable local test1 database';
    END $$;
\endif
\if :confirm_local_demo
\else
    DO $$ BEGIN
        RAISE EXCEPTION 'Refusing to seed without explicit local demo confirmation';
    END $$;
\endif

BEGIN;

DO $$
BEGIN
    IF current_database() <> 'test1'
        OR inet_server_addr() IS NULL
        OR inet_server_addr() NOT IN ('127.0.0.1'::inet, '::1'::inet) THEN
        RAISE EXCEPTION 'This demo seed is restricted to the loopback-hosted test1 database';
    END IF;
END $$;

CREATE TEMP TABLE storefront_demo_candidates ON COMMIT DROP AS
WITH eligible AS (
    SELECT l.*,
        ROW_NUMBER() OVER (PARTITION BY l.category_code ORDER BY l.public_id) AS category_position,
        EXISTS (
            SELECT 1 FROM order_header o
            WHERE o.listing_id = l.id
                AND o.payment_status IN ('CAPTURED', 'PAID', 'COMPLETED')
                AND o.order_status NOT IN ('CANCELLED', 'REFUNDED', 'REFUND_REQUESTED')
                AND (o.purchase_request_key IS NULL
                    OR o.purchase_request_key NOT LIKE 'local-storefront-demo:%')
        ) AS already_ranked
    FROM listing l
    JOIN listing_status_master s ON s.status_code = l.listing_status
    WHERE l.demo_seed = TRUE AND s.active = TRUE AND s.customer_visible = TRUE
        AND l.stock_quantity > 0 AND l.price_amount >= 0
        AND NULLIF(TRIM(l.provider_account_public_id), '') IS NOT NULL
        AND NULLIF(TRIM(l.created_by_user_public_id), '') IS NOT NULL
)
SELECT * FROM eligible
ORDER BY already_ranked DESC, category_position, category_code, public_id
LIMIT 8;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM storefront_demo_candidates) <> 8 THEN
        RAISE EXCEPTION 'Eight eligible demo listings are required; no sales have been seeded';
    END IF;
END $$;

-- Stable IDs and a reserved synthetic buyer isolate these rows from real orders.
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
    md5('local-storefront-demo:' || l.public_id)::uuid::text,
    l.id, '00000000-0000-4000-8000-00000000d008',
    l.provider_account_public_id, l.created_by_user_public_id,
    NULL, NULLIF(TRIM(l.provider_country_code), ''), l.currency_code,
    l.price_amount, 0, l.price_amount, l.price_amount,
    'COMPLETED', 'CAPTURED',
    CASE WHEN l.product_type = 'DIGITAL' THEN 'ACCESS_READY' ELSE 'DELIVERED' END, 'PAID',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'local-storefront-demo:' || l.public_id
FROM storefront_demo_candidates l
ON CONFLICT (public_id) DO UPDATE SET
    purchased_at = EXCLUDED.purchased_at,
    provider_delivered_at = EXCLUDED.provider_delivered_at,
    customer_accepted_at = EXCLUDED.customer_accepted_at,
    completed_at = EXCLUDED.completed_at,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at
WHERE order_header.customer_user_public_id = EXCLUDED.customer_user_public_id
    AND order_header.purchase_request_key = EXCLUDED.purchase_request_key
    AND order_header.listing_id = EXCLUDED.listing_id
    AND order_header.order_status = 'COMPLETED'
    AND order_header.payment_status = 'CAPTURED';

DO $$
BEGIN
    IF (
        SELECT COUNT(*) FROM storefront_demo_candidates l
        JOIN order_header o ON o.public_id = md5('local-storefront-demo:' || l.public_id)::uuid::text
        WHERE o.customer_user_public_id = '00000000-0000-4000-8000-00000000d008'
            AND o.purchase_request_key = 'local-storefront-demo:' || l.public_id
            AND o.listing_id = l.id AND o.order_status = 'COMPLETED'
            AND o.payment_status = 'CAPTURED' AND o.created_at = CURRENT_TIMESTAMP
    ) <> 8 THEN
        RAISE EXCEPTION 'Demo order identity collision; no changes have been committed';
    END IF;
END $$;

SELECT public_id, title, category_code FROM storefront_demo_candidates
ORDER BY category_code, public_id;

COMMIT;
