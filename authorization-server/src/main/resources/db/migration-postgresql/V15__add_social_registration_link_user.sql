ALTER TABLE social_registration_session
    ADD COLUMN link_user_id BIGINT NULL;

CREATE INDEX idx_social_registration_link_user ON social_registration_session (link_user_id);
