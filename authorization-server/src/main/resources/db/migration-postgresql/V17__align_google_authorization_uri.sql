UPDATE social_oauth_provider_config
SET authorization_uri = 'https://accounts.google.com/o/oauth2/auth',
    updated_at = CURRENT_TIMESTAMP
WHERE provider = 'GOOGLE';
