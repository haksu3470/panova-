import assert from 'node:assert/strict';
import test from 'node:test';
import { DOCUMENT_MAX_BYTES, isStorageFileUrl, storageFileUrl, storagePathFromFileUrl, validateUpload } from './uploads.ts';

test('documents accept pdf jpeg and png under the size cap and reject the rest', () => {
  assert.equal(validateUpload({ type: 'application/pdf', size: 100 }, 'document'), null);
  assert.equal(validateUpload({ type: 'image/jpeg', size: 100 }, 'photo'), null);
  assert.equal(validateUpload({ type: 'image/png', size: 100 }, 'photo'), null);
  assert.equal(validateUpload({ type: 'application/x-msdownload', size: 100 }, 'document'), 'type');
  assert.equal(validateUpload({ type: 'application/zip', size: 100 }, 'document'), 'type');
  assert.equal(validateUpload({ type: 'application/pdf', size: DOCUMENT_MAX_BYTES + 1 }, 'document'), 'size');
  assert.equal(validateUpload({ type: 'image/jpeg', size: 0 }, 'photo'), 'empty');
  assert.equal(validateUpload({ type: 'application/pdf', size: 100 }, 'photo'), 'type');
});

test('storage urls round-trip and data urls do not', () => {
  const url = storageFileUrl('cand/passport/file.pdf');
  assert.equal(isStorageFileUrl(url), true);
  assert.equal(storagePathFromFileUrl(url), 'cand/passport/file.pdf');
  assert.equal(isStorageFileUrl('data:application/pdf;base64,AAAA'), false);
  assert.equal(storagePathFromFileUrl('data:application/pdf;base64,AAAA'), null);
});
