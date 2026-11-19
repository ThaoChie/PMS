-- V23__productivity_report_indexes.sql
-- Indexes to accelerate productivity reports and worklog date aggregations

CREATE INDEX IF NOT EXISTS idx_worklogs_user_date ON worklogs (user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_worklogs_date ON worklogs (work_date);
CREATE INDEX IF NOT EXISTS idx_issues_proj_assignee_due ON issues (project_id, assignee_id, due_date) WHERE deleted_at IS NULL;
