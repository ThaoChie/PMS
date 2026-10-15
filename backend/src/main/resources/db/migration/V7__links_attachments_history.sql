-- V7__links_attachments_history.sql
CREATE TABLE IF NOT EXISTS issue_links (
    id BIGSERIAL PRIMARY KEY,
    source_issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    target_issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_issue_link UNIQUE (source_issue_id, target_issue_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_issue_links_source ON issue_links (source_issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_links_target ON issue_links (target_issue_id);

CREATE TABLE IF NOT EXISTS issue_attachments (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    uploaded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_attachments_issue_id ON issue_attachments (issue_id);

CREATE TABLE IF NOT EXISTS issue_status_history (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    from_status_id BIGINT REFERENCES workflow_statuses(id),
    to_status_id BIGINT NOT NULL REFERENCES workflow_statuses(id),
    changed_by_id BIGINT REFERENCES users(id),
    comment TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_status_history_issue_id ON issue_status_history (issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_status_history_changed_at ON issue_status_history (changed_at);
