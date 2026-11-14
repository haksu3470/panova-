import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const {
  VIDEO_CHECK_MESSAGE_KEY,
  allowedChannelHandle,
  channelHandleFromAuthorUrl,
  checkVideoSlots,
  checkYouTubeVideo,
  handleYouTubeCheck,
  oembedUrl,
  requestYouTubeCheck,
  slotsToCheck,
} = await import('./youtubeChannel.ts');
const { YOUTUBE_ALLOWED_CHANNEL_HANDLE } = await import('./youtube.ts');
const { translations } = await import('./dictionary.ts');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');

const VIDEO = 'https://youtu.be/dQw4w9WgXcQ';
const PANOVA = 'https://www.youtube.com/@Panovagroup';

type Call = { url: string };
function fakeFetch(answer: { status?: number; body?: unknown; throws?: unknown; hang?: boolean }) {
  const calls: Call[] = [];
  const fn = async (url: string, init?: { signal?: AbortSignal }) => {
    calls.push({ url });
    if (answer.hang) {
      await new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    }
    if (answer.throws) throw answer.throws;
    const status = answer.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (answer.body === 'not json') throw new SyntaxError('bad json');
        return answer.body;
      },
    };
  };
  return { fn, calls };
}

function post(body: unknown, headers: Record<string, string> = { authorization: 'Bearer token-1' }) {
  return new Request('http://localhost/api/youtube-check', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const staff = (role: string | null) => async () => ({ session: true as const, role });

test('the allowed channel is Panova by default; the env value is normalised', () => {
  assert.equal(YOUTUBE_ALLOWED_CHANNEL_HANDLE, 'panovagroup');
  assert.equal(allowedChannelHandle(undefined), 'panovagroup');
  assert.equal(allowedChannelHandle('  '), 'panovagroup');
  assert.equal(allowedChannelHandle('@Other_Channel'), 'other_channel');
});

test('the handle comes from the oEmbed author_url, in lower case', () => {
  assert.equal(channelHandleFromAuthorUrl(PANOVA), 'panovagroup');
  assert.equal(channelHandleFromAuthorUrl('https://youtube.com/@PANOVAGROUP/videos'), 'panovagroup');
  assert.equal(channelHandleFromAuthorUrl('https://m.youtube.com/@panovagroup'), 'panovagroup');
  assert.equal(channelHandleFromAuthorUrl('https://www.youtube.com/channel/UCHzIu3R81xP0_GE2XbCQ17w'), null);
  assert.equal(channelHandleFromAuthorUrl('https://evil.example/@panovagroup'), null);
  assert.equal(channelHandleFromAuthorUrl('javascript:alert(1)'), null);
  assert.equal(channelHandleFromAuthorUrl(42), null);
});

test('a video on the Panova channel is accepted (unlisted videos answer oEmbed the same way)', async () => {
  const { fn, calls } = fakeFetch({ body: { title: 'Aday tanıtımı', author_name: 'Panova Group Official', author_url: PANOVA } });
  assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: fn }), { ok: true, title: 'Aday tanıtımı' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, oembedUrl('dQw4w9WgXcQ'));
  assert.equal(calls[0].url, 'https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&format=json');
});

test('the handle match ignores upper and lower case', async () => {
  for (const author of ['https://www.youtube.com/@PanovaGroup', 'https://www.youtube.com/@PANOVAGROUP']) {
    const { fn } = fakeFetch({ body: { title: 't', author_url: author } });
    assert.equal((await checkYouTubeVideo(VIDEO, { fetch: fn })).ok, true, author);
  }
  const { fn } = fakeFetch({ body: { title: 't', author_url: PANOVA } });
  assert.equal((await checkYouTubeVideo(VIDEO, { fetch: fn, allowedHandle: '@PANOVAGROUP' })).ok, true);
});

test('a video from another channel is wrong_channel', async () => {
  const { fn } = fakeFetch({ body: { title: 't', author_url: 'https://www.youtube.com/@SomeoneElse' } });
  assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: fn }), { ok: false, reason: 'wrong_channel' });
});

