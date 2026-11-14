# Kılavuz çeviri listesi (en, sq, ar, mk)

**Durum: çeviri tamamlandı, ana dili konuşan kişi incelemesi bekliyor.**

Kaynak: `lib/guides-copy.ts`. Türkçe metin `tr` bloğundadır; `en`, `sq`, `ar`, `mk` blokları onun çevirisidir. Geçici Türkçe gösterim (`withPendingTr`, `GUIDES_PENDING_TRANSLATION`) kaldırıldı. Kılavuzlar ekranı (`/guides`) ve yazdırma sayfası (`/guides/print`) aynı metni kullanır.

## Çeviri kuralları (uygulananlar)

- Adım, akış ve şema satırı sayıları her dilde Türkçe ile aynıdır (`lib/guides.test.ts` denetler). Adım rolleri (`GUIDE_STEP_ACTORS`, `lib/guides-model.ts`) adım sırasına bağlıdır; bir dilde adım eklemeyin, silmeyin, sırasını değiştirmeyin.
- Ekrandaki sekme ve düğme adları o dilin portal metninden alındı, tahmin edilmedi:
  - Personel sekmeleri: `lib/dictionary.ts` → `overviewTab`, `candidatesTab`, `requestsTab`, `staffTab`, `tasksTab`, `auditTab`, `employersTab`, `supportTab`.
  - İşveren sekmeleri: `overview`, `empTabNewRequest`, `candidatesTab`, `empTabInterviews`, `empTabSelected`, `process`, `travel`, `employeesTab`, `support`, `empTabProfile`.
  - Aday sekmeleri: `overview`, `profile`, `documents`, `offers`, `support`.
  - Düğmeler ve durumlar: `candStatusManualBtn`, `previewBtn`, `docDownload`, `docOpenNewTab`, `empRequestDelete`, `empRequestHasActivity`, `interviewReqBtn`, `selectBtn`, `rejectBtn`, `decisionSelectedOpt`, `decisionRejectedOpt`, `statusPending`, `reviewing`, `approved`, `stage*`, `demoDataTitle` (`lib/dictionary.ts`); `docRequest`, `present`, `matchCandidates`, `send`, `deleteRecord`, `docStatuses`, `offerStatus`, `documents_collecting` (`lib/portal-ui-copy.ts`).
  - Roller: `roleUpperManagement`, `roleSourceCountry`, `roleTargetCountry`, `roleFieldOfficer` (`lib/dictionary.ts`); Finans ve Sınırlı erişim `lib/email/email-copy.ts`.
  - Sektörler ve meslekler: `lib/professions.ts` (Kalıpçı → `formwork` takma adı, Aşçı → `cook`).
- Çevrilmeyenler: yollar (`/portal`, `/candidate` …), para birimi ve tutarlar (EUR, USD, €, $), `{roles}` yer tutucusu, `http/https`, `30/60/90`, ürün adları (Google, YouTube, Meet, Zoom, Teams, Panova).
- Demo kayıt adları (`DEMO Balkan Yapı DOO`, `DEMO Adriyatik Otel`, `Demo Aday Bir / İki / Dört`) veritabanındaki yazımla aynı kaldı; ekranda da böyle görünürler. Testlerde bilinen istisnadır.
- Sayı biçimi: İngilizcede binlik ayırıcı virgüldür (1,300; 100,000); sq, ar, mk Türkçe gibi nokta kullanır (1.300; 100.000).
- Arapça: sıralı adımları gösteren oklar metin içinde `←` olarak yazıldı (sağdan sola okunur). "Nerede" satırı (`where`) yol gibi soldan sağa gösterilir (`dir="ltr"`, ekranda ve yazdırmada).

## Ana dili konuşan kişi incelemesi

