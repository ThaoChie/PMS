-- V11__search_trgm_indexes.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_issues_summary_trgm ON issues USING gin (lower(summary) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_issues_desc_trgm ON issues USING gin (lower(description) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues (created_at);
CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues (updated_at);