test('private, deleted, timeout, network and bad answers are unavailable (fail closed)', async () => {
  for (const status of [401, 403, 404, 500]) {
    const { fn } = fakeFetch({ status });
    assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: fn }), { ok: false, reason: 'unavailable' }, String(status));
  }
  const hang = fakeFetch({ hang: true });
  const started = Date.now();
  assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: hang.fn, timeoutMs: 30 }), { ok: false, reason: 'unavailable' });
  assert.ok(Date.now() - started < 2000, 'the timeout ends the request');
  assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: fakeFetch({ throws: new TypeError('fetch failed') }).fn }), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: fakeFetch({ body: 'not json' }).fn }), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await checkYouTubeVideo(VIDEO, { fetch: fakeFetch({ body: { title: 't' } }).fn }), { ok: false, reason: 'unavailable' });
});

test('a link that is not a YouTube video is invalid and YouTube is not called', async () => {
  const { fn, calls } = fakeFetch({ body: {} });
  for (const url of ['', 'https://www.youtube.com/@Panovagroup', 'https://vimeo.com/123', 42]) {
    assert.deepEqual(await checkYouTubeVideo(url, { fetch: fn }), { ok: false, reason: 'invalid' });
  }
  assert.equal(calls.length, 0);
});

test('route: no session 401, wrong role 403, bad link 400, otherwise 200 with the result', async () => {
  const ok = fakeFetch({ body: { title: 'T', author_url: PANOVA } });

  let res = await handleYouTubeCheck(post({ url: VIDEO }, {}), { sessionRole: staff('upper_management'), fetch: ok.fn });
  assert.equal(res.status, 401);

  res = await handleYouTubeCheck(post({ url: VIDEO }), { sessionRole: async () => ({ session: false as const }), fetch: ok.fn });
  assert.equal(res.status, 401);

  res = await handleYouTubeCheck(post({ url: VIDEO }), { sessionRole: async () => { throw new Error('auth down'); }, fetch: ok.fn });
  assert.equal(res.status, 401);

  for (const role of ['field_officer', 'finance', 'limited', null]) {
    const forbidden = fakeFetch({ body: { title: 'T', author_url: PANOVA } });
    res = await handleYouTubeCheck(post({ url: VIDEO }), { sessionRole: staff(role), fetch: forbidden.fn });
    assert.equal(res.status, 403, String(role));
    assert.equal(forbidden.calls.length, 0, 'no YouTube call without the role');
  }

  for (const body of [{ url: 'https://example.com/video' }, { url: 7 }, {}, 'not json']) {
    res = await handleYouTubeCheck(post(body), { sessionRole: staff('source_country'), fetch: ok.fn });
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(res.body, { ok: false, reason: 'invalid' });
  }

  for (const role of ['upper_management', 'source_country', 'target_country']) {
    res = await handleYouTubeCheck(post({ url: VIDEO }), { sessionRole: staff(role), fetch: ok.fn });
    assert.equal(res.status, 200, role);
    assert.deepEqual(res.body, { ok: true, title: 'T' });
  }

  const other = fakeFetch({ body: { title: 'T', author_url: 'https://www.youtube.com/@other' } });
  res = await handleYouTubeCheck(post({ url: VIDEO }), { sessionRole: staff('upper_management'), fetch: other.fn });
  assert.deepEqual(res, { status: 200, body: { ok: false, reason: 'wrong_channel' } });

  const gone = fakeFetch({ status: 404 });
  res = await handleYouTubeCheck(post({ url: VIDEO }), { sessionRole: staff('upper_management'), fetch: gone.fn });
  assert.deepEqual(res, { status: 200, body: { ok: false, reason: 'unavailable' } });
});

