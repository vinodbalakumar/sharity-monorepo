ALTER TABLE app_user
    ADD COLUMN profile_completion_status VARCHAR(32) NOT NULL DEFAULT 'INCOMPLETE',
    ADD COLUMN profile_completed_at TIMESTAMP(6) NULL;

ALTER TABLE user_profile
    ADD COLUMN country_name VARCHAR(100) NULL,
    ADD COLUMN phone_dial_code VARCHAR(10) NULL,
    ADD COLUMN date_of_birth DATE NULL,
    ADD COLUMN gender VARCHAR(32) NULL;

UPDATE app_user AS app_user
SET profile_completion_status = CASE
        WHEN profile.phone_number IS NOT NULL
            AND profile.country_code IS NOT NULL
            AND profile.date_of_birth IS NOT NULL
            AND profile.gender IS NOT NULL
        THEN 'COMPLETE'
        ELSE 'INCOMPLETE'
    END,
    profile_completed_at = CASE
        WHEN profile.phone_number IS NOT NULL
            AND profile.country_code IS NOT NULL
            AND profile.date_of_birth IS NOT NULL
            AND profile.gender IS NOT NULL
        THEN COALESCE(app_user.updated_at, CURRENT_TIMESTAMP)
        ELSE NULL
    END
FROM user_profile AS profile
WHERE profile.user_id = app_user.id;
