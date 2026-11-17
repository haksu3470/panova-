# DMARC / e-posta DNS (panovagroup.org)

## Durum (2026-11-17)

| Kayıt | Değer | Not |
| --- | --- | --- |
| SPF (`@` TXT) | `v=spf1 include:amazonses.com ~all` | Resend → Amazon SES |
| SPF (`send` TXT) | aynı | Return-path |
| DKIM | `resend._domainkey` TXT | Resend verified |
| MX | `receive-euw1.forge.rmta.net` prio 10 | Receiving açık |
| **DMARC** (`_dmarc` TXT) | `p=quarantine; pct=100` | **Sıkılaştırıldı** (önce `p=none`) |

Resend domain: **verified**, sending + receiving enabled (eu-west-1).

## Uygulanan DMARC

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:panova@panovagroup.org; fo=1; adkim=r; aspf=r
```

Uyumsuz posta spam’e yönlendirilir; raporlar `panova@panovagroup.org`.

## Sonraki (isteğe bağlı, ~1–2 hafta rapor sonrası)

`p=reject` — sahte gönderimleri tamamen reddeder. Raporlarda meşru mail kaybı yoksa geçin:

```
v=DMARC1; p=reject; pct=100; rua=mailto:panova@panovagroup.org; fo=1; adkim=r; aspf=r
```

Vercel DNS → `_dmarc` TXT. NS: `ns1/ns2.vercel-dns.com`.

## Kontrol

```powershell
Resolve-DnsName _dmarc.panovagroup.org -Type TXT
```