test('browser call: only a clear ok passes', async () => {
  const reply = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', reply(200, { ok: true, title: 'x' })), { ok: true });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', reply(200, { ok: false, reason: 'wrong_channel' })), { ok: false, reason: 'wrong_channel' });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', reply(200, { ok: false, reason: 'whatever' })), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', reply(400, { ok: false, reason: 'invalid' })), { ok: false, reason: 'invalid' });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', reply(403, {})), { ok: false, reason: 'forbidden' });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', reply(502, {})), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await requestYouTubeCheck(VIDEO, 't', async () => { throw new TypeError('offline'); }), { ok: false, reason: 'unavailable' });
});

test('only new, filled links are checked; saved and blank boxes are not', async () => {
  const saved = 'https://www.youtube.com/watch?v=aaaaaaaaaaa';
  const slots = slotsToCheck([
    { id: 'v1', value: 'https://youtu.be/aaaaaaaaaaa', saved },
    { id: 'v2', value: '  ', saved: null },
    { id: 'v3', value: 'https://youtu.be/bbbbbbbbbbb', saved },
  ]);
  assert.deepEqual(slots, [{ id: 'v3', value: 'https://youtu.be/bbbbbbbbbbb' }]);
  const failures = await checkVideoSlots(
    [{ id: 'v1', value: 'a' }, { id: 'v2', value: 'b' }],
    async (url) => (url === 'a' ? { ok: true as const } : { ok: false as const, reason: 'wrong_channel' as const }),
  );
  assert.deepEqual(failures, { v2: 'wrong_channel' });
});

test('every check result has its text in all five languages', () => {
  for (const lang of ['tr', 'en', 'sq', 'ar', 'mk'] as const) {
    for (const key of Object.values(VIDEO_CHECK_MESSAGE_KEY)) {
      assert.ok((translations[lang][key] ?? '').trim().length > 10, `${lang}.${key}`);
    }
    assert.ok((translations[lang].youtubeVideoChecking ?? '').trim(), `${lang}.youtubeVideoChecking`);
    assert.equal(translations[lang].youtubeVideoSupervisorNote?.includes('@'), true);
    assert.equal(translations[lang].youtubeVideoSupervisorNote?.includes('panova@panovagroup.org'), false);
  }
  assert.equal(translations.tr.youtubeVideoWrongChannel, 'Bu video Panova Group Official kanalında değil. Videoyu önce Panova kanalına yükletin.');
  assert.equal(translations.tr.youtubeVideoUnavailable, "Video doğrulanamadı. Video özel/silinmiş olabilir veya YouTube'a ulaşılamadı; biraz sonra tekrar deneyin.");
});

test('route and page wiring: no logging, the save waits for the check', () => {
  const route = read('app/api/youtube-check/route.ts');
  assert.match(route, /handleYouTubeCheck\(request, \{/);
  assert.match(route, /allowedHandle: allowedChannelHandle\(\)/);
  assert.match(route, /sb\.rpc\('current_staff'\)/);
  assert.equal(/console\./.test(route), false, 'the route logs nothing');
  assert.equal(/console\./.test(read('lib/youtubeChannel.ts')), false);
  assert.equal(read('lib/youtube.ts').includes('panova@panovagroup.org'), false);

  const page = read('app/portal/candidates/[id]/page.tsx');
  const save = page.slice(page.indexOf('const handleSaveDetail'), page.indexOf('candidateService.updateCandidateDetail'));
  assert.ok(save.indexOf('checkVideoSlots(') < save.indexOf('candidateVideoWrite('), 'check before building the payload');
  assert.match(save, /if \(Object\.keys\(failures\)\.length > 0\) \{\s+setVideoErrors\(failures\);\s+return;/);
  assert.match(page, /disabled=\{saving \|\| checkingVideos\}/);
  assert.match(page, /checkingVideos \? \(t\.youtubeVideoChecking/);

  const editor = read('components/portal/CandidateYouTubeEditor.tsx');
  assert.match(editor, /const message = invalid \? labels\.invalid : errors\[slot\.id\] \|\| '';/);
  // read-only view and playback are unchanged
  assert.match(editor, /if \(!canEdit\) \{\s+return \(\s+<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">\s+<CandidateYouTube videos=\{preview\} labels=\{labels\} \/>/);
});
