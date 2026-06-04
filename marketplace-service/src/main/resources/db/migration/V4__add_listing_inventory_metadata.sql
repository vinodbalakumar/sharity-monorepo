ALTER TABLE listing
    ADD COLUMN condition_label VARCHAR(30) NULL AFTER image_url,
    ADD COLUMN stock_quantity INT NOT NULL DEFAULT 1 AFTER condition_label,
    ADD COLUMN source_type VARCHAR(30) NULL AFTER verified_seller,
    ADD COLUMN source_name VARCHAR(150) NULL AFTER source_type,
    ADD COLUMN source_url VARCHAR(500) NULL AFTER source_name,
    ADD COLUMN license_note VARCHAR(255) NULL AFTER source_url,
    ADD COLUMN demo_seed BOOLEAN NOT NULL DEFAULT FALSE AFTER license_note;
