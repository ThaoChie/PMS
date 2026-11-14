-- V22__relax_legacy_not_null_columns.sql
--
-- Loi 409 "Thieu thong tin bat buoc" khi Ghi nhan thoi gian va Luu bo loc tren moi truong online.
--
-- Nguyen nhan: CSDL online tung chay voi hibernate ddl-auto=update. Phien ban entity cu da tao
-- cac cot BAT BUOC (NOT NULL) ma entity hien tai khong con ghi nua:
--   worklogs.time_spent, worklogs.date      (Worklog cu: timeSpent, date @Column(nullable=false))
--   saved_filters.filter_config_json         (SavedFilter cu: filterConfigJson)
-- Sau khi tat ddl-auto (6536cec), cac cot nay van con va van bat buoc -> moi lenh INSERT bi tu choi:
--   null value in column "time_spent" of relation "worklogs" violates not-null constraint
--
-- Cach sua: bo rang buoc NOT NULL tren MOI cot khong thuoc schema chuan cua 2 bang nay.
--   - Khong xoa cot  -> khong mat du lieu cu.
--   - Tren CSDL tao moi bang Flyway (khong co cot thua) -> khong lam gi.
--   - Chay lai nhieu lan van an toan.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.is_nullable = 'NO'
          AND (
                (c.table_name = 'worklogs' AND c.column_name NOT IN
                    ('id', 'issue_id', 'user_id', 'time_spent_min', 'work_date', 'comment', 'created_at', 'updated_at'))
             OR (c.table_name = 'saved_filters' AND c.column_name NOT IN
                    ('id', 'user_id', 'name', 'criteria', 'is_shared', 'created_at', 'updated_at'))
          )
    LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', r.table_name, r.column_name);
        RAISE NOTICE 'V22: bo NOT NULL tren cot cu %.%', r.table_name, r.column_name;
    END LOOP;
END $$;
