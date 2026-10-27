UPDATE social_oauth_provider_config
SET redirect_uri = 'https://vinodbalakumar.com/authorization-server/api/login/oauth2/code/google',
    updated_at = NOW(6)
WHERE provider = 'GOOGLE';
