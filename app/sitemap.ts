import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/siteUrl';

/** Public pages only — portals and auth routes are omitted on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: siteUrl('/tarim'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: siteUrl('/kvkk'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: siteUrl('/guides'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
