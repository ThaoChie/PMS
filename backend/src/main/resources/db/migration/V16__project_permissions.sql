-- V16__project_permissions.sql
-- Configure high-impact project-level action permissions
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS allow_member_delete_issue BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_member_delete_subtask BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_member_convert_subtask BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_member_manage_custom_fields BOOLEAN NOT NULL DEFAULT FALSE;
