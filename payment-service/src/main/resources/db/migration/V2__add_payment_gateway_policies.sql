CREATE TABLE payment_gateway_policy (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    country_code CHAR(2) NOT NULL,
    gateway_mode VARCHAR(50) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    recommendation_note VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_gateway_policy_public_id UNIQUE (public_id),
    CONSTRAINT uk_payment_gateway_policy_country UNIQUE (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
