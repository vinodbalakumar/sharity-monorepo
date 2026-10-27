CREATE TABLE social_registration_session (
    id BIGSERIAL NOT NULL,
    state_hash VARCHAR(64) NOT NULL,
    completion_token_hash VARCHAR(64) NULL,
    provider VARCHAR(30) NOT NULL,
    flow VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NULL,
    provider_email VARCHAR(255) NULL,
    provider_email_verified BOOLEAN NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    display_name VARCHAR(200) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    consumed_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_social_registration_state UNIQUE (state_hash),
    CONSTRAINT uk_social_registration_completion_token UNIQUE (completion_token_hash)
);

CREATE INDEX idx_social_registration_provider_subject ON social_registration_session (provider, provider_subject);
CREATE INDEX idx_social_registration_expires_at ON social_registration_session (expires_at);
