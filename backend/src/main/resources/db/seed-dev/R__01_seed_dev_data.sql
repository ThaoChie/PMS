-- R__01_seed_dev_data.sql (Dev Seed Data - Only loaded in dev profile)

-- Seed Users: password is Password123@
INSERT INTO users (id, email, password_hash, full_name, avatar_url, system_role, auth_provider, status)
VALUES
    (1, 'admin@epms.com', '$2a$10$wN31Xj51kQO8MpvV0xX1k.E244L/h5n48HlT.E7m9uGvP5v9o9o2K', 'Admin System', NULL, 'ADMIN', 'LOCAL', 'ACTIVE'),
    (2, 'pm@epms.com', '$2a$10$wN31Xj51kQO8MpvV0xX1k.E244L/h5n48HlT.E7m9uGvP5v9o9o2K', 'Alex Chen (PM)', NULL, 'PM', 'LOCAL', 'ACTIVE'),
    (3, 'dev@epms.com', '$2a$10$wN31Xj51kQO8MpvV0xX1k.E244L/h5n48HlT.E7m9uGvP5v9o9o2K', 'Marcus Jones (Dev)', NULL, 'MEMBER', 'LOCAL', 'ACTIVE'),
    (4, 'qa@epms.com', '$2a$10$wN31Xj51kQO8MpvV0xX1k.E244L/h5n48HlT.E7m9uGvP5v9o9o2K', 'Priya Patel (QA)', NULL, 'MEMBER', 'LOCAL', 'ACTIVE'),
    (5, 'member@epms.com', '$2a$10$wN31Xj51kQO8MpvV0xX1k.E244L/h5n48HlT.E7m9uGvP5v9o9o2K', 'Tom Wright (Member)', NULL, 'MEMBER', 'LOCAL', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    system_role = EXCLUDED.system_role;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed Sample Project
INSERT INTO projects (id, name, project_key, description, status, issue_seq, created_by)
VALUES
    (1, 'EPMS Platform', 'PRJ', 'Enterprise Project Management System platform development', 'ACTIVE', 0, 2)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    project_key = EXCLUDED.project_key,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- Seed Project Members
INSERT INTO project_members (id, project_id, user_id, role)
VALUES
    (1, 1, 2, 'PM'),
    (2, 1, 3, 'DEVELOPER'),
    (3, 1, 4, 'QA'),
    (4, 1, 5, 'MEMBER')
ON CONFLICT (project_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;

SELECT setval('project_members_id_seq', (SELECT MAX(id) FROM project_members));

-- Seed Default Workflow Statuses for PRJ
INSERT INTO workflow_statuses (id, project_id, name, category, position, is_initial)
VALUES
    (1, 1, 'To Do', 'TODO', 0, TRUE),
    (2, 1, 'In Progress', 'IN_PROGRESS', 1, FALSE),
    (3, 1, 'Pending Approval', 'IN_PROGRESS', 2, FALSE),
    (4, 1, 'Done', 'DONE', 3, FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    position = EXCLUDED.position,
    is_initial = EXCLUDED.is_initial;

SELECT setval('workflow_statuses_id_seq', (SELECT MAX(id) FROM workflow_statuses));

-- Seed Default Transitions for PRJ
INSERT INTO workflow_transitions (id, project_id, from_status_id, to_status_id, name, type)
VALUES
    (1, 1, 1, 2, 'Start Progress', 'NORMAL'),
    (2, 1, 2, 3, 'Submit for Approval', 'NORMAL'),
    (3, 1, 3, 4, 'Approve', 'APPROVE'),
    (4, 1, 3, 2, 'Reject', 'REJECT'),
    (5, 1, 4, 1, 'Reopen', 'NORMAL')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type;

SELECT setval('workflow_transitions_id_seq', (SELECT MAX(id) FROM workflow_transitions));
