import assert from 'node:assert/strict';
import test from 'node:test';
import { readClipboardText } from './pasteText.ts';

test('readClipboardText returns the clipboard value', async () => {
  const result = await readClipboardText({
    read: async () => '917346',
  });
  assert.deepEqual(result, { ok: true, value: '917346' });
});

test('readClipboardText keeps a pasted code that includes spaces', async () => {
  const result = await readClipboardText({
    read: async () => ' 917 346 ',
  });
  assert.deepEqual(result, { ok: true, value: ' 917 346 ' });
});

test('readClipboardText reports an empty clipboard', async () => {
  const result = await readClipboardText({
    read: async () => '   ',
  });
  assert.deepEqual(result, { ok: false, reason: 'empty' });
});

test('readClipboardText reports a missing clipboard API', async () => {
  const result = await readClipboardText({ read: null });
  assert.deepEqual(result, { ok: false, reason: 'unavailable' });
});

test('readClipboardText reports a denied read', async () => {
  const result = await readClipboardText({
    read: async () => {
      throw new Error('NotAllowedError');
    },
  });
  assert.deepEqual(result, { ok: false, reason: 'unavailable' });
});
