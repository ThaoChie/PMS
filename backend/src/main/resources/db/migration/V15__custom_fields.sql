-- V15__custom_fields.sql
-- Custom fields management per project and custom field values per issue

CREATE TABLE IF NOT EXISTS project_custom_fields (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    field_key VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    required BOOLEAN NOT NULL DEFAULT FALSE,
    options TEXT,
    default_value TEXT,
    description VARCHAR(255),
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_project_field_key UNIQUE (project_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_project_custom_fields_project ON project_custom_fields(project_id, position ASC);

CREATE TABLE IF NOT EXISTS issue_custom_field_values (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    field_id BIGINT NOT NULL REFERENCES project_custom_fields(id) ON DELETE CASCADE,
    field_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_issue_custom_field UNIQUE (issue_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_custom_values_issue ON issue_custom_field_values(issue_id);
