# Meslek / pozisyon katalogu (güncel)

## Durum (2026-11-17)

Tek kaynak: `lib/professions.ts` (`PROFESSIONS` + sektörler).  
İşveren talep formu ve aday formu **aynı anahtarları** kullanır. DB’ye etiket değil anahtar yazılır (serbest “Diğer” metni hariç).

| Yol | Davranış |
| --- | --- |
| Aday / personel meslek | `ProfessionField` → key |
| İşveren talep pozisyonu | sektör filtresi + key; kayıtta `normalizePositionTitle` |
| Personel talep düzenleme | kayıtta `normalizePositionTitle` |
| Teklif varsayılanı | key (lokalize etiket değil) |
| Gösterim | `localizeCatalogTitle` / `candidateProfessionLabel` (5 dil) |
| Eski etiketler | `LEGACY_POSITIONS` + `EXTRA_ALIASES` (`Kalıpçı`, `Depo Görevlisi`) |

## Migration

- `20261115130000_profession_catalog_keys.sql` — ilk backfill
- `20261117210000_profession_catalog_keys_tr_demo.sql` — TR demo Aşçı / Kalıpçı / Depo Görevlisi → key

## Not

Eski “19 pozisyon `portal-ui-copy`” modeli kaldırıldı; bu dosya güncel mimariyi anlatır.
