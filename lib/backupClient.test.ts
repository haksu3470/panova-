import assert from 'node:assert/strict';
import test from 'node:test';
import { assertBackupDatabaseUrl, resolvePostgresClient } from './backupClient.ts';

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
