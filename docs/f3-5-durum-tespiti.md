# F3-5: işveren İşlem Durumu, Seyahat, Aktif Çalışanlar

## Durum (2026-11-17)

Canlıda **hazır**. Üç sekme `public.employer_placements()` RPC’sinden okur; sahte metin yok.

| Sekme | UI | Veri |
| --- | --- | --- |
| İşlem Durumu | `EmployerPlacementTabs` `status` | Seçilmiş adaylar + 8 adımlı süreç çubuğu |
| Seyahat | `travel` | `travelPlacements`: `travel_ready` / `started` / uçuş alanı dolu |
| Aktif Çalışanlar | `employees` | `startedEmployees` (`pipeline_stage = started`) + 30/60/90 |

Adaylar / Seçilenler: `employer_browse_candidates` + `employer_decide_match` (RPC only; `job_candidates` fallback kaldırıldı).

## Dosyalar

- UI: `app/employer/page.tsx`, `app/employer/components/EmployerPlacementTabs.tsx`
- Tipler: `lib/employerPlacements.ts`
- SQL: `supabase/migrations/20261115120000_employer_placements.sql` (+ `20261114140000`, `20261112120000`)
- Doğrulama: `supabase/verification/employer_placements.sql`, `employer_placements_scenario.sql`

## İşverene dönmeyen alanlar

Pasaport, telefon, e-posta, PNR, dahili not, belge JSON, `employee_feedback` — RPC seçmez.
