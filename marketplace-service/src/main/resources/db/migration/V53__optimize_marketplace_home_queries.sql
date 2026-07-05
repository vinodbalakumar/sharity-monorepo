CREATE INDEX idx_listing_status_country_created_at
    ON listing (listing_status, provider_country_code, created_at);

CREATE INDEX idx_listing_status_country_updated_at
    ON listing (listing_status, provider_country_code, updated_at);

CREATE INDEX idx_listing_status_featured_country_updated_at
    ON listing (listing_status, featured, provider_country_code, updated_at);

CREATE INDEX idx_listing_status_category_country_created_at
    ON listing (listing_status, category_code, provider_country_code, created_at);

CREATE INDEX idx_listing_status_vertical_country_created_at
    ON listing (listing_status, vertical_code, provider_country_code, created_at);

CREATE INDEX idx_listing_status_rollback_country_updated_at
    ON listing (listing_status, provider_country_code, rollback_offer_expires_at, updated_at);

CREATE INDEX idx_listing_provider_status_country_updated_at
    ON listing (provider_account_public_id, listing_status, provider_country_code, updated_at);

CREATE INDEX idx_order_header_listing_completed_status_created_at
    ON order_header (listing_id, completed_at, order_status, created_at);

CREATE INDEX idx_seller_profile_active_verification_rating_orders
    ON seller_profile (active, verification_status, seller_rating, completed_orders);
