ALTER TABLE supported_country
    ADD COLUMN phone_dial_code VARCHAR(10) NULL;

UPDATE supported_country
SET phone_dial_code = CASE country_code
    WHEN 'USA' THEN '+1'
    WHEN 'IND' THEN '+91'
    ELSE phone_dial_code
END
WHERE phone_dial_code IS NULL;

ALTER TABLE supported_country
    ALTER COLUMN phone_dial_code SET NOT NULL;

CREATE TABLE registration_gender_option (
    id BIGSERIAL NOT NULL,
    gender_code VARCHAR(32) NOT NULL,
    display_label VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_registration_gender_option_code UNIQUE (gender_code)
);

INSERT INTO registration_gender_option (gender_code, display_label, sort_order, status, created_at, updated_at)
VALUES
    ('MALE', 'Male', 10, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('FEMALE', 'Female', 20, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('OTHER', 'Other', 30, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PREFER_NOT_TO_SAY', 'Prefer not to say', 40, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (gender_code) DO UPDATE SET
    display_label = EXCLUDED.display_label,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;