Her dil için aşağıdaki yerleri bir kez okuyun. Düzeltme yaparken adım sayısını ve sırasını koruyun; ekrandaki sekme ve düğme adını değiştirmek gerekirse önce `lib/dictionary.ts` (veya `lib/portal-ui-copy.ts`) içinde değiştirin, kılavuzu ona uydurun.

- [ ] **en** (`const en` bloğu)
- [ ] **sq** (`const sq` bloğu)
- [ ] **ar** (`const ar` bloğu), ayrıca `/guides` ve `/guides/print` sayfalarında sağdan sola görünüm
- [ ] **mk** (`const mk` bloğu)

Her blokta yeni yazılan veya yeniden çevrilen anahtarlar:

- **Üst düzey:** `mapNote`, `howToLead`, `exampleLabel`, `stepDoneBy` (`{roles}` kalmalı), `stepOthersNote`
- **roleLabels:** tümü (rol adları sözlükteki karşılıklarla değişti), yeni `finance`, `limited`
- **roles:** tüm `title`, `summary`, `screens.*.name`, `screens.*.does`; yeni `finance`, `limited`, `employer.screens.newRequest`
- **guides:** dokuz rehberin tamamı (`staff-login`, `staff-invite`, `dossier-review`, `matching-offers`, `request-to-offer`, `document-request`, `employer-request`, `employer-browse`, `candidate-register`): `title`, `summary`, `where`, `steps`, `flow`, `mock`, `example`

Değişmeyenler (önceki çeviri duruyor): `navLabel`, `hubTitle`, `hubLead`, `mapTitle`, `mapLead`, `unknownRoleNote`, `howToTitle`, `sessionLabel`, `screensLabel`, `upperOnly`, `stepsLabel`, `whereLabel`, `flowLabel`, `print.*` (13 anahtar), `loading`, `signedOut*`, `signIn*`, `back*`, `unlinked*`, `verify*`.

### Özellikle bakılacaklar

- Türkçe kılavuz bazı sekmeleri kısa adla anar ("Adaylar", "Talepler", "Personel"); portalda Türkçe sekme adları "Aday Havuzu", "Personel Talepleri", "Ekip & Yetkiler". Çeviriler portaldaki adları kullanır. Türkçe metin bu çalışmada değiştirilmedi; uyumlu hale getirilmesi ayrı bir iş.
- Meslek adı: Türkçe "Kalıpçı" için `formwork` karşılığı kullanıldı (en Formwork carpenter, sq Usta kallëpi, ar نجار قوالب, mk Опажувач).
- Aday tarafındaki teklif kabul / ret düğmeleri ve işveren "aday seç / reddet" metinleri genel fiille yazıldı ("accept or reject"); düğmenin kendi adı sözlükte farklıysa uydurun.
- Arapça ve Makedonca metinlerde Latin harfli demo adları ve kodlar arasında yön ve noktalama.

## Kaldırılan anahtar

- `roles.employer.screens.demands`: işveren portalında "Talepler" sekmesi yok; yerini `roles.employer.screens.newRequest` (Yeni talep) aldı.

## Düzeltme: "Belge Takip Mekanizması" (2026-11-14)

Personel aday dosyasındaki belge bölümünün portaldaki adı `documentTrackingMechanism` (lib/dictionary.ts). en/sq/ar/mk kılavuzları bu bölümü "Documents / Dokumentet / المستندات / Документи" diye anıyordu; `dossier-review` akışında ve `document-request` rehberinin `where` ve ilk adımında sözlükteki adla değiştirildi:

- en: Document Tracking Mechanism
- sq: Mekanizmi i Gjurmimit të Dokumenteve
- ar: آلية تتبع المستندات
- mk: Механизам за следење на документи

Adayın kendi portalındaki "Belgelerim" sekmesi (Documents, Dokumentet, المستندات, Документи) ayrı bir ekran; o adlar değişmedi.

`/guides/print` sayfasının belge başlığı (sekme, yazdırma penceresi, PDF adı) artık seçili dilde `print.coverSubtitle`.
