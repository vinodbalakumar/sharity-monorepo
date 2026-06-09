CREATE TABLE user_social_identities (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255) NULL,
    provider_email_verified BOOLEAN NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    display_name VARCHAR(200) NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_social_identity_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT uk_user_social_identity_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uk_user_social_identity_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_social_identity_user_enabled ON user_social_identities (user_id, enabled);
