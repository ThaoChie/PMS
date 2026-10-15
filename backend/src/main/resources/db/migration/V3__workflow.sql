-- V3__workflow.sql
CREATE TABLE IF NOT EXISTS workflow_statuses (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'TODO',
    position INT NOT NULL DEFAULT 0,
    is_initial BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_statuses_project_id ON workflow_statuses (project_id);

CREATE TABLE IF NOT EXISTS workflow_transitions (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_status_id BIGINT NOT NULL REFERENCES workflow_statuses(id) ON DELETE CASCADE,
    to_status_id BIGINT NOT NULL REFERENCES workflow_statuses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    required_fields TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_project_id ON workflow_transitions (project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_from_status ON workflow_transitions (from_status_id);
