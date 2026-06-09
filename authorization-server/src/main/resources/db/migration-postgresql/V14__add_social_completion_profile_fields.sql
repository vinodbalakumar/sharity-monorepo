ALTER TABLE app_user
    ADD COLUMN terms_accepted_at TIMESTAMP(6) NULL;

ALTER TABLE user_profile
    ADD COLUMN privacy_setting VARCHAR(40) NULL;
