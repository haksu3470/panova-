# İşveren talep formu: zorunlu alanlar (güncel)

## Durum (2026-11-17)

Form **alan bazlı** doğrulanıyor; DB check + işveren RLS canlıda.

| Katman | Ne var |
| --- | --- |
| UI | `validateDemandForm` → alan hataları, `aria-invalid`, odak (`app/employer/page.tsx`) |
| Satır kurucu | `buildEmployerDemandInsert` — bad headcount **coerce etmez**; boş sektör/şehir/süre/dil reddedilir |
| DB check | headcount 1–500, maaş >0 ≤100k, pozisyon/sektör/şehir/süre/dil boş olamaz |
| RLS | `emp_requests_select/insert/update`: `employer_id = my_employer_id() and email_access_ok()` |

## Dosyalar

- `lib/workforceRequest.ts` — `validateDemandForm`, `buildEmployerDemandInsert`, `JOB_REQUEST_RULES`
- `supabase/migrations/20261113180000_job_requests_guards.sql` — ilk check seti
- `supabase/migrations/20261117200000_employer_job_requests_rls_and_checks.sql` — dil + şehir/süre sıkılaştırma + RLS kayıt
- `supabase/verification/employer_job_requests_guards.sql`

## Not

Eski rapor (tek genel `fillRequiredFields`, RLS yok) güncelliğini yitirdi; bu dosya onun yerine geçer.
