import { NextResponse, type NextRequest } from 'next/server';
import { GEO_LANG_COOKIE, isLanguage, suggestLanguage } from '@/lib/geoLanguage';

/**
 * Seed a geo language cookie once per browser from Vercel/Cloudflare country
 * (or Accept-Language when the country header is missing). The client then
 * picks that language when the user has no stored preference.
 */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(GEO_LANG_COOKIE)?.value;
  if (isLanguage(existing)) return NextResponse.next();

  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry');
  const lang = suggestLanguage({
    country,
    acceptLanguage: request.headers.get('accept-language'),
  });

  const response = NextResponse.next();
  response.cookies.set(GEO_LANG_COOKIE, lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and static assets; run on pages and API that
     * need the geo cookie available to the browser on first paint.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
