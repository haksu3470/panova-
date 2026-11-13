# Kılavuz çeviri listesi (en, sq, ar, mk)

Kaynak: `lib/guides-copy.ts`. Türkçe metin `tr` bloğundadır. Çeviri bitince ilgili satırı bu dosyadan silin.

## 1. Yeni anahtarlar: şimdilik Türkçe gösteriliyor

Bu yollar `GUIDES_PENDING_TRANSLATION` listesindedir. `withPendingTr()` diğer dillere Türkçe metni koyar; testler bu yollarda Türkçe harfe ve yazı sistemine bakmaz.

Çevirmek için: yolu ilgili dilin bloğuna (`en`, `sq`, `ar`, `mk`) çevrilmiş metinle ekleyin. Dört dilin hepsi bitince yolu `GUIDES_PENDING_TRANSLATION` listesinden ve buradan silin.

- [ ] `exampleLabel`
- [ ] `roleLabels.finance`
- [ ] `roleLabels.limited`
- [ ] `roles.finance`
- [ ] `roles.limited`
- [ ] `roles.employer.screens.newRequest`
- [ ] `guides.staff-login.example`
- [ ] `guides.staff-invite.example`
- [ ] `guides.dossier-review.example`
- [ ] `guides.matching-offers.example`
- [ ] `guides.employer-request.example`
- [ ] `guides.employer-browse.example`
- [ ] `guides.candidate-register.example`
- [ ] `guides.request-to-offer`
- [ ] `guides.document-request`

## 2. Türkçesi değişen metinler: diğer dillerde eski hali duruyor

Bu anahtarlar dört dilde zaten var, ama eski içeriği anlatıyor. Yeni Türkçe metne göre yeniden çevrilmeli. Test bunları yakalamaz.

- **(üst düzey)**: `mapNote`, `howToLead`
- **roles.upper_management**: `summary`, `screens.overview.does`, `screens.candidates.does`, `screens.requests.does`, `screens.employers.does`
- **roles.source_country**: `summary`, `screens.candidates.does`, `screens.dossier.does`, `screens.requests.does`
- **roles.target_country**: `summary`, `screens.request.does`, `screens.employer.does`
- **roles.field_officer**: `summary`, `screens.dossier.does`, `screens.overview.does`
- **roles.employer**: `summary`, `screens.home.does`, `screens.candidates.does`, `screens.interviews.name`, `screens.interviews.does`, `screens.selected.name`, `screens.selected.does`, `screens.process.name`, `screens.process.does`, `screens.travel.name`, `screens.employees.name`, `screens.employees.does`, `screens.support.name`, `screens.company.name`
- **roles.candidate**: `summary`, `screens.profile.does`, `screens.documents.does`, `screens.offers.does`
- **guides.staff-login**: `steps[3].body`, `flow[3]`, `mock.rows[2].value`
- **guides.dossier-review**: `summary`, `steps[1].title`, `steps[1].body`, `steps[2].title`, `steps[2].body`, `steps[3].body`, `flow[1]`, `flow[2]`, `flow[3]`, `mock.caption`, `mock.chrome`, `mock.rows[0].label`, `mock.rows[0].value`, `mock.rows[1].label`, `mock.rows[1].value`, `mock.rows[2].label`, `mock.rows[2].value`
- **guides.matching-offers**: `title`, `summary`, `steps[1].title`, `steps[1].body`, `steps[2].title`, `steps[2].body`, `steps[3].title`, `steps[3].body`, `flow[1]`, `flow[2]`, `flow[3]`, `mock.rows[0].label`, `mock.rows[0].value`, `mock.rows[1].label`, `mock.rows[1].value`, `mock.rows[2].label`, `mock.rows[2].value`
- **guides.employer-request**: `summary`, `where`, `steps[1].title`, `steps[1].body`, `steps[2].body`, `steps[3].title`, `steps[3].body`, `steps[4].body`, `flow[0]`, `flow[1]`, `flow[2]`, `mock.chrome`, `mock.rows[0].value`, `mock.rows[1].label`, `mock.rows[1].value`
- **guides.employer-browse**: `summary`, `steps[0].body`, `steps[2].body`, `steps[3].body`, `flow[1]`, `flow[2]`, `flow[3]`, `mock.rows[2].value`
- **guides.candidate-register**: `steps[1].body`, `steps[3].body`, `steps[4].title`, `steps[4].body`, `flow[3]`, `mock.caption`, `mock.rows[0].label`, `mock.rows[0].value`, `mock.rows[1].value`, `mock.rows[2].value`

## 3. Kaldırılan anahtar

- `roles.employer.screens.demands`: işveren portalında "Talepler" sekmesi yok. Dört dilden de silindi; yerini `roles.employer.screens.newRequest` (Yeni talep) aldı ve yukarıdaki listede.

## 4. Yazdırma sayfası (`print.*`)

`/guides/print` için eklenen `print` grubundaki 13 anahtar (`print.printButton`, `print.allRoles`, `print.ownGuide`, `print.back`, `print.coverSubtitle`, `print.languageLabel`, `print.createdLabel`, `print.sessionRoleLabel`, `print.scopeLabel`, `print.roleFilterLabel`, `print.contentsTitle`, `print.hint`, `print.pageLabel`) beş dilde yazıldı; geçici Türkçe yok, `GUIDES_PENDING_TRANSLATION` listesine girmedi.

- [ ] en, sq, ar, mk metinlerini ana dili konuşan biri gözden geçirsin.
- Not: `print.coverSubtitle` şirket adını (Panova Group) Latin harfle tutar.

## Rol görünürlüğü (`mapNote`, `unknownRoleNote`)

`mapNote` (Türkçesi değişti) ve yeni `unknownRoleNote` beş dilde yazıldı; geçici Türkçe yok, `GUIDES_PENDING_TRANSLATION` listesine girmedi.

- [ ] en, sq, ar, mk metinlerini ana dili konuşan biri gözden geçirsin.
