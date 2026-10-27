CREATE TABLE IF NOT EXISTS product_type_master (
    product_type_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (product_type_code)
);

INSERT INTO product_type_master (product_type_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'DIGITAL', 'Digital', 'Digitally delivered products such as codes, downloads, and access.', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM product_type_master WHERE product_type_code = 'DIGITAL');

INSERT INTO product_type_master (product_type_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'PHYSICAL', 'Physical', 'Items that require shipping, pickup, or local handover.', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM product_type_master WHERE product_type_code = 'PHYSICAL');

INSERT INTO product_type_master (product_type_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'SERVICE', 'Service', 'Services, appointments, or work delivered as an outcome.', TRUE, 30, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM product_type_master WHERE product_type_code = 'SERVICE');

INSERT INTO product_type_master (product_type_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'SUBSCRIPTION', 'Subscription', 'Recurring access or membership-based offerings.', TRUE, 40, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM product_type_master WHERE product_type_code = 'SUBSCRIPTION');

INSERT INTO product_type_master (product_type_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'BUNDLE', 'Bundle', 'A grouped set of products or services sold together.', TRUE, 50, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM product_type_master WHERE product_type_code = 'BUNDLE');
