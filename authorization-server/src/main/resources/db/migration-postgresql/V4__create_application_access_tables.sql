CREATE TABLE application (
    id BIGSERIAL NOT NULL,
    app_code VARCHAR(100) NOT NULL,
    app_name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_application_app_code UNIQUE (app_code)
);

CREATE TABLE user_application_access (
    user_id BIGINT NOT NULL,
    application_id BIGINT NOT NULL,
    assigned_at TIMESTAMP(6) NOT NULL,
    assigned_by BIGINT NULL,
    PRIMARY KEY (user_id, application_id),
    CONSTRAINT fk_user_application_access_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_application_access_application FOREIGN KEY (application_id) REFERENCES application (id),
    CONSTRAINT fk_user_application_access_assigned_by FOREIGN KEY (assigned_by) REFERENCES app_user (id)
);
