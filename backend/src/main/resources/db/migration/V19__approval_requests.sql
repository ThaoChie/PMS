-- V19__approval_requests.sql
-- Tích hợp Camunda: bảng duyệt nhiều cấp cho PROJECT_CLOSE / WORKFLOW_CONFIG_CHANGE

-- app_admins: người dùng có quyền quản trị hệ thống (thay cho system_role đã bị xóa ở V13)
CREATE TABLE IF NOT EXISTS app_admins (
    user_id  BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- approval_requests: yêu cầu duyệt chính
CREATE TABLE IF NOT EXISTS approval_requests (
    id                   BIGSERIAL PRIMARY KEY,
    project_id           BIGINT       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type                 VARCHAR(40)  NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    apply_status         VARCHAR(20)  NOT NULL DEFAULT 'NOT_APPLIED',
    apply_error          TEXT,
    requester_id         BIGINT       NOT NULL REFERENCES users(id),
    reason               TEXT         NOT NULL,
    payload_json         JSONB,
    process_instance_key VARCHAR(255),
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255)
);

-- approval_steps: từng cấp duyệt của yêu cầu
CREATE TABLE IF NOT EXISTS approval_steps (
    id             BIGSERIAL PRIMARY KEY,
    request_id     BIGINT      NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    level          INT         NOT NULL,
    approver_role  VARCHAR(10) NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    decided_by     BIGINT      REFERENCES users(id),
    comment        TEXT,
    decided_at     TIMESTAMPTZ,
    reminder_count INT         NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_approval_step UNIQUE (request_id, level)
);

-- reminder_log: chống gửi thông báo nhắc lặp trong cùng ngày
CREATE TABLE IF NOT EXISTS reminder_log (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(50) NOT NULL,
    ref_id     BIGINT      NOT NULL,
    sent_on    DATE        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_reminder_log UNIQUE (type, ref_id, sent_on)
);

-- Chỉ mục
CREATE INDEX IF NOT EXISTS idx_approval_requests_project_type_status
    ON approval_requests (project_id, type, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester
    ON approval_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request_level
    ON approval_steps (request_id, level);
CREATE INDEX IF NOT EXISTS idx_approval_steps_decided_by
    ON approval_steps (decided_by);
