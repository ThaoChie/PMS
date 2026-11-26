-- V26__deduplicate_workflow_statuses_and_add_unique_constraint.sql

-- 1. Re-point issues that reference duplicate statuses to canonical status
UPDATE issues i
SET status_id = c.canonical_id
FROM (
    SELECT id AS duplicate_id,
           FIRST_VALUE(id) OVER (
               PARTITION BY project_id, LOWER(TRIM(name))
               ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
           ) AS canonical_id
    FROM workflow_statuses
) c
WHERE i.status_id = c.duplicate_id
  AND c.duplicate_id <> c.canonical_id;

-- 2. Re-point issue_status_history
UPDATE issue_status_history h
SET from_status_id = c.canonical_id
FROM (
    SELECT id AS duplicate_id,
           FIRST_VALUE(id) OVER (
               PARTITION BY project_id, LOWER(TRIM(name))
               ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
           ) AS canonical_id
    FROM workflow_statuses
) c
WHERE h.from_status_id = c.duplicate_id
  AND c.duplicate_id <> c.canonical_id;

UPDATE issue_status_history h
SET to_status_id = c.canonical_id
FROM (
    SELECT id AS duplicate_id,
           FIRST_VALUE(id) OVER (
               PARTITION BY project_id, LOWER(TRIM(name))
               ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
           ) AS canonical_id
    FROM workflow_statuses
) c
WHERE h.to_status_id = c.duplicate_id
  AND c.duplicate_id <> c.canonical_id;

-- 3. Re-point workflow_transitions
UPDATE workflow_transitions t
SET from_status_id = c.canonical_id
FROM (
    SELECT id AS duplicate_id,
           FIRST_VALUE(id) OVER (
               PARTITION BY project_id, LOWER(TRIM(name))
               ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
           ) AS canonical_id
    FROM workflow_statuses
) c
WHERE t.from_status_id = c.duplicate_id
  AND c.duplicate_id <> c.canonical_id;

UPDATE workflow_transitions t
SET to_status_id = c.canonical_id
FROM (
    SELECT id AS duplicate_id,
           FIRST_VALUE(id) OVER (
               PARTITION BY project_id, LOWER(TRIM(name))
               ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
           ) AS canonical_id
    FROM workflow_statuses
) c
WHERE t.to_status_id = c.duplicate_id
  AND c.duplicate_id <> c.canonical_id;

-- 4. Delete duplicate workflow_transitions resulting from re-pointing
DELETE FROM workflow_transitions t
WHERE t.id NOT IN (
    SELECT MIN(id)
    FROM workflow_transitions
    GROUP BY project_id, from_status_id, to_status_id
);

-- 5. Delete duplicate workflow_statuses
DELETE FROM workflow_statuses
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY project_id, LOWER(TRIM(name))
                   ORDER BY (CASE WHEN is_initial THEN 0 ELSE 1 END) ASC, position ASC, id ASC
               ) AS rn
        FROM workflow_statuses
    ) ranked
    WHERE ranked.rn > 1
);

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
