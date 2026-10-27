CREATE TABLE asset_upload_event (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    asset_public_id CHAR(36) NOT NULL,
    actor_user_public_id CHAR(36) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    owner_type VARCHAR(50) NOT NULL,
    owner_id VARCHAR(120) NULL,
    provider_code VARCHAR(40) NOT NULL,
    bucket_name VARCHAR(120) NOT NULL,
    object_key VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(255) NULL,
    content_type VARCHAR(120) NOT NULL,
    file_size_bytes BIGINT NULL,
    upload_status VARCHAR(30) NOT NULL,
    message VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_asset_upload_event_public_id UNIQUE (public_id),
    CONSTRAINT fk_asset_upload_event_asset_public_id FOREIGN KEY (asset_public_id) REFERENCES asset (public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_asset_upload_event_asset ON asset_upload_event (asset_public_id, created_at);
CREATE INDEX idx_asset_upload_event_actor ON asset_upload_event (actor_user_public_id, created_at);
CREATE INDEX idx_asset_upload_event_owner ON asset_upload_event (owner_type, owner_id, created_at);
