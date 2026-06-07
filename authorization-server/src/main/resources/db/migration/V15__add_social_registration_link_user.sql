ALTER TABLE social_registration_session
    ADD COLUMN link_user_id BIGINT NULL AFTER flow,
    ADD INDEX idx_social_registration_link_user (link_user_id);
