import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { assertBackupDatabaseUrl, resolvePostgresClient } from '../../lib/backupClient.ts';

const TABLES = [
  'job_candidates',
  'job_requests',
  'employers',
  'staff_members',
  'tasks',
  'candidate_support_tickets',
  'job_offers',
  'candidate_documents',
];

let url;
try {
  url = assertBackupDatabaseUrl(process.env.SUPABASE_DB_URL);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
const postgresClient = resolvePostgresClient(postgres);
const pooled = /pgbouncer=true|:6543\b/i.test(url);
const sql = postgresClient(url, {
  ssl: 'require',
  max: 1,
  prepare: !pooled,
  connect_timeout: 20,
});

const backup = {};
const failures = [];
try {
  for (const table of TABLES) {
    try {
      backup[table] = await sql`SELECT * FROM ${sql(table)}`;
      console.log(`read ${table}: ${backup[table].length} rows`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${table}: ${message}`);
      console.error(`table read failed: ${table}: ${message}`);
    }
  }
  if (failures.length) {
    console.error(`Backup incomplete (${failures.length} tables).`);
    process.exitCode = 1;
  } else {
    const filename = `panova_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const outDir = join(dirname(fileURLToPath(import.meta.url)), 'out');
    mkdirSync(outDir, { recursive: true });
    const path = join(outDir, filename);
    writeFileSync(path, JSON.stringify(backup, null, 2));
    console.log(`Backup written: ${path}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
