ALTER TABLE app_user
    ADD COLUMN terms_accepted_at DATETIME(6) NULL AFTER profile_completed_at;

ALTER TABLE user_profile
    ADD COLUMN privacy_setting VARCHAR(40) NULL AFTER preferred_timezone;
