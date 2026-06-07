ALTER TABLE supported_country
    ADD COLUMN phone_dial_code VARCHAR(10) NULL AFTER default_currency_code;

UPDATE supported_country
SET phone_dial_code = CASE country_code
    WHEN 'USA' THEN '+1'
    WHEN 'IND' THEN '+91'
    ELSE phone_dial_code
END
WHERE phone_dial_code IS NULL;

ALTER TABLE supported_country
    MODIFY COLUMN phone_dial_code VARCHAR(10) NOT NULL;

CREATE TABLE registration_gender_option (
    id BIGINT NOT NULL AUTO_INCREMENT,
    gender_code VARCHAR(32) NOT NULL,
    display_label VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_registration_gender_option_code UNIQUE (gender_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO registration_gender_option (gender_code, display_label, sort_order, status, created_at, updated_at)
VALUES
    ('MALE', 'Male', 10, 'ACTIVE', NOW(6), NOW(6)),
    ('FEMALE', 'Female', 20, 'ACTIVE', NOW(6), NOW(6)),
    ('OTHER', 'Other', 30, 'ACTIVE', NOW(6), NOW(6)),
    ('PREFER_NOT_TO_SAY', 'Prefer not to say', 40, 'ACTIVE', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    display_label = VALUES(display_label),
    sort_order = VALUES(sort_order),
    status = VALUES(status),
    updated_at = NOW(6);
