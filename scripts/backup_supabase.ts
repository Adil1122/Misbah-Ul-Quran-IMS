/**
 * Read-only logical backup of the Supabase project.
 *
 * Exports every table/view exposed by PostgREST, plus the Supabase Auth user list,
 * to backups/<timestamp>/<table>.json and writes a manifest with row counts.
 *
 * Usage:  npx tsx scripts/backup_supabase.ts
 * Needs:  VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env
 *
 * The output contains personal data. backups/ is git-ignored; keep it private.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !key) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const PAGE_SIZE = 1000;

async function listTables(): Promise<string[]> {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' },
  });
  if (!res.ok) throw new Error(`OpenAPI request failed: HTTP ${res.status}`);
  const spec: any = await res.json();
  return Object.keys(spec.definitions || {}).sort();
}

async function main() {
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(process.cwd(), 'backups', stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const manifest: { createdAt: string; host: string; tables: Record<string, number>; authUsers?: number; errors: string[] } = {
    createdAt: new Date().toISOString(),
    host: new URL(url).host,
    tables: {},
    errors: [],
  };

  for (const table of await listTables()) {
    const rows: any[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1);
      if (error) {
        manifest.errors.push(`${table}: ${error.message}`);
        break;
      }
      rows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
    }
    fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2), 'utf-8');
    manifest.tables[table] = rows.length;
    console.log(`${table.padEnd(24)} ${rows.length}`);
  }

  // Supabase Auth users (metadata only; Auth never returns password hashes through the API).
  const authUsers: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      manifest.errors.push(`auth.users: ${error.message}`);
      break;
    }
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }
  fs.writeFileSync(path.join(outDir, '_auth_users.json'), JSON.stringify(authUsers, null, 2), 'utf-8');
  manifest.authUsers = authUsers.length;
  console.log(`${'auth.users'.padEnd(24)} ${authUsers.length}`);

  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nBackup written to ${outDir}`);
  if (manifest.errors.length) {
    console.error('Errors:\n  ' + manifest.errors.join('\n  '));
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Backup failed:', err?.message || err);
  process.exit(1);
});
