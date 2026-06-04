ALTER TABLE app_user
    ADD COLUMN profile_completion_status VARCHAR(32) NOT NULL DEFAULT 'INCOMPLETE' AFTER phone_verified,
    ADD COLUMN profile_completed_at DATETIME(6) NULL AFTER profile_completion_status;

ALTER TABLE user_profile
    ADD COLUMN country_name VARCHAR(100) NULL AFTER country_code,
    ADD COLUMN phone_dial_code VARCHAR(10) NULL AFTER country_name,
    ADD COLUMN date_of_birth DATE NULL AFTER phone_dial_code,
    ADD COLUMN gender VARCHAR(32) NULL AFTER date_of_birth;

UPDATE app_user user
JOIN user_profile profile ON profile.user_id = user.id
SET user.profile_completion_status = CASE
        WHEN profile.phone_number IS NOT NULL
            AND profile.country_code IS NOT NULL
            AND profile.date_of_birth IS NOT NULL
            AND profile.gender IS NOT NULL
        THEN 'COMPLETE'
        ELSE 'INCOMPLETE'
    END,
    user.profile_completed_at = CASE
        WHEN profile.phone_number IS NOT NULL
            AND profile.country_code IS NOT NULL
            AND profile.date_of_birth IS NOT NULL
            AND profile.gender IS NOT NULL
        THEN COALESCE(user.updated_at, NOW(6))
        ELSE NULL
    END;
