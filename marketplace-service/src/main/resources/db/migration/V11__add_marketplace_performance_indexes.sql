CREATE INDEX idx_listing_status_created_at
    ON listing (listing_status, created_at);

CREATE INDEX idx_listing_status_vertical_created_at
    ON listing (listing_status, vertical_code, created_at);

CREATE INDEX idx_listing_status_category_created_at
    ON listing (listing_status, category_code, created_at);

CREATE INDEX idx_listing_status_vertical_category_created_at
    ON listing (listing_status, vertical_code, category_code, created_at);

CREATE INDEX idx_listing_status_featured_updated_at
    ON listing (listing_status, featured, updated_at);

CREATE INDEX idx_listing_provider_created_at
    ON listing (provider_account_public_id, created_at);

CREATE INDEX idx_marketplace_category_active_display_order
    ON marketplace_category (active, display_order, category_name);

CREATE INDEX idx_marketplace_category_active_vertical_display_order
    ON marketplace_category (active, vertical_code, display_order, category_name);

CREATE INDEX idx_order_header_customer_created_at
    ON order_header (customer_user_public_id, created_at);

CREATE INDEX idx_order_header_provider_created_at
    ON order_header (provider_account_public_id, created_at);

CREATE INDEX idx_order_header_provider_owner_created_at
    ON order_header (provider_owner_user_public_id, created_at);

CREATE INDEX idx_dispute_case_status_opened_at
    ON dispute_case (dispute_status, opened_at);

CREATE INDEX idx_marketplace_event_outbox_status_created_at
    ON marketplace_event_outbox (processing_status, created_at);
