CREATE TABLE email_delivery_log (
    id BIGSERIAL NOT NULL,
    message_group_id CHAR(36) NOT NULL,
    user_id BIGINT NULL,
    email_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    attempt_number INT NOT NULL,
    max_attempts INT NOT NULL,
    error_message VARCHAR(1000) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_email_delivery_log_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE INDEX idx_email_delivery_log_group ON email_delivery_log (message_group_id);
CREATE INDEX idx_email_delivery_log_recipient_time ON email_delivery_log (recipient_email, created_at);
CREATE INDEX idx_email_delivery_log_status_time ON email_delivery_log (status, created_at);
CREATE INDEX idx_email_delivery_log_type_time ON email_delivery_log (email_type, created_at);
