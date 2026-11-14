/**
 * Candidate profile videos are links on the Panova YouTube channel
 * "Panova Group Official" (https://www.youtube.com/@Panovagroup, channel id
 * UCHzIu3R81xP0_GE2XbCQ17w). Videos are uploaded there as unlisted. The
 * portal stores a watch, youtu.be, shorts, or embed URL. Playback uses the
 * video id only, so the embed never follows an arbitrary address.
 * Before a new link is saved, /api/youtube-check asks YouTube oEmbed which
 * channel owns it (lib/youtubeChannel.ts).
 */

/** Channel handle (without @, lower case) that candidate videos must come from. */
export const YOUTUBE_ALLOWED_CHANNEL_HANDLE = 'panovagroup';
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@Panovagroup';
export const YOUTUBE_CHANNEL_ID = 'UCHzIu3R81xP0_GE2XbCQ17w';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export const YOUTUBE_URL_PLACEHOLDER = 'https://www.youtube.com/watch?v=';

const VIDEO_MANAGER_ROLES = new Set(['upper_management', 'source_country', 'target_country']);

export class YouTubeUrlError extends Error {
  constructor() {
    super('invalid_youtube_url');
    this.name = 'YouTubeUrlError';
  }
}

export type CandidateVideoFields = {
  video_url?: string | null;
  video_url_1?: string | null;
  video_url_2?: string | null;
  video_url_3?: string | null;
};

export type CandidateVideoWrite = {
  video_url: string | null;
  video_url_1: string | null;
  video_url_2: string | null;
  video_url_3: string | null;
};

export type YouTubeEntry =
  | { kind: 'embed'; id: string; watchUrl: string }
  | { kind: 'link'; href: string };

/** Region and country supervisors, plus upper management. */
export function canManageCandidateVideo(role: string | null | undefined): boolean {
  return VIDEO_MANAGER_ROLES.has((role ?? '').trim().toLowerCase());
}

export function isMissingVideoPermissionRpc(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = `${error.code || ''} ${error.message || ''}`;
  return error.code === 'PGRST202' || /can_manage_candidate_video|schema cache|could not find the function/i.test(message);
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

function isVideoId(value: string): boolean {
  return VIDEO_ID.test(value);
}

function asUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

function hostName(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
}

/**
 * Accept youtube.com/watch, youtu.be, youtube.com/shorts, and youtube.com/embed.
 * Extra query parameters are ignored. Anything else, including channel pages, is rejected.
 */
export function parseYouTubeVideoId(input: string | null | undefined): string | null {
  const trimmed = input?.trim() ?? '';
  if (!trimmed || trimmed.length > 500) return null;
  if (/^https?:\/\/[^/?#\s]+:\d+/i.test(trimmed)) return null;
  const url = asUrl(trimmed);
  if (!url) return null;
  const host = hostName(url);
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    if (parts.length !== 1 || !isVideoId(parts[0])) return null;
    return parts[0];
  }

  if (host !== 'youtube.com') return null;

  if (parts[0] === 'watch') {
    if (parts.length !== 1) return null;
    const id = url.searchParams.get('v') ?? '';
    return isVideoId(id) ? id : null;
  }

  if ((parts[0] === 'shorts' || parts[0] === 'embed') && parts.length === 2 && isVideoId(parts[1])) {
    return parts[1];
  }

  return null;
}

/** Blank clears the field. A non-empty value must be one of the four YouTube forms. */
export function normalizeYouTubeField(input: string | null | undefined): string | null {
  const trimmed = input?.trim() ?? '';
  if (!trimmed) return null;
  const id = parseYouTubeVideoId(trimmed);
  if (!id) throw new YouTubeUrlError();
  return youtubeWatchUrl(id);
}

/** Slot 1 is also stored on video_url, which older screens already read. */
export function candidateVideoWrite(input: {
  videoUrl1: string;
  videoUrl2: string;
  videoUrl3: string;
}): CandidateVideoWrite {
  const video_url_1 = normalizeYouTubeField(input.videoUrl1);
  const video_url_2 = normalizeYouTubeField(input.videoUrl2);
  const video_url_3 = normalizeYouTubeField(input.videoUrl3);
  return {
    video_url: video_url_1,
    video_url_1,
    video_url_2,
    video_url_3,
  };
}

function httpHref(input: string): string | null {
  const url = asUrl(input.trim());
  if (!url) return null;
  return url.href;
}

/** Profile order: slot 1, the legacy primary URL, then slots 2 and 3. Same film is shown once. */
export function candidateYouTubeEntries(row: CandidateVideoFields | null | undefined): YouTubeEntry[] {
  const sources = [row?.video_url_1, row?.video_url, row?.video_url_2, row?.video_url_3];
  const seen = new Set<string>();
  const entries: YouTubeEntry[] = [];

  for (const source of sources) {
    const trimmed = source?.trim() ?? '';
    if (!trimmed) continue;
    const id = parseYouTubeVideoId(trimmed);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
      entries.push({ kind: 'embed', id, watchUrl: youtubeWatchUrl(id) });
      continue;
    }
    const href = httpHref(trimmed);
    if (!href || seen.has(href)) continue;
    seen.add(href);
    entries.push({ kind: 'link', href });
  }

  return entries;
}

export function youtubeSaveFailure(message: string | null | undefined): 'forbidden' | 'invalid' | null {
  const text = message ?? '';
  if (/youtube_video_forbidden|42501/i.test(text)) return 'forbidden';
  if (/video_url|23514|check constraint/i.test(text)) return 'invalid';
  return null;
}
