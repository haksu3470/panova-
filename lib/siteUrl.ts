/** Canonical public site. Used by robots, sitemap and absolute links. */
export const SITE_ORIGIN = 'https://panovagroup.org';

export function siteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_ORIGIN}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
