CREATE TABLE IF NOT EXISTS ai_conversation (
 id VARCHAR(36) PRIMARY KEY, owner_id VARCHAR(80) NOT NULL, guest BOOLEAN NOT NULL,
 title VARCHAR(120) NOT NULL, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, saved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS ai_message (
 id VARCHAR(36) PRIMARY KEY, conversation_id VARCHAR(36) NOT NULL, role VARCHAR(16) NOT NULL,
 content TEXT NOT NULL, sources TEXT NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ai_founder_post (
 id VARCHAR(36) PRIMARY KEY, platform VARCHAR(16) NOT NULL, post_id VARCHAR(160) NOT NULL,
 published_at VARCHAR(40) NOT NULL, content TEXT NOT NULL, original_url VARCHAR(1000) NOT NULL,
 last_sync BIGINT NOT NULL, visibility VARCHAR(16) NOT NULL, approval VARCHAR(16) NOT NULL,
 UNIQUE (platform, post_id)
);
CREATE TABLE IF NOT EXISTS ai_message_metrics (
 message_id VARCHAR(36) PRIMARY KEY, request_started_at BIGINT NOT NULL,
 response_completed_at BIGINT NOT NULL, duration_ms BIGINT NOT NULL,
 input_tokens INTEGER NULL, output_tokens INTEGER NULL, total_tokens INTEGER NULL,
 generation VARCHAR(16) NOT NULL,
 FOREIGN KEY (message_id) REFERENCES ai_message(id) ON DELETE CASCADE
);
