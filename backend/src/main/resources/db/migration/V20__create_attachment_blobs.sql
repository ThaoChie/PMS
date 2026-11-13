-- V20__create_attachment_blobs.sql
-- Persistent database storage fallback for attachments when external S3/MinIO is unavailable

CREATE TABLE IF NOT EXISTS attachment_blobs (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachment_blobs_file_name ON attachment_blobs(file_name);
