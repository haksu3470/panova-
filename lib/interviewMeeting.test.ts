import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSafeMeetingUrl,
  joinableMeetingUrl,
  MEETING_URL_MAX,
  normalizeMeetingUrl,
  toDateTimeLocalInput,
} from './interviewMeeting.ts';

test('accepts http(s) links with a host', () => {
  for (const url of [
    'https://meet.google.com/abc-defg-hij',
    'http://ornek.com/toplanti',
    'https://zoom.us/j/123?pwd=x',
    'https://teams.microsoft.com/l/meetup-join/19%3a#x',
    'HTTPS://MEET.ORNEK.COM',
  ]) assert.equal(isSafeMeetingUrl(url), true, url);
});

test('rejects other schemes, scheme-less, user info, spaces and long values', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,<b>x</b>',
    'ftp://ornek.com/x',
    'ornek.com/toplanti',
    '//ornek.com',
    'https://',
    'https://user@evil.com',
    'https:// space.com',
    'https://a.com/b c',
    `https://a.com/${'x'.repeat(MEETING_URL_MAX)}`,
    '',
    null,
    42,
  ]) assert.equal(isSafeMeetingUrl(url), false, String(url));
});

test('normalize: empty is null, bad is undefined, good is trimmed', () => {
  assert.equal(normalizeMeetingUrl('   '), null);
  assert.equal(normalizeMeetingUrl(undefined), null);
  assert.equal(normalizeMeetingUrl('javascript:alert(1)'), undefined);
  assert.equal(normalizeMeetingUrl('  https://meet.ornek.com/abc  '), 'https://meet.ornek.com/abc');
});

test('join button only for a safe link', () => {
  assert.equal(joinableMeetingUrl(null), null);
  assert.equal(joinableMeetingUrl('javascript:alert(1)'), null);
  assert.equal(joinableMeetingUrl('https://meet.ornek.com/abc'), 'https://meet.ornek.com/abc');
});

test('datetime-local input uses local time and round-trips', () => {
  const iso = '2026-11-20T09:30:00.000Z';
  const local = toDateTimeLocalInput(iso);
  assert.match(local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  // The form parses the value as local time; that must give the same instant.
  assert.equal(new Date(local).toISOString(), iso);
  assert.equal(toDateTimeLocalInput(null), '');
  assert.equal(toDateTimeLocalInput('not a date'), '');
});
