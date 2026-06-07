CREATE TABLE social_oauth_provider_config (
    provider VARCHAR(30) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret_env_var VARCHAR(100) NOT NULL,
    authorization_uri VARCHAR(500) NOT NULL,
    token_uri VARCHAR(500) NOT NULL,
    jwk_set_uri VARCHAR(500) NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO social_oauth_provider_config (
    provider,
    client_id,
    client_secret_env_var,
    authorization_uri,
    token_uri,
    jwk_set_uri,
    redirect_uri,
    enabled,
    created_at,
    updated_at
) VALUES (
    'GOOGLE',
    '492849326186-7nao7h35rtoe8qa3jna1bs4j78vif8dp.apps.googleusercontent.com',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'https://accounts.google.com/o/oauth2/v2/auth',
    'https://oauth2.googleapis.com/token',
    'https://www.googleapis.com/oauth2/v3/certs',
    'https://vinodbalakumar.com/authorization-server/api/v1/auth/social/google/callback',
    TRUE,
    NOW(6),
    NOW(6)
);
