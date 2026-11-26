-- V25__unique_initial_workflow_status.sql
-- 1. If a project has multiple initial statuses in workflow_statuses, keep only the earliest one
--    (lowest position, then lowest id) and reset the rest to is_initial = FALSE.
WITH ranked_initial AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY project_id
               ORDER BY position ASC, id ASC
           ) AS rn
    FROM workflow_statuses
    WHERE is_initial = TRUE
)
UPDATE workflow_statuses
SET is_initial = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM ranked_initial WHERE rn > 1);

-- 2. Enforce at most one initial status per project at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS uk_workflow_statuses_single_initial
    ON workflow_statuses (project_id)
    WHERE is_initial = TRUE;
