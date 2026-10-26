ALTER TABLE order_header ADD COLUMN purchase_request_key VARCHAR(120) NULL;
CREATE UNIQUE INDEX uk_order_purchase_request_key ON order_header (purchase_request_key);
