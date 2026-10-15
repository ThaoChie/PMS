-- V9__watchers_recent_views.sql
CREATE TABLE IF NOT EXISTS issue_watchers (
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (issue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_watchers_user_id ON issue_watchers (user_id);

CREATE TABLE IF NOT EXISTS recent_views (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_recent_views UNIQUE (user_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_views_user_viewed_at ON recent_views (user_id, viewed_at DESC);
