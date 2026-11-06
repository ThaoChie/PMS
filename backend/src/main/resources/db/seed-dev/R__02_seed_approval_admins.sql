-- R__02_seed_approval_admins.sql
-- Nạp admin@epms.com (id = 1) vào app_admins để phục vụ duyệt cấp 2 trong môi trường dev

INSERT INTO app_admins (user_id)
SELECT id FROM users WHERE email = 'admin@epms.com'
ON CONFLICT (user_id) DO NOTHING;
