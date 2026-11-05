-- Read-only check for account data access policies.
-- Run in the Supabase SQL Editor and review the results before opening signups.

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles','logs','strength_sets','login_events',
    'coaching_preferences','coaching_cloud_usage','wellness_checkins',
    'coaching_interventions','coaching_outcomes','journal_entries'
  )
ORDER BY tablename;

SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles','logs','strength_sets','login_events',
    'coaching_preferences','coaching_cloud_usage','wellness_checkins',
    'coaching_interventions','coaching_outcomes','journal_entries'
  )
ORDER BY tablename, policyname;

-- These queries only show settings. Even if each table has RLS enabled,
-- test that two separate accounts cannot read, change, or delete each
-- other's rows. Broad permissive policies can still expose information.
