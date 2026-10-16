-- V12__report_perf_indexes.sql
-- Indexes and columns to accelerate progress, productivity, and bug reports

ALTER TABLE issue_status_history ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE;

-- Backfill project_id from issues for existing status history records
UPDATE issue_status_history h
SET project_id = i.project_id
FROM issues i
WHERE h.issue_id = i.id AND h.project_id IS NULL;

-- Index for issue_status_history by project and changed_at
CREATE INDEX IF NOT EXISTS idx_issue_status_history_project_changed ON issue_status_history (project_id, changed_at);

-- Index for issues by project and created_at
CREATE INDEX IF NOT EXISTS idx_issues_project_created ON issues (project_id, created_at);

-- Composite index for bug queries by project, type, and status
CREATE INDEX IF NOT EXISTS idx_issues_project_type ON issues (project_id, type) WHERE deleted_at IS NULL;
