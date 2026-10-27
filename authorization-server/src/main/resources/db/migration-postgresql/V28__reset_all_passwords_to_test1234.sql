UPDATE user_credential
SET password_hash = '$2a$10$u7t/x3OARkTJ23ZOZj/8qejFm0TbGDqrbPcF2t0KCbokewm6dxLMi',
    password_changed_at = CURRENT_TIMESTAMP(6),
    password_reset_required = FALSE,
    updated_at = CURRENT_TIMESTAMP(6);
