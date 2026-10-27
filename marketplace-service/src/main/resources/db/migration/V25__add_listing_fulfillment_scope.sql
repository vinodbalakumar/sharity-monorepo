ALTER TABLE listing
    ADD COLUMN fulfillment_scope VARCHAR(20) NULL AFTER delivery_type;
