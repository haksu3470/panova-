import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import {
  YouTubeUrlError,
  canManageCandidateVideo,
  candidateVideoWrite,
  candidateYouTubeEntries,
  isMissingVideoPermissionRpc,
  normalizeYouTubeField,
  parseYouTubeVideoId,
  youtubeEmbedUrl,
  youtubeSaveFailure,
  youtubeWatchUrl,
} from './youtube.ts';

const WATCH = 'https://www.youtube.com/watch?v=gKy4n9-gEA4';

test('watch, youtu.be, shorts, and embed links resolve to one video id', () => {
  assert.equal(parseYouTubeVideoId('https://www.youtube.com/watch?v=gKy4n9-gEA4'), 'gKy4n9-gEA4');
  assert.equal(parseYouTubeVideoId('https://youtube.com/watch?v=gKy4n9-gEA4&t=43s'), 'gKy4n9-gEA4');
  assert.equal(parseYouTubeVideoId('https://m.youtube.com/watch?list=PL123&v=gKy4n9-gEA4'), 'gKy4n9-gEA4');
  assert.equal(parseYouTubeVideoId('https://youtu.be/E4qr4CiDFIw'), 'E4qr4CiDFIw');
  assert.equal(parseYouTubeVideoId('https://www.youtu.be/E4qr4CiDFIw?si=abc'), 'E4qr4CiDFIw');
  assert.equal(parseYouTubeVideoId('https://www.youtube.com/shorts/abcdefghijk'), 'abcdefghijk');
  assert.equal(parseYouTubeVideoId('https://www.youtube.com/shorts/abcdefghijk?feature=share'), 'abcdefghijk');
  assert.equal(parseYouTubeVideoId('https://www.youtube.com/embed/abcdefghijk?start=10'), 'abcdefghijk');
  assert.equal(parseYouTubeVideoId(' http://www.youtube.com/embed/abcdefghijk '), 'abcdefghijk');
});

test('channel pages, short ids, and non-YouTube addresses are rejected', () => {
  for (const sample of [
    '',
    '   ',
    'https://www.youtube.com/channel/UCxxxxxxxx',
    'https://www.youtube.com/@panova',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch',
    'https://youtu.be/E4qr4CiDFIw/extra',
    'https://www.youtube.com/shorts/abcdefghijk/extra',
    'https://www.youtube.com/playlist?list=PL123',
    'https://example.com/watch?v=gKy4n9-gEA4',
    'javascript:alert(1)',
    'https://user:pass@www.youtube.com/watch?v=gKy4n9-gEA4',
    'https://www.youtube.com:443/watch?v=gKy4n9-gEA4',
    'not a url',
  ]) {
    assert.equal(parseYouTubeVideoId(sample), null, sample);
  }
});

test('a blank field clears the video and a valid link is stored as a watch URL', () => {
  assert.equal(normalizeYouTubeField('  '), null);
  assert.equal(normalizeYouTubeField('https://youtu.be/E4qr4CiDFIw'), youtubeWatchUrl('E4qr4CiDFIw'));
  assert.equal(youtubeEmbedUrl('E4qr4CiDFIw'), 'https://www.youtube.com/embed/E4qr4CiDFIw');
  assert.throws(() => normalizeYouTubeField('https://vimeo.com/123'), YouTubeUrlError);

  const saved = candidateVideoWrite({
    videoUrl1: 'https://youtu.be/E4qr4CiDFIw',
    videoUrl2: '',
    videoUrl3: 'https://www.youtube.com/shorts/abcdefghijk',
  });
  assert.deepEqual(saved, {
    video_url: youtubeWatchUrl('E4qr4CiDFIw'),
    video_url_1: youtubeWatchUrl('E4qr4CiDFIw'),
    video_url_2: null,
    video_url_3: youtubeWatchUrl('abcdefghijk'),
  });
  assert.throws(
    () => candidateVideoWrite({ videoUrl1: WATCH, videoUrl2: 'https://example.com', videoUrl3: '' }),
    YouTubeUrlError,
  );
});

