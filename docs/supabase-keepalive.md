# Supabase Free keep-alive (Vercel Cron)

Free projects can pause after ~7 days of low DB activity. This repo pings Postgres once a day from production.

| Piece | Detail |
| --- | --- |
| Schedule | `17 4 * * *` UTC (~07:17 TR) in `vercel.json` |
| Path | `GET /api/cron/supabase-keepalive` |
| Auth | `Authorization: Bearer $CRON_SECRET` (Vercel sends this) |
| Query | `app_settings` select limit 1 |

## Setup

1. Vercel → Project `panova` → Settings → Environment Variables  
2. Add `CRON_SECRET` (random ≥16 chars) for **Production**  
3. Redeploy so cron + env take effect  
4. Optional test:
   ```bash
   curl -i -H "Authorization: Bearer $CRON_SECRET" \
     https://panovagroup.org/api/cron/supabase-keepalive
   ```

Hobby/Free Vercel: at most **one cron run per day** (enough for this job).

**Not a guarantee.** Official no-pause: Supabase Pro. If you get a pause warning email, open the project or upgrade.
