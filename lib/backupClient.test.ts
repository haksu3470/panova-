import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertBackupDatabaseUrl,
  resolvePostgresClient,
  toIpv4CompatibleDatabaseUrl,
} from './backupClient.ts';

test('a module namespace is unwrapped to the postgres function', () => {
  const client = (url: string) => url;
  assert.equal(resolvePostgresClient(client), client);
  assert.equal(resolvePostgresClient({ default: client }), client);
  assert.throws(() => resolvePostgresClient({ default: 'nope' }), /not a function/);
});

test('a missing database URL names the secret and does not invent a connection', () => {
  assert.throws(() => assertBackupDatabaseUrl(''), /SUPABASE_DB_URL/);
  assert.throws(() => assertBackupDatabaseUrl('eyJhbGciOiJIUzI1NiJ9'), /postgres/);
  assert.equal(
    assertBackupDatabaseUrl('postgresql://postgres:secret@db.example.com:5432/postgres'),
    'postgresql://postgres:secret@db.example.com:5432/postgres',
  );
});

test('direct db host is rewritten to the session pooler with region', () => {
  const input =
    'postgresql://postgres:s3cret@db.vptcihlhkzfmwxpaituf.supabase.co:5432/postgres';
  const out = toIpv4CompatibleDatabaseUrl(input, { region: 'eu-central-1' });
  const parsed = new URL(out);
  assert.equal(parsed.hostname, 'aws-0-eu-central-1.pooler.supabase.com');
  assert.equal(parsed.port, '5432');
  assert.equal(parsed.username, 'postgres.vptcihlhkzfmwxpaituf');
  assert.equal(parsed.password, 's3cret');
  assert.equal(parsed.pathname, '/postgres');
});

test('direct db host without region throws a clear error', () => {
  const prev = process.env.SUPABASE_DB_REGION;
  delete process.env.SUPABASE_DB_REGION;
  try {
    assert.throws(
      () =>
        toIpv4CompatibleDatabaseUrl(
          'postgresql://postgres:s3cret@db.vptcihlhkzfmwxpaituf.supabase.co:5432/postgres',
        ),
      /SUPABASE_DB_REGION|Session pooler/,
    );
  } finally {
    if (prev === undefined) delete process.env.SUPABASE_DB_REGION;
    else process.env.SUPABASE_DB_REGION = prev;
  }
});

test('already-pooler URL is returned unchanged', () => {
  const input =
    'postgresql://postgres.vptcihlhkzfmwxpaituf:s3cret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';
  assert.equal(toIpv4CompatibleDatabaseUrl(input, { region: 'eu-central-1' }), input);
});
