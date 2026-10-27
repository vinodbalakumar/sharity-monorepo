CREATE TABLE application (
    id BIGINT NOT NULL AUTO_INCREMENT,
    app_code VARCHAR(100) NOT NULL,
    app_name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_application_app_code UNIQUE (app_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_application_access (
    user_id BIGINT NOT NULL,
    application_id BIGINT NOT NULL,
    assigned_at DATETIME(6) NOT NULL,
    assigned_by BIGINT NULL,
    PRIMARY KEY (user_id, application_id),
    CONSTRAINT fk_user_application_access_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_application_access_application FOREIGN KEY (application_id) REFERENCES application (id),
    CONSTRAINT fk_user_application_access_assigned_by FOREIGN KEY (assigned_by) REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
