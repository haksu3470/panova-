/**
 * Server-side check that a candidate video belongs to the Panova channel.
 *
 * YouTube oEmbed (https://www.youtube.com/oembed) answers for public and
 * unlisted videos and returns the uploader's author_url
 * (https://www.youtube.com/@Handle). Private and deleted videos answer
 * 401 / 404, which is "unavailable": a link that cannot be checked is not saved.
 *
 * The check runs in the app and its API route only. A database trigger cannot
 * call YouTube, so someone writing to the table directly skips it (accepted
 * risk, docs/portal-qa.md).
 *
 * Nothing here logs the link or the oEmbed answer.
 */
import {
  YOUTUBE_ALLOWED_CHANNEL_HANDLE,
  canManageCandidateVideo,
  parseYouTubeVideoId,
  youtubeWatchUrl,
} from './youtube';

export type YouTubeCheckReason = 'wrong_channel' | 'unavailable' | 'invalid';
export type YouTubeCheckResult = { ok: true; title: string } | { ok: false; reason: YouTubeCheckReason };

export const YOUTUBE_CHECK_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 2000;

type FetchLike = (input: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

/** "@PanovaGroup", " panovagroup " -> "panovagroup". Blank falls back to the Panova handle. */
export function allowedChannelHandle(value: string | null | undefined = process.env.YOUTUBE_ALLOWED_CHANNEL_HANDLE): string {
  const handle = (value ?? '').trim().replace(/^@/, '').toLowerCase();
  return handle || YOUTUBE_ALLOWED_CHANNEL_HANDLE;
}

/** Handle from an oEmbed author_url such as https://www.youtube.com/@Panovagroup. */
export function channelHandleFromAuthorUrl(authorUrl: unknown): string | null {
  if (typeof authorUrl !== 'string') return null;
  let url: URL;
  try {
    url = new URL(authorUrl);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (host !== 'youtube.com') return null;
  const first = url.pathname.split('/').filter(Boolean)[0] ?? '';
  if (!first.startsWith('@')) return null;
  let handle: string;
  try {
    handle = decodeURIComponent(first.slice(1));
  } catch {
    return null;
  }
  return handle ? handle.toLowerCase() : null;
}

export function oembedUrl(videoId: string): string {
  return `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeWatchUrl(videoId))}&format=json`;
}

/** Ask oEmbed who uploaded the video. Any failure to get a clear answer is "unavailable". */
export async function checkYouTubeVideo(
  input: unknown,
  deps: { fetch: FetchLike; allowedHandle?: string; timeoutMs?: number },
): Promise<YouTubeCheckResult> {
  const id = typeof input === 'string' ? parseYouTubeVideoId(input) : null;
  if (!id) return { ok: false, reason: 'invalid' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? YOUTUBE_CHECK_TIMEOUT_MS);
  try {
    const response = await deps.fetch(oembedUrl(id), {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok || response.status !== 200) return { ok: false, reason: 'unavailable' };
    const data = await response.json();
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const handle = channelHandleFromAuthorUrl(record.author_url);
    if (!handle) return { ok: false, reason: 'unavailable' };
    if (handle !== allowedChannelHandle(deps.allowedHandle)) return { ok: false, reason: 'wrong_channel' };
    const title = typeof record.title === 'string' ? record.title.slice(0, 200) : '';
    return { ok: true, title };
  } catch {
    // timeout (abort), network error, bad JSON
    return { ok: false, reason: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

export type SessionRole = { session: false } | { session: true; role: string | null };

export type YouTubeCheckResponse = {
  status: number;
  body: YouTubeCheckResult | { ok: false; reason: 'unauthorized' | 'forbidden' };
};

/**
 * POST /api/youtube-check body { url }.
 * 401 without a valid session, 403 for a role that may not manage videos,
 * 400 for a link that is not a YouTube video, otherwise 200 with the result.
 */
export async function handleYouTubeCheck(
  request: Request,
  deps: {
    sessionRole: (token: string) => Promise<SessionRole>;
    fetch: FetchLike;
    allowedHandle?: string;
    timeoutMs?: number;
  },
): Promise<YouTubeCheckResponse> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? '';
  if (!token) return { status: 401, body: { ok: false, reason: 'unauthorized' } };

  let who: SessionRole;
  try {
    who = await deps.sessionRole(token);
  } catch {
    who = { session: false };
  }
  if (!who.session) return { status: 401, body: { ok: false, reason: 'unauthorized' } };
  if (!canManageCandidateVideo(who.role)) return { status: 403, body: { ok: false, reason: 'forbidden' } };

  const declared = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { status: 400, body: { ok: false, reason: 'invalid' } };
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { status: 400, body: { ok: false, reason: 'invalid' } };
  }
  const url = body && typeof body === 'object' ? (body as { url?: unknown }).url : undefined;
  if (typeof url !== 'string' || !parseYouTubeVideoId(url)) {
    return { status: 400, body: { ok: false, reason: 'invalid' } };
  }

  const result = await checkYouTubeVideo(url, {
    fetch: deps.fetch,
    allowedHandle: deps.allowedHandle,
    timeoutMs: deps.timeoutMs,
  });
  return { status: 200, body: result };
}

/* ---------------------------------------------------------------- client */

export type VideoSlotCheck = 'wrong_channel' | 'unavailable' | 'invalid' | 'forbidden';

/** Dictionary key shown under a video box for each failed check. */
export const VIDEO_CHECK_MESSAGE_KEY = {
  wrong_channel: 'youtubeVideoWrongChannel',
  unavailable: 'youtubeVideoUnavailable',
  invalid: 'youtubeVideoInvalid',
  forbidden: 'youtubeVideoReadOnly',
} as const satisfies Record<VideoSlotCheck, string>;

/** Call the route from the browser. Anything but a clear "ok" blocks the save. */
export async function requestYouTubeCheck(
  url: string,
  token: string,
  fetchImpl: (input: string, init: RequestInit) => Promise<Response> = fetch,
): Promise<{ ok: true } | { ok: false; reason: VideoSlotCheck }> {
  try {
    const response = await fetchImpl('/api/youtube-check', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (response.status === 400) return { ok: false, reason: 'invalid' };
    if (!response.ok) return { ok: false, reason: 'unavailable' };
    const data = (await response.json()) as { ok?: unknown; reason?: unknown };
    if (data?.ok === true) return { ok: true };
    const reason = data?.reason;
    return { ok: false, reason: reason === 'wrong_channel' || reason === 'invalid' ? reason : 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Which slots need a channel check: filled, and a different video from the
 * one already saved. Saved videos are not re-checked; blank slots are skipped.
 */
export function slotsToCheck(slots: { id: string; value: string; saved: string | null | undefined }[]): { id: string; value: string }[] {
  return slots
    .filter((slot) => {
      const id = parseYouTubeVideoId(slot.value);
      if (!id) return false;
      return id !== parseYouTubeVideoId(slot.saved ?? '');
    })
    .map((slot) => ({ id: slot.id, value: slot.value }));
}

/** Check the slots in parallel; returns the failing ones by slot id (empty = all passed). */
export async function checkVideoSlots(
  slots: { id: string; value: string }[],
  check: (url: string) => Promise<{ ok: true } | { ok: false; reason: VideoSlotCheck }>,
): Promise<Record<string, VideoSlotCheck>> {
  const results = await Promise.all(slots.map(async (slot) => [slot.id, await check(slot.value)] as const));
  const failures: Record<string, VideoSlotCheck> = {};
  for (const [id, result] of results) {
    if (!result.ok) failures[id] = result.reason;
  }
  return failures;
}
