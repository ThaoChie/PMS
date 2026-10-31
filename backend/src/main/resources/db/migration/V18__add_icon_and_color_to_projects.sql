-- V18__add_icon_and_color_to_projects.sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS color VARCHAR(30) DEFAULT '#1A1A1A',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'folder';
