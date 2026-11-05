-- User-owned rows must be removed when Supabase Auth deletes an account.
-- Safe to run after the earlier manually applied deletion constraints.
-- Existing cascade keys are left unchanged.
DO $$
DECLARE
  item record;
  relation_name regclass;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('profiles', 'id'),
      ('logs', 'user_id'),
      ('strength_sets', 'user_id'),
      ('login_events', 'user_id'),
      ('coaching_preferences', 'user_id'),
      ('coaching_cloud_usage', 'user_id'),
      ('wellness_checkins', 'user_id'),
      ('coaching_interventions', 'user_id'),
      ('coaching_outcomes', 'user_id'),
      ('journal_entries', 'user_id')
    ) AS targets(table_name, column_name)
  LOOP
    relation_name := to_regclass(format('public.%I', item.table_name));
    IF relation_name IS NULL THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid
        AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = relation_name
        AND c.confrelid = 'auth.users'::regclass
        AND c.contype = 'f'
        AND c.confdeltype = 'c'
        AND a.attname = item.column_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
        item.table_name, item.table_name || '_auth_user_fk', item.column_name
      );
    END IF;
  END LOOP;
END
$$;
