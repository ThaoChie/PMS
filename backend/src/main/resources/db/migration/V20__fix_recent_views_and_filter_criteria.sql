-- V20__fix_recent_views_and_filter_criteria.sql
-- Dev 3: khop schema voi entity sau khi tat hibernate ddl-auto (commit 6536cec).
--
-- 1) RecentView extends BaseEntity nen Hibernate doc/ghi created_at, updated_at,
--    nhung V9 chi tao viewed_at -> moi truy van recent_views loi 500
--    (mo chi tiet issue, tim kiem, quick search, export).
ALTER TABLE recent_views ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE recent_views ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2) SavedFilter.criteria la String (TEXT) nhung V10 tao kieu JSONB
--    -> luu bo loc loi "column criteria is of type jsonb but expression is of type character varying".
--    Chuyen ve TEXT (giu nguyen du lieu cu); JSON van duoc kiem tra o tang service.
ALTER TABLE saved_filters ALTER COLUMN criteria TYPE TEXT USING criteria::text;
