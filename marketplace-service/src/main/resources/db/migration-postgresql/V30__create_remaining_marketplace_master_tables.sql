CREATE TABLE IF NOT EXISTS subcategory_master (
    id BIGSERIAL NOT NULL,
    subcategory_code VARCHAR(50) NOT NULL,
    category_code VARCHAR(50) NOT NULL,
    subcategory_name VARCHAR(120) NOT NULL,
    subcategory_slug VARCHAR(120) NOT NULL,
    icon_ref VARCHAR(255) NULL,
    country_code VARCHAR(3) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_subcategory_master_code UNIQUE (subcategory_code),
    CONSTRAINT uk_subcategory_master_slug UNIQUE (subcategory_slug)
);

CREATE TABLE IF NOT EXISTS feature_master (
    feature_code VARCHAR(80) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (feature_code)
);

CREATE TABLE IF NOT EXISTS country_feature_mapping (
    id BIGSERIAL NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    feature_code VARCHAR(80) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_country_feature_mapping_country_feature UNIQUE (country_code, feature_code),
    CONSTRAINT fk_country_feature_mapping_feature FOREIGN KEY (feature_code) REFERENCES feature_master (feature_code)
);

CREATE TABLE IF NOT EXISTS listing_condition_master (
    condition_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (condition_code)
);

CREATE TABLE IF NOT EXISTS delivery_type_master (
    delivery_type_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    digital_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (delivery_type_code)
);

CREATE TABLE IF NOT EXISTS fee_type_master (
    fee_type_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    fee_basis VARCHAR(50) NOT NULL,
    rate_percentage DECIMAL(5,2) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (fee_type_code)
);

INSERT INTO subcategory_master (subcategory_code, category_code, subcategory_name, subcategory_slug, icon_ref, country_code, active, display_order, created_at, updated_at)
SELECT 'GIFT_CARDS', 'DIGITAL', 'Gift Cards', 'gift-cards', 'marketplace/icons/gift-card.png', NULL, TRUE, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subcategory_master WHERE subcategory_code = 'GIFT_CARDS');

INSERT INTO subcategory_master (subcategory_code, category_code, subcategory_name, subcategory_slug, icon_ref, country_code, active, display_order, created_at, updated_at)
SELECT 'SOFTWARE', 'DIGITAL', 'Software', 'software', 'marketplace/icons/software.png', NULL, TRUE, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM subcategory_master WHERE subcategory_code = 'SOFTWARE');

INSERT INTO feature_master (feature_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'PRODUCT_FILTERING', 'Product Filtering', 'Filter listings by category and price', TRUE, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feature_master WHERE feature_code = 'PRODUCT_FILTERING');

INSERT INTO feature_master (feature_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'CROSS_BORDER', 'Cross Border', 'Country aware discovery and availability', TRUE, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feature_master WHERE feature_code = 'CROSS_BORDER');

INSERT INTO country_feature_mapping (country_code, feature_code, enabled, sort_order, created_at, updated_at)
SELECT 'US', 'PRODUCT_FILTERING', TRUE, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM country_feature_mapping WHERE country_code = 'US' AND feature_code = 'PRODUCT_FILTERING');

INSERT INTO country_feature_mapping (country_code, feature_code, enabled, sort_order, created_at, updated_at)
SELECT 'US', 'CROSS_BORDER', TRUE, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM country_feature_mapping WHERE country_code = 'US' AND feature_code = 'CROSS_BORDER');

INSERT INTO listing_condition_master (condition_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'NEW', 'New', 'Brand new item', TRUE, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM listing_condition_master WHERE condition_code = 'NEW');

INSERT INTO listing_condition_master (condition_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'REFURBISHED', 'Refurbished', 'Professionally restored item', TRUE, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM listing_condition_master WHERE condition_code = 'REFURBISHED');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'DIGITAL', 'Digital', 'Delivered electronically', TRUE, TRUE, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'DIGITAL');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'SHIPPING', 'Shipping', 'Shipped to buyer', FALSE, TRUE, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'SHIPPING');

INSERT INTO fee_type_master (fee_type_code, display_label, description, fee_basis, rate_percentage, active, sort_order, created_at, updated_at)
SELECT 'PLATFORM_COMMISSION', 'Platform Commission', 'Commission charged on completed transactions', 'PERCENTAGE', 5.00, TRUE, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM fee_type_master WHERE fee_type_code = 'PLATFORM_COMMISSION');
