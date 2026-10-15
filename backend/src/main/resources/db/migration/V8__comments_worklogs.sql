-- V8__comments_worklogs.sql
CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments (issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

CREATE TABLE IF NOT EXISTS comment_mentions (
    comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_mentions_user_id ON comment_mentions (user_id);

CREATE TABLE IF NOT EXISTS worklogs (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    time_spent_min INT NOT NULL,
    work_date DATE NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worklogs_issue_id ON worklogs (issue_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_user_id ON worklogs (user_id);
