CREATE TABLE listing_status_master (
    status_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    customer_visible BOOLEAN NOT NULL,
    sort_order INT NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_listing_status_master PRIMARY KEY (status_code)
);

INSERT INTO listing_status_master (status_code, display_label, customer_visible, sort_order, active, created_at, updated_at)
VALUES
    ('ACTIVE', 'Active', TRUE, 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PUBLISHED', 'Published', TRUE, 20, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('INACTIVE', 'Inactive', FALSE, 30, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('REJECTED', 'Rejected', FALSE, 40, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SUSPENDED', 'Suspended', FALSE, 50, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ARCHIVED', 'Archived', FALSE, 60, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