test('profiles embed a valid URL, link an unrecognized http address, and hide the same film twice', () => {
  assert.deepEqual(candidateYouTubeEntries(null), []);
  assert.deepEqual(candidateYouTubeEntries({ video_url: '   ', video_url_1: null }), []);

  const entries = candidateYouTubeEntries({
    video_url: 'https://youtu.be/E4qr4CiDFIw',
    video_url_1: WATCH,
    video_url_2: 'https://example.com/intro',
    video_url_3: WATCH,
  });
  assert.deepEqual(entries, [
    { kind: 'embed', id: 'gKy4n9-gEA4', watchUrl: WATCH },
    { kind: 'embed', id: 'E4qr4CiDFIw', watchUrl: youtubeWatchUrl('E4qr4CiDFIw') },
    { kind: 'link', href: 'https://example.com/intro' },
  ]);

  assert.deepEqual(candidateYouTubeEntries({ video_url: 'javascript:alert(1)' }), []);
  assert.deepEqual(
    candidateYouTubeEntries({ video_url: 'https://youtu.be/E4qr4CiDFIw', video_url_1: null }),
    [{ kind: 'embed', id: 'E4qr4CiDFIw', watchUrl: youtubeWatchUrl('E4qr4CiDFIw') }],
  );
});

test('only region and country supervisors and upper management may edit the video', () => {
  assert.equal(canManageCandidateVideo('upper_management'), true);
  assert.equal(canManageCandidateVideo(' source_country '), true);
  assert.equal(canManageCandidateVideo('target_country'), true);
  assert.equal(canManageCandidateVideo('field_officer'), false);
  assert.equal(canManageCandidateVideo('finance'), false);
  assert.equal(canManageCandidateVideo('limited'), false);
  assert.equal(canManageCandidateVideo(null), false);
  assert.equal(isMissingVideoPermissionRpc({ code: 'PGRST202', message: 'could not find can_manage_candidate_video' }), true);
  assert.equal(isMissingVideoPermissionRpc({ code: '42501', message: 'permission denied' }), false);
  assert.equal(youtubeSaveFailure('youtube_video_forbidden'), 'forbidden');
  assert.equal(youtubeSaveFailure('new row violates check constraint job_candidates_video_url_youtube'), 'invalid');
  assert.equal(youtubeSaveFailure('network down'), null);
});

test('new YouTube copy exists in TR, EN, SQ, AR, and MK', () => {
  const locales: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
  const keys = [
    'youtubeVideoTitle',
    'youtubeVideoEmpty',
    'youtubeVideoWatch',
    'youtubeVideoOpen',
    'youtubeVideoClear',
    'youtubeVideoInvalid',
    'youtubeVideoSupervisorNote',
    'youtubeVideoReadOnly',
    'youtubeVideoLabel',
  ] as const;
  const arabic = /[\u0600-\u06FF]/;
  const cyrillic = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;
  const turkishLetters = /[ğışöüĞİŞÖÜ]/;

  for (const lang of locales) {
    for (const key of keys) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.ok(value && value.trim().length > 0, `${lang}.${key}`);
      if (lang !== 'tr') assert.equal(turkishLetters.test(value), false, `${lang}.${key}`);
    }
    assert.match(String(translations[lang].youtubeVideoInvalid), /youtube\.com\/watch/);
    assert.match(String(translations[lang].youtubeVideoInvalid), /youtu\.be/);
    assert.match(String(translations[lang].youtubeVideoInvalid), /shorts/);
    assert.match(String(translations[lang].youtubeVideoInvalid), /embed/);
    assert.match(String(translations[lang].youtubeVideoSupervisorNote), /panova@panovagroup\.org/);
  }

  assert.match(String(translations.ar.youtubeVideoEmpty), arabic);
  assert.match(String(translations.mk.youtubeVideoEmpty), cyrillic);
  assert.notEqual(translations.en.youtubeVideoClear, translations.tr.youtubeVideoClear);
  assert.notEqual(translations.sq.youtubeVideoClear, translations.tr.youtubeVideoClear);
  assert.notEqual(translations.mk.youtubeVideoWatch, translations.en.youtubeVideoWatch);
});
