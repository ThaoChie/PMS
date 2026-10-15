-- V6__issues_labels.sql
CREATE TABLE IF NOT EXISTS labels (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_labels_project_name UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labels_project_id ON labels(project_id);

CREATE TABLE IF NOT EXISTS issues (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_key VARCHAR(50) NOT NULL UNIQUE,
    summary VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status_id BIGINT REFERENCES workflow_statuses(id) ON DELETE SET NULL,
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    parent_id BIGINT REFERENCES issues(id) ON DELETE CASCADE,
    epic_id BIGINT REFERENCES issues(id) ON DELETE SET NULL,
    resolution VARCHAR(255),
    original_estimate_min INT DEFAULT 0,
    remaining_estimate_min INT DEFAULT 0,
    time_spent_min INT DEFAULT 0,
    due_date DATE,
    environment VARCHAR(255),
    version INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_labels (
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    label_id BIGINT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_issues_project_status ON issues (project_id, status_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues (assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON issues (reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_deleted_at ON issues (deleted_at);
CREATE INDEX IF NOT EXISTS idx_issues_issue_key ON issues (issue_key);
CREATE INDEX IF NOT EXISTS idx_issues_parent_id ON issues (parent_id);
CREATE INDEX IF NOT EXISTS idx_issues_epic_id ON issues (epic_id);
CREATE INDEX IF NOT EXISTS idx_issue_labels_label_id ON issue_labels (label_id);
