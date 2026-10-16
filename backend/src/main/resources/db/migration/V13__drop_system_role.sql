-- V13__drop_system_role.sql
-- Remove legacy system_role column from users table as authorization is fully handled via project-level RBAC (ProjectMember)

ALTER TABLE users DROP COLUMN IF EXISTS system_role;
