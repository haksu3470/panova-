// Interview meeting link and time helpers.
// isSafeMeetingUrl mirrors the database check interviews_meeting_url_check
// (supabase/migrations/20261113130000_interview_meeting_url.sql).

export const MEETING_URL_MAX = 2000;

const MEETING_URL_RE = /^https?:\/\/[^\s/?#@]+([/?#]\S*)?$/i;

/** True for an http(s) link with a host; false for javascript:, data:, ftp:, scheme-less, spaces. */
export function isSafeMeetingUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value || value.length > MEETING_URL_MAX) return false;
  return MEETING_URL_RE.test(value);
}

/**
 * Form value to the stored value: trimmed, empty -> null.
 * Returns undefined when the value is not a safe link (caller shows an error).
 */
export function normalizeMeetingUrl(value: unknown): string | null | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  return isSafeMeetingUrl(text) ? text : undefined;
}

/** The link to open, or null when the button must not be shown. */
export function joinableMeetingUrl(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return isSafeMeetingUrl(text) ? text : null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * timestamptz -> value for <input type="datetime-local"> in the viewer's own
 * time zone. (toISOString() would show UTC as if it were local time and move
 * the interview by the offset on the next save.)
 */
export function toDateTimeLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
