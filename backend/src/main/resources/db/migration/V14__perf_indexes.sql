-- V14__perf_indexes.sql
-- Performance indexes to accelerate issue listing, dashboard queries, and activity feeds

CREATE INDEX IF NOT EXISTS idx_issues_project_deleted ON issues (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_assignee_project ON issues (assignee_id, project_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created ON audit_logs (project_id, created_at DESC);
