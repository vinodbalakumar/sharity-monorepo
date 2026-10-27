CREATE TABLE app_user (
    id BIGSERIAL NOT NULL,
    public_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    normalized_email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NULL,
    normalized_username VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP(6) NULL,
    last_login_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_app_user_public_id UNIQUE (public_id),
    CONSTRAINT uk_app_user_normalized_email UNIQUE (normalized_email),
    CONSTRAINT uk_app_user_normalized_username UNIQUE (normalized_username)
);

CREATE TABLE user_credential (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMP(6) NOT NULL,
    password_reset_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_credential_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_credential_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE TABLE user_profile (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone_number VARCHAR(30) NULL,
    profile_image_url VARCHAR(500) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_profile_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE TABLE role (
    id BIGSERIAL NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_role_role_name UNIQUE (role_name)
);

CREATE TABLE user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP(6) NOT NULL,
    assigned_by BIGINT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES role (id),
    CONSTRAINT fk_user_role_assigned_by FOREIGN KEY (assigned_by) REFERENCES app_user (id)
);

CREATE TABLE refresh_token (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    token_family_id VARCHAR(36) NOT NULL,
    device_name VARCHAR(150) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    issued_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    last_used_at TIMESTAMP(6) NULL,
    revoked_at TIMESTAMP(6) NULL,
    revoked_reason VARCHAR(100) NULL,
    replaced_by_token_id BIGINT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_token_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_refresh_token_replaced_by FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_token (id)
);

CREATE INDEX idx_refresh_token_user_active ON refresh_token (user_id, revoked_at);
CREATE INDEX idx_refresh_token_family_active ON refresh_token (token_family_id, revoked_at);

CREATE TABLE email_verification_token (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    verified_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_email_verification_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_email_verification_token_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE TABLE password_reset_token (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE TABLE login_attempt (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NULL,
    attempted_email VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100) NULL,
    attempted_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_login_attempt_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_login_attempt_email_time ON login_attempt (attempted_email, attempted_at);
CREATE INDEX idx_login_attempt_user_time ON login_attempt (user_id, attempted_at);

CREATE TABLE audit_log (
    id BIGSERIAL NOT NULL,
    actor_user_id BIGINT NULL,
    target_user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id VARCHAR(100) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_log_actor_user FOREIGN KEY (actor_user_id) REFERENCES app_user (id),
    CONSTRAINT fk_audit_log_target_user FOREIGN KEY (target_user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_audit_log_action_time ON audit_log (action, created_at);
CREATE INDEX idx_audit_log_actor_time ON audit_log (actor_user_id, created_at);
CREATE INDEX idx_audit_log_target_time ON audit_log (target_user_id, created_at);
