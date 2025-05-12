CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    message JSONB NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_unacked_recent ON messages (acknowledged, created_at);
