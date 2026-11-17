import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/siteUrl';

/**
 * Public crawlers may index the marketing and legal pages.
 * Auth and staff surfaces stay out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/kvkk', '/guides'],
      disallow: [
        '/api/',
        '/portal',
        '/portal/',
        '/admin',
        '/admin/',
        '/supplier',
        '/supplier/',
        '/candidate',
        '/candidate/',
        '/employer',
        '/employer/',
        '/employer-login',
        '/employer-login/',
        '/auth/',
        '/guides/print',
      ],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
