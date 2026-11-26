-- =============================================================================
-- Misbah-ul-Quran IMS — READ-ONLY catalog snapshot
-- Purpose : capture the live schema (constraints, indexes, policies, grants,
--           triggers, functions, RLS flags) before any migration.
-- Safety  : SELECT only. Changes nothing.
-- Run in  : Supabase Dashboard → SQL Editor → paste → Run.
-- Then    : click "Export" → "Copy as CSV" (or download CSV) and give the result back.
-- =============================================================================
WITH
tbls AS (
  SELECT c.oid, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v', 'm', 'p')
)
SELECT * FROM (
  -- 1. Tables / views and RLS status
  SELECT 1 AS ord, 'object' AS section, relname AS table_name,
         CASE relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'matview' ELSE 'partitioned' END AS name,
         'rls=' || relrowsecurity || ' force_rls=' || relforcerowsecurity AS definition
  FROM tbls

  UNION ALL
  -- 2. Constraints (PK, FK, UNIQUE, CHECK) with full definitions incl. ON DELETE rules
  SELECT 2, 'constraint', t.relname, con.conname, pg_get_constraintdef(con.oid)
  FROM pg_constraint con JOIN tbls t ON t.oid = con.conrelid

  UNION ALL
  -- 3. Indexes
  SELECT 3, 'index', t.relname, i.relname, pg_get_indexdef(i.oid)
  FROM pg_index x
  JOIN tbls t ON t.oid = x.indrelid
  JOIN pg_class i ON i.oid = x.indexrelid

  UNION ALL
  -- 4. RLS policies
  SELECT 4, 'policy', p.tablename, p.policyname,
         'cmd=' || p.cmd || ' roles=' || array_to_string(p.roles, ',') ||
         ' permissive=' || p.permissive ||
         ' using=' || COALESCE(p.qual, '-') || ' check=' || COALESCE(p.with_check, '-')
  FROM pg_policies p WHERE p.schemaname = 'public'

  UNION ALL
  -- 5. Table privileges for API roles
  SELECT 5, 'grant', g.table_name, g.grantee, string_agg(g.privilege_type, ',' ORDER BY g.privilege_type)
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public' AND g.grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
  GROUP BY g.table_name, g.grantee

  UNION ALL
  -- 6. Triggers
  SELECT 6, 'trigger', t.relname, tg.tgname, pg_get_triggerdef(tg.oid)
  FROM pg_trigger tg JOIN tbls t ON t.oid = tg.tgrelid
  WHERE NOT tg.tgisinternal

  UNION ALL
  -- 7. Functions in public (and any custom ones someone tried to put in auth)
  SELECT 7, 'function', n.nspname, p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         'security_definer=' || p.prosecdef || ' returns=' || pg_get_function_result(p.oid)
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
     OR (n.nspname = 'auth' AND p.proname IN ('get_user_role', 'get_user_campus'))

  UNION ALL
  -- 8. Column details (type, nullability, default)
  SELECT 8, 'column', c.table_name, c.column_name,
         c.data_type || CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
         COALESCE(' DEFAULT ' || c.column_default, '')
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'

  UNION ALL
  -- 9. Storage buckets
  SELECT 9, 'bucket', b.id, b.name, 'public=' || b.public || ' size_limit=' || COALESCE(b.file_size_limit::text, '-')
  FROM storage.buckets b

  UNION ALL
  -- 10. Storage policies
  SELECT 10, 'storage_policy', p.tablename, p.policyname,
         'cmd=' || p.cmd || ' roles=' || array_to_string(p.roles, ',') || ' using=' || COALESCE(p.qual, '-') || ' check=' || COALESCE(p.with_check, '-')
  FROM pg_policies p WHERE p.schemaname = 'storage'
) s
ORDER BY ord, table_name, name;
