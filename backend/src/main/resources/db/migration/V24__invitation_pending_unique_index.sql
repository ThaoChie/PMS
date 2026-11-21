-- V24__invitation_pending_unique_index.sql
-- 1. Chuyển các lời mời PENDING đã quá hạn sang EXPIRED
UPDATE project_invitations
SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
WHERE status = 'PENDING' AND expires_at < CURRENT_TIMESTAMP;

-- 2. Nếu dữ liệu cũ có nhiều dòng PENDING trùng (project_id, lower(email)),
--    chỉ giữ lại dòng mới nhất (id lớn nhất), các dòng cũ chuyển sang CANCELLED
WITH ranked_pending AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY project_id, LOWER(email)
               ORDER BY id DESC
           ) AS rn
    FROM project_invitations
    WHERE status = 'PENDING'
)
UPDATE project_invitations
SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM ranked_pending WHERE rn > 1);

-- 3. Tạo Partial Unique Index: mỗi email chỉ được có tối đa 1 lời mời PENDING trong 1 dự án,
--    nhưng vẫn cho phép lưu nhiều lịch sử DECLINED / EXPIRED / CANCELLED / ACCEPTED.
CREATE UNIQUE INDEX IF NOT EXISTS uk_project_invitations_pending
    ON project_invitations (project_id, LOWER(email))
    WHERE status = 'PENDING';
