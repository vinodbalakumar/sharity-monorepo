CREATE TABLE storefront_section (
    section_code VARCHAR(40) PRIMARY KEY,
    enabled BOOLEAN NOT NULL,
    display_order INTEGER NOT NULL,
    listing_ids VARCHAR(2000) NOT NULL DEFAULT '',
    starts_at TIMESTAMP NULL,
    ends_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO storefront_section(section_code, enabled, display_order) VALUES
 ('BEST_SELLING', TRUE, 10), ('TRENDING', TRUE, 20), ('RECENTLY_VIEWED', TRUE, 30),
 ('RECOMMENDED_DEALS', TRUE, 40), ('FLASH_DEALS', TRUE, 50), ('ALL_PRODUCTS', TRUE, 60);
CREATE INDEX idx_orders_storefront_sales ON order_header(payment_status, created_at, listing_id);
