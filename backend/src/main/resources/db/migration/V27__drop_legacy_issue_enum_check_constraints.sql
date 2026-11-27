-- V27__drop_legacy_issue_enum_check_constraints.sql
-- Drop legacy Hibernate auto-DDL CHECK constraints on issues.type / issues.priority
-- (e.g. issues_type_check created before STORY was added to IssueType).
-- Safe and idempotent on both fresh Flyway DBs and legacy ddl-auto=update DBs.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT DISTINCT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE nsp.nspname = current_schema()
          AND rel.relname = 'issues'
          AND con.contype = 'c'
          AND att.attname IN ('type', 'priority')
    LOOP
        EXECUTE format('ALTER TABLE issues DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'V27: dropped legacy check constraint % on issues', r.conname;
    END LOOP;
END $$;
