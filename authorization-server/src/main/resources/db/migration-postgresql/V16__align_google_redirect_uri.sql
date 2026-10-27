UPDATE social_oauth_provider_config
SET redirect_uri = 'https://vinodbalakumar.com/authorization-server/api/login/oauth2/code/google',
    updated_at = CURRENT_TIMESTAMP
WHERE provider = 'GOOGLE';
