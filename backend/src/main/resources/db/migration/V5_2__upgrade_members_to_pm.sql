-- V5_2__upgrade_members_to_pm.sql
-- Grant ADMIN system role to the primary workspace administrator account
UPDATE users SET system_role = 'ADMIN' WHERE LOWER(email) = 'phuongthao.me69@gmail.com';

-- Grant PM system role to all existing users so they can create and manage their own projects
UPDATE users SET system_role = 'PM' WHERE system_role = 'MEMBER';

-- Set default system_role to PM for future self-registered accounts
ALTER TABLE users ALTER COLUMN system_role SET DEFAULT 'PM';
