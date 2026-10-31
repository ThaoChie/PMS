-- V17__add_phone_number_to_users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;
