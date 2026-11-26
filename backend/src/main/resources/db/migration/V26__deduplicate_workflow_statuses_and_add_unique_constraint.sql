-- V26__deduplicate_workflow_statuses_and_add_unique_constraint.sql

-- 1. Identify surviving (canonical) status for each (project_id, lower(trim(name))):
--    Prioritize is_initial = TRUE, then lowest position, then lowest id.
CREATE TEMP TABLE tmp_status_mapping AS
WITH ranked_statuses AS (
    SELECT id,
           project_id,
           LOWER(TRIM(name)) AS norm_name,
           FIRST_VALUE(id) OVER (
               PARTITION BY project_id, LOWER(TRIM(name))
               ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
           ) AS canonical_id
    FROM workflow_statuses
)
SELECT id AS duplicate_id, canonical_id
FROM ranked_statuses
WHERE id <> canonical_id;

-- 2. Re-point issues that reference duplicate_id to canonical_id
UPDATE issues i
SET status_id = m.canonical_id
FROM tmp_status_mapping m
WHERE i.status_id = m.duplicate_id;

-- 3. Re-point issue_status_history
UPDATE issue_status_history h
SET from_status_id = m.canonical_id
FROM tmp_status_mapping m
WHERE h.from_status_id = m.duplicate_id;

UPDATE issue_status_history h
SET to_status_id = m.canonical_id
FROM tmp_status_mapping m
WHERE h.to_status_id = m.duplicate_id;

-- 4. Re-point workflow_transitions
UPDATE workflow_transitions t
SET from_status_id = m.canonical_id
FROM tmp_status_mapping m
WHERE t.from_status_id = m.duplicate_id;

UPDATE workflow_transitions t
SET to_status_id = m.canonical_id
FROM tmp_status_mapping m
WHERE t.to_status_id = m.duplicate_id;

-- Delete any duplicate transitions resulting from re-pointing
DELETE FROM workflow_transitions t
WHERE t.id NOT IN (
    SELECT MIN(id)
    FROM workflow_transitions
    GROUP BY project_id, from_status_id, to_status_id
);

-- 5. Delete duplicate workflow_statuses
DELETE FROM workflow_statuses
WHERE id IN (SELECT duplicate_id FROM tmp_status_mapping);

DROP TABLE tmp_status_mapping;

-- 6. Re-sequence position consecutively per project
WITH reindexed AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY position ASC, id ASC) - 1 AS new_pos
    FROM workflow_statuses
)
UPDATE workflow_statuses ws
SET position = r.new_pos, updated_at = CURRENT_TIMESTAMP
FROM reindexed r
WHERE ws.id = r.id;

-- 7. Add unique index to prevent future duplicate status names per project
CREATE UNIQUE INDEX IF NOT EXISTS uk_workflow_statuses_project_name_lower
    ON workflow_statuses (project_id, LOWER(TRIM(name)));
