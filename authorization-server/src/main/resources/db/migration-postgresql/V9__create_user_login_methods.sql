CREATE TABLE user_login_method (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NULL,
    provider_email VARCHAR(255) NULL,
    provider_email_verified BOOLEAN NULL,
    password_credential_id BIGINT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_login_method_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_login_method_credential FOREIGN KEY (password_credential_id) REFERENCES user_credential (id),
    CONSTRAINT uk_user_login_method_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uk_user_login_method_password_credential UNIQUE (password_credential_id),
    CONSTRAINT uk_user_login_method_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_login_method_user_enabled ON user_login_method (user_id, enabled);

INSERT INTO user_login_method (
    user_id,
    provider,
    provider_email,
    provider_email_verified,
    password_credential_id,
    enabled,
    created_at,
    updated_at
)
SELECT
    app_user.id,
    'LOCAL',
    app_user.email,
    app_user.email_verified,
    user_credential.id,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM app_user
JOIN user_credential ON user_credential.user_id = app_user.id;
