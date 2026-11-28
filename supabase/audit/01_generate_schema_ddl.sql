-- =============================================================================
-- Misbah-ul-Quran IMS — READ-ONLY schema export (DDL generator)
-- -----------------------------------------------------------------------------
-- Run on the SOURCE project. It changes nothing: it returns one row per SQL
-- statement needed to recreate the public schema exactly (sequences, tables,
-- constraints, indexes, functions, triggers, RLS, policies, grants), in the
-- order they must run. Export the result as CSV and give it back; it is turned
-- into supabase/migrations/20261127_00_baseline.sql for new projects.
-- =============================================================================
WITH
tbl AS (
  SELECT c.oid, c.relname
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
),
stmts AS (
  -- 10. Sequences
  SELECT 10 AS phase, c.relname AS obj, 0 AS sub,
         format('CREATE SEQUENCE IF NOT EXISTS public.%I;', c.relname) AS stmt
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'S'

  UNION ALL
  -- 20. Tables with columns, types, defaults and NOT NULL
  SELECT 20, t.relname, 0,
         format(E'CREATE TABLE IF NOT EXISTS public.%I (\n%s\n);', t.relname,
           string_agg(
             format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
                    CASE WHEN d.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) ELSE '' END,
                    CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END),
             E',\n' ORDER BY a.attnum))
  FROM tbl t
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  GROUP BY t.relname

  UNION ALL
  -- 25. Sequence ownership
  SELECT 25, s.relname, 0,
         format('ALTER SEQUENCE public.%I OWNED BY public.%I.%I;', s.relname, t.relname, a.attname)
  FROM pg_class s
  JOIN pg_namespace n ON n.oid = s.relnamespace AND n.nspname = 'public'
  JOIN pg_depend dep ON dep.objid = s.oid AND dep.deptype = 'a'
  JOIN pg_class t ON t.oid = dep.refobjid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = dep.refobjsubid
  WHERE s.relkind = 'S'

  UNION ALL
  -- 30. Primary keys, unique and check constraints
  SELECT 30, t.relname, CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 ELSE 3 END,
         format('ALTER TABLE public.%I ADD CONSTRAINT %I %s;', t.relname, con.conname, pg_get_constraintdef(con.oid))
  FROM pg_constraint con JOIN tbl t ON t.oid = con.conrelid
  WHERE con.contype IN ('p', 'u', 'c')

  UNION ALL
  -- 40. Foreign keys (after every table exists)
  SELECT 40, t.relname, 0,
         format('ALTER TABLE public.%I ADD CONSTRAINT %I %s;', t.relname, con.conname, pg_get_constraintdef(con.oid))
  FROM pg_constraint con JOIN tbl t ON t.oid = con.conrelid
  WHERE con.contype = 'f'

  UNION ALL
  -- 50. Indexes that do not back a constraint
  SELECT 50, t.relname, 0, pg_get_indexdef(i.indexrelid) || ';'
  FROM pg_index i JOIN tbl t ON t.oid = i.indrelid
  WHERE NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)

  UNION ALL
  -- 60. Functions in public
  SELECT 60, p.proname, 0, pg_get_functiondef(p.oid) || ';'
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'

  UNION ALL
  -- 70. Triggers
  SELECT 70, t.relname, 0, pg_get_triggerdef(tg.oid) || ';'
  FROM pg_trigger tg JOIN tbl t ON t.oid = tg.tgrelid
  WHERE NOT tg.tgisinternal

  UNION ALL
  -- 80. Row Level Security
  SELECT 80, c.relname, 0, format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', c.relname)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity

  UNION ALL
  -- 90. Policies
  SELECT 90, p.tablename || '.' || p.policyname, 0,
         format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
                p.policyname, p.tablename, p.permissive, p.cmd, array_to_string(p.roles, ', '),
                CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
                CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END)
  FROM pg_policies p
  WHERE p.schemaname = 'public'

  UNION ALL
  -- 95. Table grants for the API roles
  SELECT 95, g.table_name || '.' || g.grantee, 0,
         format('GRANT %s ON public.%I TO %s;', string_agg(g.privilege_type, ', ' ORDER BY g.privilege_type), g.table_name, g.grantee)
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public' AND g.grantee IN ('anon', 'authenticated')
  GROUP BY g.table_name, g.grantee

  UNION ALL
  -- 97. Function execute grants for the API roles
  SELECT 97, r.routine_name || '.' || r.grantee, 0,
         format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO %s;', r.routine_name,
                pg_get_function_identity_arguments(p.oid), r.grantee)
  FROM information_schema.routine_privileges r
  JOIN pg_proc p ON p.proname = r.routine_name
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  WHERE r.routine_schema = 'public' AND r.grantee IN ('anon', 'authenticated') AND r.privilege_type = 'EXECUTE'
)
SELECT phase, obj, sub, stmt
FROM stmts
ORDER BY phase, sub, obj;
