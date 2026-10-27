-- Correct the demo password documented by V28. Preserve changed passwords.
-- The replacement hash was generated and verified with BCryptPasswordEncoder
-- for the demo password test1234.
UPDATE user_credential
SET password_hash = '{bcrypt}$2a$10$V2NXu4KQJbO7hjuMfS.yveJv/3NuCZnBsvYtobSUBkvNL2pYaWBdm',
    password_changed_at = CURRENT_TIMESTAMP,
    password_reset_required = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE password_hash = '$2a$10$u7t/x3OARkTJ23ZOZj/8qejFm0TbGDqrbPcF2t0KCbokewm6dxLMi'
  AND user_id IN (
      SELECT id FROM app_user
      WHERE public_id IN (
          '22222222-2222-2222-2222-222222222201',
          '22222222-2222-2222-2222-222222222202',
          '22222222-2222-2222-2222-222222222203',
          '22222222-2222-2222-2222-222222222204'
      )
  );
