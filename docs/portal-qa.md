# Portal QA senaryoları / Portal QA scenarios

Bu dosya canlı Panova HR portalı için elle koşulan senaryolardır. Ürünün içindeki kılavuz (`/guides`) rol bazlı “nasıl yapılır” metnidir; buradaki liste ise önkoşul, adım, beklenen sonuç ve bilinen engeli ayırır.

This is the hand-run script for the live Panova HR portal. The in-app guides at `/guides` are the role-filtered how-tos. This file separates preconditions, steps, expected results, and known blockers.

Otomatik kontroller (kimlik bilgisi gerekmez) / Automated checks (no credentials):

```bash
npm test
```

`npm test` runs `node --experimental-strip-types --test` on `lib/*.test.ts` and `lib/email/*.test.ts`. YouTube URL rules, guide role filtering, lodging/meals, employer filters, referral-code filtering, and the sign-in entry points below are covered there. Browser end-to-end tests are not in this repo.

Diller / Languages: TR, EN, SQ, AR, MK. The switcher is on the public home page and on each portal. Arabic sets `dir="rtl"`.

## Roller ve adresler / Roles and routes

| Role | Sign-in | Signed-in home |
| --- | --- | --- |
| Staff (`upper_management`, `source_country`, `target_country`, `field_officer`) | `/portal` | `/portal` |
| Employer | `/employer-login` | `/employer` |
| Candidate | `/candidate` | `/candidate` |
| Any linked, confirmed session | — | `/guides` |

Staff dossier: `/portal/candidates/[id]`. Demand file: `/portal/requests/[id]`. Employer file: `/portal/employers/[id]`. Password reset: `/auth/reset-password/candidate`, `/auth/reset-password/employer`, `/auth/reset-password/portal`.

`/admin` and `/supplier` exist and are staff-gated. Nothing in the portal navigation links to them. See the gap analysis before treating them as product flows.

In-app how-to ids (`GUIDE_CATALOG` in `lib/guides-model.ts`): `staff-login`, `staff-invite`, `dossier-review`, `matching-offers`, `request-to-offer`, `document-request`, `employer-request`, `employer-browse`, `candidate-register`. Every how-to has an example box (heading `exampleLabel`) built on the demo records (S24). `request-to-offer` and `document-request` are staff only. Until they are translated, en / sq / ar / mk show the Turkish text of the keys listed in `docs/guides-translation-todo.md`.

---

## S01. Personel daveti / Staff invite

**Rol / Role:** Upper management, then the invited person.

**Önkoşul / Preconditions:** An upper-management account is already linked (`profiles.role = staff`, `staff_role = upper_management`). The invitee’s email is not already tied to an active `staff_members.auth_user_id`. `RESEND_API_KEY` is set if you need the email itself; the row can still be created without it.

**Adımlar / Steps:**

1. Sign in at `/portal`. Open **Staff**. The tab is rendered only when `isUpperManagement` is true (`app/portal/page.tsx`).
2. Enter full name, the email the person will use, and one role: upper management, source country, target country, or field officer. There is no password field on this form.
3. Submit. The page calls `POST /api/staff-invite` with the session bearer token. The database function `invite_staff` checks upper management, email shape, and role.
4. With the invited address, open `/portal`, choose staff registration (or Google with that same address), confirm the mailbox if asked, and sign in.

**Beklenen / Expected:** The staff card shows pending until the account links, then active. `link_my_staff` binds the row only when the auth email matches and the mailbox is confirmed. Overview opens and the green badge shows the invited role. A different email does not attach the invite.

**Bilinen engel / Known blocker:** Invite copy and API errors are Turkish only (`app/api/staff-invite/route.ts`). If `RESEND_API_KEY` is missing, the row is saved and the UI shows the warning that the email was not sent. The audit line is the fixed Turkish string `Personel Davet Edildi:`. `invite_staff` also accepts `finance` and `limited`, but the Staff form does not offer those roles.

In-app guide: `staff-invite`.

## S02. Personel girişi / Staff sign-in

**Rol / Role:** Invited staff. Repeat once with an address that has no invite.

**Önkoşul / Preconditions:** S01, or the single bootstrap case: `claim_first_staff` runs only when no `profiles.role = staff` row exists yet.

**Adımlar / Steps:**

1. Open `/portal`. The card title reads **Personel Girişi** with the subtitle **Panova ekibi için yönetim paneli** (en Staff Login, sq Hyrje për stafin, ar دخول الموظفين, mk Најава за персонал; check each language from the switcher). The sign-in field is an email (`type="email"`), labeled as username and email.
2. Sign in with password, or Google, using the invited address.
3. If the mailbox is not confirmed, the verify screen opens (`EmailVerifyNotice`). Paste the numeric code (6–10 digits) or the confirm URL, or use the link in the message. Resend waits 30 seconds.
4. After sign-in the header reads **Personel Paneli** (en Staff Panel, sq Paneli i stafit, ar لوحة الموظفين, mk Панел за персонал). `/candidate` says **Aday Girişi** and `/employer-login` says **İşveren Girişi**, matching the home sign-in menu.
5. Sign out from the portal header, then sign in again with an address that was never invited.

**Beklenen / Expected:** A confirmed, invited address reaches Overview. An unconfirmed password sign-in stays on the verify screen and does not open the tabs. An address with no invite is signed out and sees `staffNotInvited`. Google accounts that Supabase already treats as proved skip the extra mailbox check (`isGoogleProvedUser`).

**Bilinen engel / Known blocker:** Staff registration still creates an auth user before the invite check. The portal then refuses entry. The first-ever staff account can become upper management through `claim_first_staff` without an invite; do not use a shared test mailbox for that path once any staff profile exists.

In-app guide: `staff-login`.

## S03. Aday kaydı ve e-posta doğrulama / Candidate registration and email verification

**Rol / Role:** New candidate.

**Önkoşul / Preconditions:** The email, passport, and phone are not already on `job_candidates`. Password length is at least 8.

**Adımlar / Steps:**

1. From the home page (HR company selected) or `/candidate`, switch from sign-in to registration.
2. Enter name, passport, phone, email, profession, and sector. Submit.
3. On the verify screen, confirm with the email link, a 6–10 digit code, or a pasted verify URL (`parseVerificationInput` in `lib/emailConfirmation.ts`).
4. After confirmation, the app calls `link_my_candidate`. If the passport or phone collides, the fix form asks for a new value and does not open the dashboard.

**Beklenen / Expected:** A confirmed session lands on the candidate dashboard (Overview, Profile, Documents, Offers, Support, Guides). Google sign-in uses the same address. An unconfirmed password account cannot open the dashboard.

**Bilinen engel / Known blocker:** The code is `{{ .Token }}` in `supabase/templates/confirmation.html`. The hosted project does not read that file: paste it in the dashboard, and set Authentication → Sign In / Providers → Email → OTP length to 6. See `supabase/templates/README.md`. Sign-up now stores the selected nationality instead of `Belirtilmedi`.

In-app guide: `candidate-register`.

## S04. Aday profil düzenleme / Candidate profile edit

**Rol / Role:** Signed-in candidate.

**Önkoşul / Preconditions:** S03 completed. The candidate row is linked to this auth user.

**Adımlar / Steps:**

1. Open **Profile**.
2. Change name, passport, phone, email, profession, sector, photo, and emergency contact. Clear one required registration field and try to save.
3. Save a valid profile. Reload the page.
4. Open **Documents** and upload into a slot. Open **Offers** and **Support**.

**Beklenen / Expected:** Blank registration fields are rejected before the write (`candidateRegistrationPayload`). Name, passport, phone, profession, and sector are saved on the linked row first (`assertCandidatePersisted`). Email is a second write and only when it changed (`changedCandidateEmail`), so a duplicate email does not discard the other fields. An unchanged photo is not sent again (`changedCandidatePhoto`). Passport is stored uppercased and a new email lowercased. The candidate does not get inputs for YouTube URLs; videos render only when a supervisor has saved them (`CandidateYouTube`). Duplicate phone or passport rejects the registration write. A duplicate email leaves the other details saved and shows the email message. Auth email is not changed.

**Bilinen engel / Known blocker:** If `documents_json` is empty, the first profile save writes five document names in Turkish (`Pasaport Taraması`, and the other four defaults in `handleUpdateProfile`). Emergency and support placeholders are Turkish (`Örn: Md Samad Bepary`, `Örn: Belge Güncellemesi Hakkında`, `Sorununuzu detaylı yazın...`). Offer and support failures alert `Hata:` plus the raw message. Changing the auth email is not part of this save.

In-app guide: `candidate-register` (profile and documents steps).

**Telefon ve dil / Phone and language** (Chrome DevTools at 360 px and 419 px, then a real phone; repeat in TR, EN, SQ, AR, MK):

1. **Sekmeler / Tabs.** Ana Sayfa, Profilim, Belgelerim, İş Teklifleri, Destek and Kılavuz are all visible: the strip wraps to a second line instead of running off the right edge (Arabic: off the left edge). No sideways scrolling is needed.
2. **Dosya seç / Choose file.** On Belgelerim and the profile photo, the button and the empty text are in the page language (EN "Choose file / No file chosen", AR "اختر ملفًا / لم يتم اختيار أي ملف", MK "Избери датотека / Не е избрана датотека"), never the browser's Turkish "Dosya Seç / Dosya seçilmedi". Tab reaches the button (focus ring), Space or Enter opens the file dialog. After picking `a-very-long-passport-scan-file-name-2026.pdf` the name is shown and cut at the end with "…"; hovering shows the full name. Same picker for the company logo on `/employer` → Şirket Profili.
3. **Dil menüsü / Language menu.** Open the language switcher in the header in Turkish and in Arabic: the whole list is on screen in both, nothing cut at the left or right edge, at 360 px and 419 px. Same on `/`, `/employer`, `/portal` and `/guides`.
4. **Aday kodu / Candidate code.** In Macedonian at 360 px, `PNV-CAND-xxxxxx` stays on one line; the passport, profession and nationality move to the next line as whole items.
5. **link_my_candidate.** Sign in as an already linked demo candidate with the browser console open: no `POST …/rpc/link_my_candidate 400` on load, after a reload or after saving the profile (the page reads the own row and does not call the RPC). Then sign up a new demo candidate and confirm the e-mail: the first sign-in still creates and opens the candidate row (one RPC call), and a duplicate phone or passport still shows the fix form.

## S05. Personel aday dosyası / Staff dossier review

**Rol / Role:** Any staff role. Repeat the video steps as upper management or a source/target officer, then as a field officer.

**Önkoşul / Preconditions:** At least one `job_candidates` row. Staff session confirmed.

**Adımlar / Steps:**

1. On `/portal`, open **Candidates**. Search by name, profession, passport, or email. Filter by sector, status, or country.
2. Change status (pending, reviewing, visa processing, approved) or the assignee from the list.
3. Open the name. The address is `/portal/candidates/[id]`. `StaffGate` blocks a non-staff session.
4. Review profile, document status, interview/offer panel, and placement. Save.
5. As upper management or a source/target officer, paste a YouTube link and save. As a field officer, open the same file.

**Beklenen / Expected:** The file loads for every staff role. Video editing follows `can_manage_candidate_video` (upper management, source country, target country). A field officer sees the player and the read-only note, with no URL fields. Document status has an empty line when the candidate has no `candidate_documents` rows.

**Bilinen engel / Known blocker:** None for opening the file. Video save failures are covered in S09.

**Rol bazlı kontroller / Controls by role** (`candidateFileAccess` in `lib/staffAccess.ts`; one demo candidate, sign in as each role):

| Kontrol / Control | Üst Yönetim | Kaynak Ülke | Hedef Ülke | Saha | finance / limited |
| --- | --- | --- | --- | --- | --- |
| Profile contact, travel, closure, save | edit | edit | edit | edit | no file |
| Belge Takip Mekanizması: request / upload / approve | edit | edit | edit | edit | no file |
| Delete a document | edit | — | — | — | no file |
| Dahili notlar (personel) | edit | edit | edit | edit | no file |
| Candidate status "change manually" | edit | read | read | read | no file |
| Mülakat ve teklif card | edit | edit | edit | hidden | no file |
| Resmî İş Teklifi Gönder form | edit | edit | edit | hidden | no file |
| Send notification | edit | edit | edit | edit | no file |
| Responsible person in the Aday Havuzu list | select | select | select | read-only name | no tab |

6. As a field officer (Saha Sorumlusu) the file has no **Resmî İş Teklifi Gönder** card and no **Mülakat ve teklif** card; the responsible person in **Aday Havuzu** is plain text, not a dropdown.
7. Make a write fail on permission (for example a field officer whose candidate was reassigned while the file is open, then **Kaydet**): the alert says only "Bu işlem için yetkiniz yok." (EN "You do not have permission for this action.", SQ, AR, MK translated), with no "row-level security", "42501" or table name.
8. The notes card is titled **Dahili notlar (personel)** with the line that staff who can open the file see and edit it and that it is not shown in the candidate portal.
9. **Telefon listesi / Phone list.** On a phone (360–420px), in TR, AR and MK, open **Aday Havuzu**: each candidate is a card (name + DEMO, nationality, profession · sector, passport, referral code, status, official process, responsible person, **Dosyayı aç**); **Listelenenlerin tümünü seç** and each card's checkbox select rows; the long **Aday kaydet** hint is not in the top box but at the top of the opened form; the export buttons wrap. From 640px the table is back unchanged. **Audit** on a phone: the action column stays in place while the table scrolls sideways, with a fade on the far edge. **Ekip & Yetkiler**: a long name or e-mail wraps inside its card. No screen scrolls sideways.

In-app guide: `dossier-review`.

## S06. Eşleştirme, görüşme ve teklif / Matching, interviews, and offers

**Rol / Role:** Staff. Then the employer and the candidate for the later steps.

**Önkoşul / Preconditions:** A real `job_requests` row and a candidate who is not archived.

**Adımlar / Steps:**

1. On `/portal`, open **Requests**, then the demand file `/portal/requests/[id]`. Choose match candidates. There is no separate Matching tab.
2. Bind a suggested person, present the match, and set the employer result (including selected).
3. From that match, schedule an interview (date required) and create an offer (employer name and monthly net salary required).
4. As the employer who owns the demand, open **Candidates** and request an interview for a presented person.
5. As the candidate, open **Offers** and accept or reject.

**Beklenen / Expected:** `request_matches` gains the bind. Present sets `presented_at`. The interview and offer panels list the new rows. `employer_request_interview` inserts an interview only when the candidate is matched to that employer’s request; otherwise the UI reports that the person was not presented. The demand file counts matches, interviews, and offers.

**Mülakata Katıl / Join interview:** On the employer Interviews tab, an interview with no `meeting_url` shows the “link pending” text (`meetingLinkPending`) and no join button. With a link, **Mülakata Katıl** opens it in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Only upper management and target-country staff can add or change the link (`canEditMeetingUrl`; the trigger `interviews_guard_meeting_url` refuses everyone else). Only `http`/`https` links are accepted.

**Bilinen engel / Known blocker:** Employer “select” does not use this match result. See S08. Candidate accept/reject needs migration `20261109154616_phase2_offers_and_deletes.sql` on the hosted database. Until it is applied, the update matches no row and the candidate sees `offerUpdateFailed`.

In-app guide: `matching-offers`.

## S07. İşveren işgücü talebi (konaklama ve yemek) / Employer labor request (lodging and meals)

**Rol / Role:** Linked employer.

**Önkoşul / Preconditions:** Sign-in at `/employer-login` completed and `link_my_employer` returned an id. Confirmed email.

**Adımlar / Steps:**

1. Open **Requests** on `/employer`.
2. Choose a sector (agriculture, construction, or trade), one or more positions, headcount, city, salary text, duration (number + unit or open-ended, S27), an optional start date, experience, and language.
3. Leave accommodation and meals on the placeholder and submit. Then set only one of them and submit. Then set both to Yes or No, with a salary such as `1200 EUR`, and submit.
4. Open the new row on the staff **Requests** tab and on `/portal/requests/[id]`. Try to clear accommodation or meals and save.

**Beklenen / Expected:** The employer form does not insert until both answers and a positive salary are present (`buildEmployerDemandInsert`). Messages are `lodgingRequired`, `mealsRequired`, `lodgingAndMealsRequired`, or `salaryAmountRequired` in the active language. The stored columns are `accommodation_provided` and `food_provided` (booleans, not null). Staff see the same yes/no wording. The staff file also refuses a save that clears either answer.

**Bilinen engel / Known blocker:** `app/employer/components/DemandForm.tsx` is not mounted. Its “video interview required” checkbox is not on the live form and is not written by `buildEmployerDemandInsert`. An employer with zero requests now sees `empNoDemands` instead of sample rows.

In-app guide: `employer-request`.

## S08. İşveren aday tarama ve süzgeçler / Employer candidate browse and filters

**Rol / Role:** Employer who already has at least one presented match. Also try an employer with no matches.

**Önkoşul / Preconditions:** S06 present step for the happy path. `employer_browse_candidates` is deployed (migration `20261104180000_candidate_youtube_video.sql` replaces the earlier function and adds the video columns).

**Adımlar / Steps:**

1. Open **Candidates**. Confirm the list is only people matched to this employer’s requests.
2. Filter by search text (name or profession), experience band, profession, sector, country, language, and shift. Combine two filters. Use clear.
3. Request an interview for a row. Request one for a candidate who is not in the list (only possible if you can call the RPC another way, or after the fallback in the blocker).
4. Choose select on a row. Open **Selected**.

**Beklenen / Expected:** Search and filters run in the browser on the RPC rows (`filterEmployerCandidates`). The status line shows shown/total. No rows uses the empty copy; a filter that matches nothing uses the no-match copy and offers clear. Passport, phone, and email are not in the browse columns. Interview uses `employer_request_interview` and moves to **Interviews** on success. A YouTube block appears on the row when a supervisor saved a link.

**Bilinen engel / Known blocker:** Select calls `job_candidates.update({ status: 'approved', is_selected: true })` and then always alerts success. It does not read the error. The only `job_candidates` update policy added in this repo is the candidate’s own row, so this employer update can change zero rows. **Selected** then lists anyone in the browse result whose `status` is `approved` or `selected`; `is_selected` is not returned by the RPC. If the RPC is missing (`PGRST202` or a schema-cache error), the client selects `EMPLOYER_CANDIDATE_BROWSE_COLUMNS` from `job_candidates` with no employer filter. An employer with zero interviews sees two sample rows (Ahmet Yilmaz, Mehmet Demir) instead of `empNoInterviews`.

In-app guide: `employer-browse`.

## S09. Dosyada YouTube bağlantısı / YouTube links on a dossier

**Rol / Role:** Source-country, target-country, or upper management to edit. Field officer, employer, and candidate to read.

**Önkoşul / Preconditions:** A candidate file the editor can open. Use a real 11-character video id.

**Adımlar / Steps:**

1. On `/portal/candidates/[id]`, enter `https://www.youtube.com/watch?v=` plus 11 id characters. Save.
2. Replace slot 1 with a `youtu.be` link, slot 2 with a `/shorts/` link, and clear slot 3. Save again.
3. Enter `https://example.com/watch?v=` plus the same id, a channel URL, and `javascript:alert(1)`. Try to save.
4. Open the candidate **Profile**, the employer **Candidates** row, and the same dossier as a field officer.

**Beklenen / Expected:** Accepted forms are watch, `youtu.be`, shorts, and embed. The save stores a canonical `https://www.youtube.com/watch?v=` URL (`candidateVideoWrite`). The player iframe uses only `https://www.youtube.com/embed/{id}`. Blank clears the slot. Invalid text is marked on the field and save alerts `youtubeVideoInvalid`. A field officer, candidate, or employer cannot change the columns: the trigger `guard_candidate_youtube_video` raises `youtube_video_forbidden`, and the dossier shows `youtubeVideoReadOnly`. The same film in `video_url` and `video_url_1` is embedded once. An old non-YouTube `http(s)` value, if one is already stored, renders as a link, not an iframe.

**Bilinen engel / Known blocker:** The database check allows a stored shorts or `youtu.be` URL, while the editor rewrites those to a watch URL on the next supervisor save. Candidates have no way to paste a link, which matches the guide.

Automated: `lib/youtube.test.ts`.

## S10. Kılavuz merkezi / Guides hub

**Rol / Role:** Signed-out visitor, unconfirmed session, unlinked confirmed user, then staff (both upper management and another role), employer, and candidate.

**Önkoşul / Preconditions:** The accounts from S02, S03, and S07.

**Adımlar / Steps:**

1. Open `/guides` signed out.
2. Open it again with a session whose email is not confirmed (`?verify=1` is not required; `emailAccessOk` decides).
3. Sign in on each portal and use the **Guides** control (`guideNavLabel`: Kılavuzlar / Guides / Udhëzues / الأدلة / Водичи). It is on the staff tab bar, the employer tab bar, and the candidate tab bar.
4. Compare the how-to list for upper management and for a source-country officer. Compare employer and candidate.
5. **Rol görünürlüğü / Role visibility.** Sign in once with each staff role and check the usage map and the how-to list against this table (same `portalGuideView` rule as the print page):

   | Session | Role cards | How-tos |
   | --- | --- | --- |
   | upper_management | all 8 | all 9 (employer and candidate how-tos included) |
   | source_country | Kaynak ülke only | staff-login, dossier-review, matching-offers, request-to-offer, document-request |
   | target_country | Hedef ülke only | staff-login, dossier-review, matching-offers, request-to-offer, document-request |
   | field_officer | Saha görevlisi only | staff-login, dossier-review, document-request |
   | finance, limited | their own card only | staff-login |
   | unknown `role_level` | none, amber note "personel rolü tanınmadı" | staff-login |
   | employer | İşveren | employer-request, employer-browse |
   | candidate | Aday | candidate-register |

   Every how-to has a perspective (`GUIDE_CATALOG.perspective`): `employer-request` and `employer-browse` walk through the employer's own portal, `candidate-register` the candidate's own registration, so only that account and upper management see them. `/guides/print?role=target_country` prints the same five staff how-tos, no employer how-to. No staff session below upper management sees another staff role's card, the employer or candidate card, `staff-invite`, or an employer / candidate how-to. The map note says that upper management sees all roles and other staff only their own.
6. **Adım yetkileri / Step permissions.** The shared staff how-tos mark each step with who does it (`GUIDE_STEP_ACTORS`, from `lib/staffAccess.ts`, `lib/youtube.ts` and the RLS / guard functions). A step another staff role does keeps its title, is shown muted, and its text is replaced by "Bu adımı … yapar."; an employer or candidate step keeps its text with the same note. Above the steps the note "Rolünüzün yapmadığı adımlar soluk gösterilir…" appears. Check:

   | Session | How-to | Steps with only the title and "Bu adımı … yapar." |
   | --- | --- | --- |
   | source_country | Eşleştirme, mülakat ve teklif | 4 İşveren adına karar, 6 Toplantı bağlantısı (Üst yönetim, Hedef ülke sorumlusu) |
   | source_country | Talepten teklife uçtan uca | 5 Toplantı bağlantısı; steps 1 (İşveren) and 7 (Aday) keep their text |
   | target_country | Eşleştirme, mülakat ve teklif | 2 Adayı bağlayın (Üst yönetim, Kaynak ülke sorumlusu) |
   | target_country | Talepten teklife uçtan uca | 2 Personel adayı bağlar |
   | source / target / field | Aday dosyasını inceleme | 3 Durumu elle değiştirin (Üst yönetim); field also 6 YouTube |
   | source / target / field | Belge isteme ve onaylama | 6 Belgeyi silin (Üst yönetim); step 3 Aday yükler keeps its text |
   | upper_management | all | none: every step in full, each with "Bu adımı … yapar." |

   Mülakat ve teklif / Interview and offer: only upper management, source and target country plan interviews and send or change offers (`INTERVIEW_OFFER_ROLES`; database: `20261116120000_interview_offer_write_roles.sql`). A field officer opens `/portal/candidates/{id}` for an assigned candidate and sees **no** "Mülakat ve teklif" card; finance and limited cannot open the file at all. Reading is unchanged: the select policies were not touched. Database test (rolled back): `supabase/verification/interview_offer_write_roles.sql`.

   `/guides/print` follows the same rule: a staff session prints its own steps the same way, and upper management with `?role=source_country` prints the source-country version; without `?role` every step is in full.

7. **Türkçe ekran adları / Turkish screen names.** In Turkish, open a staff, an employer and a candidate portal next to `/guides`. Each tab, section and button the guide names is written exactly as on screen: staff **Genel Durum**, **Aday Havuzu**, **Personel Talepleri**, **Ekip & Yetkiler**, **İşlem Geçmişi (Audit)**, **Sorunlar / Bildirimler**, file section **Belge Takip Mekanizması**; employer **Ana Sayfa**, **Yeni Talep**, **Aday Havuzu**, **Seçtiğim Adaylar**, **İşlem Durumu**, **Seyahat Bilgilerim**, **Aktif Çalışanlar (30/60/90)**, **Şirket Profili**; candidate **Ana Sayfa**, **Profilim**, **Belgelerim**, **İş Tekliflerim**. Role names match the green badge (**Üst Yönetim**, **Kaynak Ülke Sorumlusu**, **Hedef Ülke Sorumlusu**, **Saha Sorumlusu**).

8. **Belge bölümü adı / Documents section name.** In EN, SQ, AR, MK the dossier and document-request guides name the file section like the portal: **Document Tracking Mechanism**, **Mekanizmi i Gjurmimit të Dokumenteve**, **آلية تتبع المستندات**, **Механизам за следење на документи** (not "Documents"). The candidate's own **Belgelerim** tab keeps its short name.
9. **Yazdırma başlığı / Print title.** Open `/guides/print` and switch the language: the browser tab, the print dialog and the default PDF file name follow it (TR "Panova Group Kullanım Kılavuzu", EN "Panova Group User Guide", …).

**Beklenen / Expected:** Signed out: title, body, and three links (`/portal`, `/employer-login`, `/candidate`). Unconfirmed: the verify card, no articles. Unlinked: the unlinked card, no articles. A linked user sees the usage map and the how-tos for that audience. Upper management sees `staff-invite` and every role card. Other staff see only their own card and do not see `staff-invite` (step 5). Employers see `employer-request` and `employer-browse`, not dossier or staff invite. Candidates see `candidate-register` only. Signed in, the header shows **Çıkış Yap** after the language switcher and **Ana Sayfaya Dön**; it signs out like `/portal` and the page shows the signed-out card. Back returns to `/portal`, `/employer`, `/candidate`, or `/` for a signed-out viewer. Switching language reloads `guidesCopy` for that locale. Screen paths in the map point at `app/.../page.tsx` files.

**Bilinen engel / Known blocker:** There is no how-to for logout, forgot password, or the OTP field. A staff row whose `role_level` is not a guide role is labeled with the generic staff name (`resolvePortalViewer`) and only sees the sign-in how-to. There is no staff-side how-to for registering a candidate on the candidate's behalf (the candidate registration how-to is the candidate's own screen).

Automated: `lib/guides.test.ts`.

## S11. Çıkış / Logout

**Rol / Role:** Staff, employer, and candidate, each in their own session.

**Önkoşul / Preconditions:** A confirmed session on that portal.

**Adımlar / Steps:**

1. On `/portal`, use the logout button in the header (`logoutBtn`).
2. On `/employer`, use the logout button in the header (`logout`).
3. On `/candidate`, use the logout button in the header (`logout`).
4. On each portal, request a staff or employer file URL while signed out: `/portal/candidates/[id]`, `/portal/requests/[id]`, `/employer`.

**Beklenen / Expected:** `signOut` clears the Supabase session and the `panova_*` localStorage keys. The staff and candidate pages return to their sign-in forms. The employer page sends the browser to `/employer-login`. A signed-out file URL is redirected to `/portal` or `/employer-login`. If a verify email is still in `sessionStorage`, the redirect includes `?verify=1`.

**Bilinen engel / Known blocker:** `app/employer/components/EmployerHeader.tsx` also calls `signOut`, but no page renders that component. The live employer logout is the button on `app/employer/page.tsx`. Guides do not document logout.

## S12. Şifremi unuttum / Forgot password

**Rol / Role:** A password account for each audience. Then a Google-only account.

**Önkoşul / Preconditions:** The account already has an email provider. Supabase recovery email is configured (`supabase/templates/recovery.html`).

**Adımlar / Steps:**

1. On `/candidate` sign-in (not registration), open **Forgot password**. Submit the email. Open **I have a code or link**, which goes to `/auth/reset-password/candidate`.
2. Repeat from `/employer-login` sign-in. The reset path is `/auth/reset-password/employer`.
3. Repeat from `/portal` sign-in. The reset path is `/auth/reset-password/portal`.
4. Set a new password shorter than 8 characters, then two that do not match, then a valid pair.
5. On the forgot-password panel, read the Google note and use the Google button.

**Beklenen / Expected:** Each panel posts `requestPasswordReset` for that audience. The success text does not reveal whether the mailbox exists. After a valid reset, the app returns to `/candidate`, `/employer-login`, or `/portal`. Short and mismatched passwords are rejected in the browser (`passwordResetIssue`). The Google note says those accounts have no password.

**Bilinen engel / Known blocker:** The forgot-password link is only on the sign-in forms, not on registration. A Google-only user who submits the form still sees the generic “check your inbox” state; the page does not look up the account first. There is no in-app guide for this flow.

Automated: `lib/passwordReset.test.ts` and `lib/qa-entrypoints.test.ts`.

## S13. Kaynak ülke yönlendirme kodu / Source-country referral code

**Rol / Role:** `source_country`, then `upper_management`. Repeat once as `target_country`, once as `field_officer`, and once as a self-registered candidate.

**Önkoşul / Preconditions:** Migrations `20261104193000_supervisor_referral_codes.sql` and `20261104212539_source_country_referral_codes.sql` are applied. Each source-country officer already has `staff_members.referral_code` (`PV` plus 6 letters) from the invite or from the moment the role was saved. Target-country staff, field officers, finance, and limited staff do not. A candidate account is not a staff member.

**Adımlar / Steps:**

1. As upper management, invite a source-country officer. Confirm the staff card shows a code and no field for typing one. Invite a target-country officer and a field officer and confirm they have no code.
2. Sign in as the source-country officer at `/portal`. Read the code in the header badge and copy it.
3. Open **Candidates**, register a candidate (name, nationality, phone, profession, sector). The code field is read-only. Leave email empty or use a new one.
4. Sign in as upper management. On **Candidates**, set the code filter to that officer’s code, then to **No code / open registration**.
5. As upper management, register one candidate with a source-country code selected and one with the open-registration option.
6. On a no-code row, use **Delete open registration**. Open a coded row and confirm that button is absent. Try the same delete as the source-country officer.
7. Register a candidate at `/candidate` (self-signup) and, as a target-country officer or field officer, from **Candidates** or `/supplier`.
8. Open the candidate file `/portal/candidates/[id]` and switch the language (TR, GB, MK, AL, SA).

**Beklenen / Expected:** Inviting or assigning `source_country` stores a unique code before that officer registers anyone. The officer’s new candidate stores that code even if the request names a different code or none. The code cannot be edited from the staff card, the candidate form, or a later update. Self-registration, target-country registration, field-officer registration, and `/supplier` used by anyone without a code stay null. Upper management can filter by a code and by no code, including a code that already exists only on an older candidate. The list and the dossier show the code or an empty / open-registration label. Only upper management can delete a null-code candidate; coded rows and officer sessions cannot. Copy is available in TR, EN, SQ, AR, and MK. Arabic keeps `dir="rtl"`.

**Bilinen engel / Known blocker:** The database is the control. The Candidates screen does not send a source-country officer’s code; the insert trigger writes it. `/supplier` is still not linked from the portal navigation. Deleting a no-code candidate is a hard delete (related rows cascade; the profile link is set null). There is no in-app guide article for this flow.

Automated: `lib/referralCode.test.ts`.

## S15. Talep durumu / Request status

**Rol / Role:** Source country, target country, field officer, upper management, and the employer who owns the request.

**Önkoşul / Preconditions:** Migrations `20261114120000_request_status_auto.sql` (A), `20261114130000_request_status_manual_guard.sql` (B), and `20261114140000_pipeline_stage_travel_ready.sql` (C) are applied. A test request with headcount 2 and status `new_request`.

**Adımlar ve beklenen / Steps and expected:**

1. **Kendiliğinden ilerleme / Automatic.** As source country, match a candidate: the status becomes searching candidates. Present it: presenting candidates. As target country, schedule an interview: interviews. As the employer, select 2 of 2: selection completed. As target country, enter a process record (for example documents collecting): official process. Enter a ticket (`travel_status = ticketed`): travel planning. The status never moves back (undoing a selection keeps it), and completed or cancelled are never set automatically. Saving a candidate file with travel `planned` moves nothing.
2. **Elle değiştirme yok / No manual change.** As source country, target country, or field officer, open **Requests** and `/portal/requests/[id]`. The status is a label only, with no list and no “change status manually” section. A direct `update job_requests set status` from the app is refused with `demand_status_use_rpc`; the RPC `staff_set_request_status` returns `staff_role_not_allowed`.
3. **Üst Yönetim gerekçeyle / Upper management with a reason.** As upper management, pick another status. A reason box opens; the button stays disabled below 5 characters and above 1000. With a valid reason the status changes. The audit log has a row with `mode = manual`, `manual_override = true`, old and new status, the reason, and the staff name and role. Cancelled stores the reason as the close reason.
4. **Kayıtsız seçim yok / No selection without records.** On a request with no selected candidate, upper management picks selection completed. The change is refused with the `demand_status_transition` message and the status stays. Presenting candidates without a presented match and interviews without an interview are refused the same way.

**Bilinen engel / Known blocker:** None in the app. The status advances on the next record, so a request that was behind before A moves only when one of its records changes (see `supabase/verification/request_status_auto.sql`, section 2).

Automated: `lib/requestStatusChange.test.ts`, `lib/staffAccess.test.ts`. Database scenario (ends in rollback): `supabase/verification/request_status_scenario.sql`.

## S16. Aday durumu / Candidate status

**Rol / Role:** Upper management, source country, target country, field officer, and the candidate.

**Önkoşul / Preconditions:** The database part is applied: candidate status follows `official_process_status`, the RPC `staff_set_candidate_status` exists, and a direct status change on `job_candidates` is refused with `candidate_status_use_rpc`. A test candidate with no official process.

**Adımlar ve beklenen / Steps and expected:**

1. **Resmî süreçle uyum / Follows the official process.** On `/portal/candidates/[id]`, in the process panel, set the official process step by step. The **Candidate status** badge changes without a page reload: not started → pending; documents collecting, work permit applied, work permit approved → reviewing; visa applied → visa processing only with an accepted offer, otherwise reviewing; visa approved, ready to travel, started work → approved; rejected leaves the status as it was. The **Candidates** list shows the same badge, and the status filter still works.
2. **Üst Yönetim elle değiştirir / Upper management overrides.** As upper management, press **Change manually** in the list and on the detail card. Pick another status. **Save** is never greyed out because of the reason. With a valid reason the badge changes and the success message shows. Visa processing without an accepted offer is refused with its own message.
2a. **Gerekçe boşken yazılı uyarı / Written warning for an empty reason.** In the same form, press **Save** with the reason empty, then with 4 characters: nothing is sent, the status stays, and a red message ("The reason must be at least 5 characters", in the page language) appears under the reason field. The field gets a red border, focus moves to it, and a screen reader reads the message with the field (`aria-invalid="true"`, `aria-describedby`). Paste 1001 characters and press **Save**: the "at most 1000 characters" message shows. Keep typing: the message stays until the reason is valid (5 to 1000), then disappears. The counter (n/1000) and the hint stay as before. While the request runs, **Save** shows the saving text and cannot be pressed twice.
3. **Diğer roller göremez / Other roles cannot.** As source country, target country, or field officer, the status is a badge only, with no **Change manually** button in the list or on the detail card. Saving the candidate file (notes, travel and so on) still works and does not change the status. Calling `staff_set_candidate_status` directly returns `staff_role_not_allowed`.
4. **Aday değiştiremez / The candidate cannot.** Signed in as the candidate on `/candidate`, the status is shown but cannot be changed. A direct `update job_candidates set status` with a different value is refused with `candidate_status_use_rpc`, and the RPC returns `staff_role_not_allowed`.

Automated: `lib/candidateStatusChange.test.ts` (error code mapping, reason check, five languages, no direct status write in the portal).

## S17. Aday belgeleri ve video / Candidate documents and video

**Rol / Role:** Staff on `/portal/candidates/[id]`.

**Adımlar ve beklenen / Steps and expected:**

1. **Dosyasız belge onaylanamaz / No approval without a file.** Open `/portal/candidates/[id]` for a candidate with no rows in `candidate_documents`. In **Document tracking**, every default document (passport included) starts as pending, even when a passport number exists. For a document with no file, **Approved** cannot be picked in the list and "Upload a file before approving" shows under it. Upload a file: **Approved** can be picked. A document saved earlier as approved with no file shows the red "No file" warning. The **Document status** card counts all documents as the total and only approved documents with a file as approved (for example 0/5 with one approved row that has no file). The same rule applies to the `candidate_documents` rows in that card.
2. **Sertifika kutuları yok, video alanları çalışır / No certificate boxes; videos work.** On the same page the section is titled **Video introduction** with a video icon. There are no certificate number or issuing body boxes. The three YouTube fields behave as before: staff allowed to manage candidate videos can edit and save them, everyone else sees them read-only. Saving the page leaves `certificate_no` and `issuing_body` as they were in the database.

3. **Uçuş bilgisi yokken seyahat durumu / Travel status with no flight details.** Open `/portal/candidates/[id]` for a candidate with no flight date, flight number, departure or arrival (stored `travel_status` is `planned`). In **Travel, flight and logistics** the status list shows "Travel details not entered yet", not "Planned", and "Enter flight details first" shows under it. **Ticketed** and **Completed** cannot be picked. Type a flight number: both open up and **Planned** shows again; staff choose the status by hand. The **Travel and start** card on the right also shows "not entered" before any flight details, matching the candidate's **Your process** card and the employer tabs, and shows the saved status after **Save**. Saving without touching the status does not write `travel_status`; the stored `planned` stays.

4. **Belge önizleme / Document preview.** On `/portal/candidates/[id]`, press **Preview** on a document the candidate uploaded (stored as `storage:candidate-files/...`). A loading text shows. Check both a **JPG** and a **PDF** in Chrome: the JPG fits inside the window; the PDF opens in Chrome's PDF viewer inside the frame (its address is `blob:`, not the storage link). The browser's "This content is blocked" page never shows for either. For the JPG, **Open in new tab / download** opens the short-lived link; for the PDF it opens or downloads the same blob file under its file name. Close the window and open it again: it loads again (the old blob address was released). A PDF larger than 25 MB is not loaded into the window: a short note and a prominent **Open in new tab / download** link show instead. Each open still writes one access row for `candidate_documents` files, as before. A file with another type shows "Preview is not supported for this file type" with the same link. Older base64 files (`data:`) and web addresses still preview. Without access, or with a broken path, the window shows "Preview could not be opened" with a short reason instead of an empty frame, and the console has a `[document-preview]` line with the error code.

Automated: `lib/candidateDocuments.test.ts` (approval rule, counter, default list, five languages, removed keys), `lib/documentPreview.test.ts` (image / PDF / other, direct address vs storage reference), `lib/staffTravelStatus.test.ts` (not entered vs chosen status, disabled choices, save payload).

## S18. Genel Durum kartları / Overview cards

**Rol / Role:** Upper management and field officer (the roles that see **Overview**).

**Adımlar ve beklenen / Steps and expected:**

1. **Personel talepleri kartı / Personnel requests card.** As upper management, open **Overview**. A **Personnel Requests** card shows the number of open requests (every status except completed and cancelled) and "total N" under it. It matches the requests list: with 5 requests, one completed and one cancelled, the card shows 3 and "total 5".
2. **Kartlar sekmeye gider / Cards open their tab.** Click each card, then do the same with the keyboard (Tab to the card, Enter): **Total candidates** opens **Candidate Pool**, **Personnel Requests** opens **Personnel Requests**, **Active employers** opens **Employers**, **Staff & Roles** opens **Staff & Roles**, **Open issues / support** opens **Issues / Support**. The focused card has a visible ring and a light hover; a screen reader reads the label, the number and "Go to the … tab" in the page language. Numbers and labels are as before.
3. **Yetkisiz sekme yok / No unauthorised tab.** As field officer (tabs: overview, candidates, tasks, support), **Total candidates** and **Open issues / support** open their tabs. **Personnel Requests** and **Active employers** still show their numbers but are not buttons: no pointer, no focus with Tab, a click does nothing. The **Staff & Roles** card is not shown, as before.

Automated: `lib/portalOverview.test.ts` (open request count, card to tab, role check, five languages).

## S19. Personel belge listesi tek sistem / Staff documents in one system

**Rol / Role:** Staff on `/portal/candidates/[id]`. Upper management for deletion. S19 replaces the list parts of S17 item 1 (the old default list no longer exists).

**Adımlar ve beklenen / Steps and expected:**

1. **Tek liste / One list.** Open a candidate with no `candidate_documents` rows. **Document tracking** shows the five documents (passport, professional certificate, criminal record, health report, apostille) as "Not requested / not uploaded yet". The **Document status** card on the right lists the same five lines and shows **0/5**. There is no free-text "add document" box. Titles come from the document type and match the candidate's own page in every language.
2. **Sayaç tutarlılığı / Counter matches.** Request **Photo** from the card: it appears under the five slots in the body list and on the card; the card shows 0/6. Approve a document with a file: 1/6 on the card, and the body list shows the same status. A row saved earlier as approved without a file shows the red "No file" warning in both places and is not counted.
3. **Personel yüklemesi / Staff upload.** Upload a **JPG** and then a **PDF** on two slots. "File uploaded" shows next to the line; status becomes **Uploaded**; the file name shows. The new row (or the updated open request row) has `file_url` starting with `storage:candidate-files/`, never `data:`. **Preview** opens both files as in S17 item 4, and each open writes one access row. A file of a wrong type or over the size limit is refused with the same message as on the candidate page; nothing is written.
4. **Anında kayıt / Instant save.** Change a status: it saves at once and "Saved" shows next to the line; `reviewed_by` and `reviewed_at` are filled. **Approved** and **Reviewing** cannot be picked while the line has no file, and the hint "Upload a file before reviewing or approving" shows. Type a review note or a valid-until date and leave the field: it saves with the same feedback. Reload the page: the values stay.
5. **Talep et / Request.** On a virtual slot press **+ Request**: a pending row is added and the line shows **Pending**. Request the same type again from the card: "There is already an open request for this type" shows and no second row is added.
6. **Silme / Delete.** As upper management, delete a line: a confirm dialog shows first; after confirming the row is gone from both lists (a slot returns to "Not requested"). The file in storage is kept. As any other staff role, the delete button is not shown.
7. **Yetki / Role scope.** As a staff role that RLS does not allow to write this candidate's documents, change a status, upload or request: "You are not allowed to change this candidate's documents" shows next to the line or card, nothing changes, and the console has a `[candidate-documents]` line.
8. **documents_json korunur / documents_json kept.** Close a candidate's file or change details and press **Save**. In the database `documents_json` still holds `closure_meta`, `profile_meta` and any old `docs` list exactly as before; no new `docs` key is written. Old `docs` entries (base64 files) are not shown in the staff list and are not moved.

Automated: `lib/candidateDocuments.test.ts` (no-file rule, five slots plus other rows, counter, upload target row, open request, titles in five languages, `documents_json` kept, RLS refusal, no base64 or free-text add in the source, dictionary keys).

## S20. PDF önizleme / PDF preview

**Rol / Role:** Staff on `/portal/candidates/[id]`, in Chrome (desktop). S20 replaces the link parts of S17 item 4: there are now two separate links, **Open in new tab** and **Download**.

**Adımlar ve beklenen / Steps and expected:**

1. **Boş kalmaz / Never blank.** Open TEST Rahman Hasan > **Passport scan** > **Preview** (a PDF in `candidate-files`). After the loading text the PDF shows in Chrome's PDF viewer inside the window. There is no blocked-page icon and no empty frame. DevTools > Console shows no `Refused to frame` / `object-src` CSP error. The viewer's address is `blob:`.
2. **Yeni sekmede açılır / Opens in a new tab.** Press **Open in new tab** in the header: the PDF opens in a new tab in Chrome's viewer. No **Save as** dialog appears.
3. **İndir ayrı / Download is separate.** Press **Download**: the file is saved under its original name (or the document title with `.pdf`), and it opens in Acrobat.
4. **Temizlik / Clean-up.** Close the window and open it again: it loads again. The old `blob:` address no longer opens (it was released).
5. **Yedek mesaj / Fallback.** On a browser without a PDF viewer (for example Chrome on Android, or Chrome with "Download PDFs" turned on), the window shows "The PDF cannot be shown here. Open it in a new tab or download it." with both links instead of an empty frame. When the file cannot be fetched, the red error box shows its reason and a **Download** button.
6. **JPG ve erişim kaydı / JPG and access log.** A JPG preview still fits inside the window; **Download** saves it. Each preview open still writes one `log_document_access` row for `candidate_documents` files.
7. **Başka gevşetme yok / Nothing else loosened.** In the response headers of any page, `object-src` is `blob:` and `frame-src` adds only `blob:`; `frame-ancestors 'none'` is unchanged.

Automated: `lib/documentPreview.test.ts` (PDF blob typed `application/pdf` from octet-stream bytes, no download attribute on "open in new tab", storage download address, no sandbox, fallback text, CSP), `lib/securityHeaders.test.ts`.

## S21. İşveren talep formu / Employer request form

**Rol / Role:** Employer on `/employer`, **New request** tab. Rules in the database: `supabase/migrations/20261113180000_job_requests_guards.sql`.

**Adımlar ve beklenen / Steps and expected:**

1. **Alan altında hata / Message under each field.** Press **Submit** on the empty form. The button is never greyed out; nothing is sent. Every empty field shows its own red message under it (sector, position, experience, language, headcount, city, salary, work duration, accommodation, meals) and a summary "The request was not sent. Fix the marked fields." shows above the button. Focus moves to the first sector button. A screen reader reads the field's message with the field (`aria-invalid`, `aria-describedby`).
2. **Sınırlar / Limits.** Headcount `0`, `501` or `2.5`: "Headcount must be a whole number from 1 to 500." `1` and `500` are accepted. Salary `0` or `150000`: "Monthly net salary must be more than 0 and at most 100,000."; `negotiable`: "Enter the monthly net salary as a number."; `100000` is accepted. City or work duration with only spaces: the "cannot be empty" message.
3. **Düzeltince kaybolur / Clears on edit.** Change a marked field: its message disappears; the other messages stay. Focus goes to the first remaining field on the next **Submit**.
4. **Sunucu kuralı / Server rule.** With the client check bypassed (for example a request sent with headcount 600 from DevTools, or an older open tab), the database refuses it (`23514`, `job_requests_headcount_range`). The form shows the headcount message under **Headcount**, not a generic error. Company name empty in the profile: "Your company name is missing…" above the button.
5. **Personel alanları / Staff-only fields.** As an employer, a request sent with `assigned_to`, `assigned_backup` or `is_demo` set is saved with those reset (null, null, false). Changing them on an existing request is refused with `request_fields_staff_only`. Staff can still assign requests from the portal.
6. **Silme / Delete.** An employer can delete their own request only while it has no match, interview or offer; after that the delete removes nothing.
7. **Diller / Languages.** Repeat item 1 in TR, EN, SQ, AR, MK: every message is translated.

Automated: `lib/workforceRequest.test.ts` (per-field errors, limits 1–500 / 0–100000 / 0–60, first invalid field, database rule to field, five languages, page wiring).

## S22. İşveren özet kartları ve talep silme / Employer summary cards and request delete

**Rol / Role:** Employer on `/employer`. Staff view (`/employer?view=…` as staff) for item 5.

**Adımlar ve beklenen / Steps and expected:**

1. **Kartlar üstte / Cards at the top.** Open `/employer`. The four cards **Open Requests**, **Total Candidates**, **Interviews** and **My Selected Candidates** show right under the tab bar, before the request list, on every tab (also on **New request**, above the form). They are no longer at the bottom. The **PANOVA Operations Summary** box is unchanged.
2. **Sayılar aynı / Same numbers.** The numbers equal the earlier totals: **Open Requests** does not count completed or cancelled requests; the other three are the sums of the request cards. When the counts cannot be loaded every card shows a dash.
3. **Tıklanabilir / Clickable.** Click each card, then do the same with the keyboard (Tab to the card, Enter or Space). The focused card has a visible ring. **Open Requests** stays on **Overview** and scrolls smoothly to the request list; focus is on its heading. **Total Candidates** opens **Candidates**, **Interviews** opens **Interviews**, **My Selected Candidates** opens **Selected**; each scrolls to and focuses that section. A screen reader reads e.g. "Open Requests: 2. Go to Your Active Workforce Demand Files" in the page language (check TR, EN, SQ, AR, MK).
4. **Silme / Delete.** On a request with no presented candidate, interview, selection or offer, **Delete request** shows under its date. Press it: a confirmation asks first; after OK the request disappears. Requests with any of those counts above 0 show no delete button. A request with a match the employer cannot see yet (staff matched but not presented) still shows the button; pressing it leaves the request and shows "This request has a process linked to it and cannot be deleted." under the card. Other errors show "The request could not be deleted. Please try again."
5. **Personel görünümü / Staff view.** As staff viewing an employer, no delete button shows.

Automated: `lib/employerOverview.test.ts` (card order, targets, numbers from the same totals, placement in the page, aria label in five languages, delete outcome, delete button rule, removed DemandForm / createDemand), `lib/employerDemandDisplay.test.ts`.
## S23. Maaş para birimi / Salary currency (EUR / USD)

**Rol / Role:** Employer on `/employer`; staff on `/portal`, `/portal/requests/[id]`, `/portal/candidates/[id]`; candidate on `/candidate`. Column: `job_requests.salary_currency` (`supabase/migrations/20261113190000_job_requests_salary_currency.sql`).

**Adımlar ve beklenen / Steps and expected:**

1. **Form: yalnız sayı / Form: numbers only.** On **New request**, the salary field has a currency list next to it with **EUR (€)** selected. Type `1550 euro`: on **Submit** the field shows "Enter the monthly net salary as a number."; `0` or `100001` show the 0–100,000 message. `1400`, `1.400` and `1400,50` are accepted. Switch to **USD**: the placeholder and the hint under the field change from € to $.
2. **Kayıt / Saved.** Send a request with `1400` and **USD**. In the database `monthly_net_salary` is 1400 and `salary_currency` is `USD`. A request sent without touching the list is `EUR`.
3. **Gösterim / Display.** The employer request card shows `$1,400` (EN) / `$1.400` (TR) for the USD request and `€1.000` style for the existing EUR requests, never a bare number. The same request shows the same amount and symbol in **Personnel Requests** on `/portal`, in the request detail modal, and under the currency list on `/portal/requests/[id]`. Change the page language: the number format follows it (TR/SQ/MK `1.400`, EN/AR `1,400`). An old request with a free-text salary still shows its text as typed.
4. **Teklif talepten gelir / Offer from the request.** On `/portal/requests/[id]` open **Manage** → a candidate → offers. **New offer** starts with the request's salary filled in. The currency is shown as fixed ("set by the request, cannot be changed") and is the request's currency (USD for the USD request). Change the salary to 1500 and send: the offer has `monthly_net_salary` 1500 and `offer_terms.currency` `USD`. Editing that offer keeps 1500 and USD.
5. **Talepsiz teklif / Offer without a request.** From a candidate file (`/portal/candidates/[id]`, no request) the offer currency is EUR: the offer panel's currency list starts at EUR and offers only EUR and USD (the database refuses other codes, `job_offers_currency_check`), and the **Send official job offer** box shows `(€)` and saves `offer_terms.currency` `EUR`.
6. **Teklif görünümü / Offer views.** The offer list in the panel, the employer **Offers** list and the candidate's offer card all show the amount with its currency (e.g. `$1,500`). Older offers without a stored currency show €.
7. **Diller / Languages.** Repeat items 1 and 4 in TR, EN, SQ, AR, MK: the hint, the placeholder and the fixed-currency note are translated.

Automated: `lib/money.test.ts` (formatSalary by locale, numbers-only input and limits, currency sent with the request, offer salary and currency from the request, EUR without one, screens use the page locale, five languages, SQL files), `lib/workforceRequest.test.ts`, `lib/offers.test.ts`.

## S24. Demo verisi / Demo data (Üst Yönetim)

**Rol / Role:** Upper management on `/portal` → **Overview**. RPCs `staff_demo_data_summary`, `staff_seed_demo_data`, `staff_delete_demo_data` (`supabase/migrations/20261113200000_demo_data_tools.sql`, applied by hand). Use a test project or agree the timing first: delete removes demo rows for everyone.

**Adımlar ve beklenen / Steps and expected:**

1. **Görünürlük / Visibility.** As upper management the **Demo data** card is under the overview cards. Sign in as source-country, target-country, field officer, finance: there is no card. Calling one of the RPCs as such a user returns `staff_role_not_allowed` (42501); if it ever reaches the card it shows "Only upper management can do this.", not a silent failure.
2. **Özet / Summary.** On open the card shows counts for employers, requests, candidates, matches, interviews, offers, documents, tasks and support tickets (the `is_demo` rows). Audit logs, staff, portal users and applicants are not shown.
3. **Oluştur / Create.** **Create demo data** → a confirm dialog → OK. While it runs both buttons are disabled and "Working, please wait…" is shown; a double click does nothing extra. On a clean database the result reads "26 records created." (2 employers, 3 requests, 5 candidates, 5 matches, 2 interviews, 3 offers, 6 documents) and the counts go up. Click again: "Demo data already exists. No new records were created." Cancel in the dialog changes nothing.
4. **Sil, onay / Delete, confirm.** **Delete all demo data** is red. Its dialog states the number of records (up to the deletable total), that deleted records are backed up first, that demo employers and candidates linked to a login account are not deleted, and that the uploaded files of the deleted demo candidates are removed. Cancel changes nothing. With nothing to delete the button is disabled and "There is no demo data to delete." is shown.
5. **Sil, sıra / Delete, order.** OK: first every file under `candidate-files/<id>/` of the demo candidates without a login (`is_demo = true and auth_user_id is null`) is removed, then the RPC runs. The result reads "N demo records deleted." and the counts drop (linked demo accounts stay). `demo_data_backup` has one row per table, and `audit_logs` has "Üst Yönetim demo verisini sildi" with the counts.
6. **Dosya hatası / File error.** Make the storage delete fail (e.g. revoke the storage delete policy on a test project). The card shows "Demo candidate files could not be deleted; no records were deleted from the database. Error: …" in red and the RPC is not called: the counts are unchanged.
7. **Diller / Languages.** Repeat 2–4 in TR, EN, SQ, AR, MK: titles, buttons, dialogs and results are translated; Arabic stays right-to-left.
8. **Aday e-postaları / Candidate e-mails** (after `supabase/migrations/20261113210000_demo_seed_candidate_emails.sql`). Delete the demo data, then create it again while signed in as upper management. The five demo candidates have `<your local part>+aday1@<your domain>` … `+aday5` as e-mail (a `+tag` in your own address is dropped first), so their mails arrive in your inbox. A staff row with no e-mail gives the old `demo1113.aday<N>` example.com addresses. Candidates that already existed keep their old address (the seed does not update rows). Do not write real addresses into this file or the repo.
9. **İşveren e-postaları / Employer e-mails** (after `supabase/migrations/20261114100000_demo_seed_employer_emails.sql`). Delete the demo data, then create it again as upper management. The two demo employers get `<your local part>+isveren1@<your domain>` and `+isveren2` (a `+tag` in your own address is dropped first); the candidates keep `+aday1` … `+aday5`. A staff row with no usable e-mail gives the old `demo1113.isveren<N>` example.com addresses. Employers that already existed keep their old address. Note: an employer that signs in with exactly that address is linked to the demo employer (`lower(email)` match), and a linked demo employer is then kept by **Delete all demo data**. The repository creates no unique constraint on `employers.email`. Do not write real addresses into this file or the repo.

Automated: `lib/demoData.test.ts` (count reading, seed result and "already exists", untouched tables, permission error, recursive file listing and stop on a storage error, files before the RPC, upper-management gate, five languages).

## S25. Kılavuz yazdırma / PDF / Guides print and PDF

**Rol / Role:** Upper management, one other staff role (e.g. source-country), a demo employer and a demo candidate account. Use demo records only. Page: `/guides/print`, opened from **Yazdır / PDF** on `/guides`. No PDF is made on the server: the browser's print dialog saves it.

**Adımlar ve beklenen / Steps and expected:**

1. **Düğme / Button.** On `/guides` the header shows **Yazdır / PDF: Tüm roller** for upper management and **Yazdır / PDF: Kendi kılavuzum** for every other signed-in account. Signed out, unverified or unlinked: no button.
2. **Üst Yönetim / Upper management.** Click the button. `/guides/print` shows a toolbar (back link, **Yazdır / PDF**, **Rol** select, language switcher), then the cover: `Portal kılavuzları`, "Panova Group Kullanım Kılavuzu", language, creation date, session role, scope "Tüm roller". Then the table of contents, every role card and every how-to, `staff-invite` included.
3. **Tek rol / One role.** Pick **İşveren** in **Rol**. The address becomes `/guides/print?role=employer`; only the employer card and the employer how-tos (request, browse) remain, scope shows the role. Pick **Tüm roller** again: everything is back. Open `/guides/print?role=nope` by hand: the full set is shown.
4. **PDF kaydet / Save as PDF (upper management).** Click **Yazdır / PDF**, choose **PDF olarak kaydet** / **Save as PDF** as the destination, A4, and save. In the PDF: the toolbar, buttons and language switcher are not there; the cover is page 1, the table of contents starts a new page and every role and every how-to starts on a new page; screen cards and the **Örnek** boxes are not split across pages and the example boxes are printed with a border; text is black on white; the footer shows "Sayfa N" (Chrome, Edge; a browser without @page margin boxes simply has no number).
5. **Diğer personel / Other staff.** As source-country with `?role=upper_management` in the address: still only the source-country card and the staff how-tos, no `staff-invite`.
6. **İşveren / Employer.** Sign in with the demo employer, open `/guides` → **Yazdır / PDF: Kendi kılavuzum**. Only the employer card and the two employer how-tos; `?role=candidate` changes nothing. Save as PDF as in step 4.
7. **Aday / Candidate.** Sign in with the demo candidate. Only the candidate card and the registration how-to; save as PDF as in step 4.
8. **Oturumsuz / Signed out.** In a private window open `/guides/print`: it goes to `/guides` and shows the sign-in card there.
9. **Dil ve yön / Language and direction.** Switch to EN, SQ, AR, MK on the print page and print again. Toolbar, cover and headings follow the language. In Arabic the page and the PDF run right to left, arrows in the flow point left. New how-to texts that are still pending translation print in Turkish (see `docs/guides-translation-todo.md`).

Automated: `lib/guides-print.test.ts` (upper management all or one role, ?role ignored for others, employer and candidate own role, never more than `/guides`, button label and link, texts in five languages, print CSS and shared session check).

## S26. Sayfa başlıkları / Page headers

**Rol / Role:** Signed out, then upper management, a demo employer and a demo candidate. Shared component: `components/site/PageHeader.tsx` (`PageHeader`, `HeaderActions`).

1. **Sıra / Order.** On `/portal`, `/portal/candidates/{id}`, `/portal/requests/{id}`, `/portal/employers/{id}`, `/employer` and `/candidate` the right-hand group ends with: language switcher, **Ana Sayfaya Dön**, **Çıkış Yap**, same look on every page. Page buttons come first: **Portala Dön** and save (plus match and delete on a request, delete on an employer) on the staff files; **Personel paneline dön** on `/employer` opened from the portal; print and back to portal on `/guides`.
2. **Kullanıcı / User.** The staff name and role badge on `/portal` and the "Yetkili: …" label on `/employer` sit on the left, next to the logo and the title, not in the button group.
3. **Girişsiz sayfalar / Signed-out pages.** `/portal` and `/candidate` sign-in, `/employer-login`, `/auth/reset-password`, `/kvkk`, `/admin` and `/supplier` show language switcher and **Ana Sayfaya Dön** only (no log out). `/guides` adds **Çıkış Yap** once signed in.
4. **Davranış / Behaviour.** Log out on `/portal` and `/candidate` shows the sign-in screen, on `/employer` it opens `/employer-login`, on a staff file it opens `/portal` signed out. **Ana Sayfaya Dön** opens `/` (on reset-password it also clears the pending recovery).
5. **Mobil ve RTL / Mobile and RTL.** At 360 px width the buttons wrap to a new row and nothing scrolls sideways. In Arabic the group mirrors and the arrows turn.
6. **Yazdırma / Print.** `/guides/print` keeps its own toolbar; it is still hidden in the printout (S25).

Automated: `lib/page-headers.test.ts`.

## S27. Çalışma süresi ve başlama tarihi / Work duration and start date

**Rol / Role:** A demo employer on `/employer` → **Yeni talep**, then staff on `/portal`. Stored text: `job_requests.contract_type` (`lib/contractDuration.ts`), date: `job_requests.target_start_date`. No database change.

1. **Süre / Duration.** The duration is a number field (1-999) and a unit list (Gün, Hafta, Ay, Yıl, Süresiz / belirsiz süreli). Submit with no unit: "Çalışma süresi boş bırakılamaz." under the field. Unit **Ay** with no number: the same message; with `0`, `1000` or `2.5`: "Geçerli bir sayı girin (1-999)." Pick **Süresiz**: the number field is closed and the form is accepted.
2. **Kayıt / Stored value.** Send `12` + **Ay**: `contract_type` is `12 ay`; `90` + **Gün** gives `90 gün`; **Süresiz** gives `süresiz` (the Turkish unit code, whatever the page language). The `job_requests_contract_type_nonblank` rule never fires from the form.
3. **Başlama tarihi / Start date.** Optional (the column accepts null; the form sent no date before). The date picker does not offer days before today; a past date typed by hand shows "İşe başlama tarihi bugünden önce olamaz." Today is accepted. With a date the request has `target_start_date`, without one it stays empty.
4. **Gösterim / Display.** The employer request card, the staff request list, the request detail on `/portal`, the match panel and the offer form show the duration in the page language: TR "12 ay", EN "12 months", SQ "12 muaj", AR "12 شهرًا", MK "12 месеци" (1 ay: "1 month", "1 месец", "1 شهر"). Old free-text values ("Sezonluk", "12 ay (sezonluk / tam zamanlı)") are shown exactly as stored. Demo seed: "1 yıl" is canonical and is translated ("1 year"), "Sezonluk" stays as it is.
5. **Personel düzenleme / Staff edit.** `/portal/requests/{id}` → request info: the duration uses the same number + unit picker. A canonical value fills the picker. An old free-text value is kept as it is and shown under the picker ("Stored value (old free text): …") until a new duration is picked; Save with an incomplete number shows "Geçerli bir sayı girin (1-999)." and saves nothing.
6. **Diller / Languages.** Repeat 1 and 4 in EN, SQ, AR, MK: labels, units, open-ended text and messages are translated; Arabic stays right-to-left.

Automated: `lib/contractDuration.test.ts` (parse, canonical text, plural forms per language, old text unchanged), `lib/workforceRequest.test.ts` (validation and the insert row).

## S28. Aday belge önizleme ve indirme / Candidate document preview and download

**Rol / Role:** A demo candidate on `/candidate` → **Belgelerim / Documents**, in Chrome (desktop) and on a phone. The candidate page uses the same preview window as staff (`components/portal/DocumentPreviewModal.tsx`, S20). The site CSP is unchanged.

1. **PDF.** On a document with an uploaded PDF press **Önizle / Preview**. After the loading text the PDF shows inside the window from a `blob:` address. There is no "Bu içerik engellenmiştir / This content is blocked" page and no `Refused to frame` error in the console. The header has **Yeni sekmede aç / Open in new tab** and **İndir / Download**.
2. **JPEG.** Preview a JPG or PNG document: the image fits inside the window; the two header links work.
3. **Yedek / Fallback.** On a browser without a PDF viewer (Chrome on Android, or "Download PDFs" turned on) the window shows "The PDF cannot be shown here…" with **Open in new tab** and **Download**, never an empty frame.
4. **İndir düğmesi / Download button.** Each document card with a file has **İndir** (EN Download, SQ Shkarko, AR تنزيل, MK Преземи) next to **Önizle**. It saves the candidate's own file under its original name (or the document title). A card without a file has neither button.
5. **Erişim / Access.** Preview and download go through the same path as before (`log_document_access`, then a short signed URL from the private `candidate-files` bucket), so access is logged as before. Another candidate's file cannot be opened (storage rule `can_access_candidate_file`), and employers still have no document access.
6. **Diller / Languages.** Repeat 1 and 4 in EN, SQ, AR, MK: the window texts and the button label are translated; Arabic stays right-to-left.

Automated: `lib/documentPreview.test.ts` (no `<iframe` on the candidate page, shared preview window, download uses the preview access path, CSP not widened).
## S29. İşveren dışa aktarma / Employer export (CSV, Excel, Print / PDF)

**Rol / Role:** A demo employer on `/employer` with requests, selected candidates, an accepted offer and a started employee (demo data from S24). Rows come from the lists the page already loaded (`lib/employerExport.ts`); no new query, no SQL, no audit row.

1. **Dört liste / Four lists.** Each list shows **CSV indir**, **Excel indir** and **Yazdır / PDF** when it has rows: **Ana sayfa** (requests), **Mülakatlar** → Teklifler (offers), **Seçtiğim adaylar**, **Aktif çalışanlar**. An empty list shows no bar.
2. **Sütunlar / Columns.** Headings are in the page language (TR "Pozisyon", EN "Position", SQ "Pozicioni", AR "الوظيفة", MK "Позиција").
   - Requests: position, headcount, city, country, monthly net salary, currency, work duration, target start, status, created.
   - Selected: full name, profession, nationality, city, experience, languages, position, decision date.
   - Employees: full name, profession, nationality, position, official process, flight date, departure city, arrival city, start date.
   - Offers: candidate, position, monthly net salary, currency, start date, terms, status.
3. **Yasak alanlar / Never exported.** No file contains a phone, e-mail, passport, document, internal note (`panova_notes`, `internal_notes`), referral code, flight number, 30/60/90-day follow-up note, video link or record id.
4. **Yazdır / Print.** **Yazdır / PDF** opens a new window with a table and the print dialog; "Save as PDF" gives a PDF. In Arabic the table is right-to-left. With pop-ups blocked: "Yazdırma penceresi engellendi…" and nothing else happens.
5. **Excel.** The `.xls` file opens in Excel (Excel may warn that the format and extension differ; choose Yes). A value starting with `=`, `@` or `-cmd` stays text. Headings are bold and every column is readable without widening it.
6. **Denetim yok / No audit row.** After an employer export, `audit_logs` has no new "Dışa aktarma" row and the browser console shows no audit error. A staff export (Adaylar, Talepler, İşverenler on `/portal`) still writes one, unchanged.
7. **Personel yazdırma / Staff print.** On `/portal` → Adaylar, Talepler or İşverenler, **Yazdır / PDF** now opens the print window (before, nothing happened).
8. **Personel başlıkları ve değerler / Staff headings and values.** On `/portal` → Talepler, İşverenler and Adaylar, in TR, EN, SQ, AR and MK, download CSV and Excel and print. Headings are words in the portal language (TR "İşveren", "Pozisyon", "Aylık net maaş", "Şirket", "Yetkili"), never `employer_name`, `position_title`, `monthly_net_salary`, `company_name`, `contact_person`. No output has an `id` / "Kayıt no" or `is_demo` / "Demo" column. Request status reads like the screen ("Görüşmeler Yapılıyor", "Adaylar Sunuluyor", "Aday Aranıyor"), not `interviews`, `presenting_candidates`, `searching_candidates`. Sector and country are in the page language (TR "Kuzey Makedonya", MK "Северна Македонија"); dates are local days (TR `01.12.2026`, EN `01/12/2026`); amounts use the local thousands separator (TR `1.300`, EN `1,300`) with the currency in its own column. **Teklifleri dışa aktar** gives the same kind of headings.
9. **Telefon / Phone.** In CSV, Excel and print a phone shows as stored (`+389 70 385 792`, `+90 545 364 49 30`) with no `'` in front. In Excel the phone cell is text (no `3,89E+11`). Put `=1+1` and `-cmd` in a demo employer's contact person: CSV and Excel show them as text with a leading `'`; print shows them as typed and nothing runs.
10. **CSV Türkçe Excel'de / CSV in Turkish Excel.** On Windows with Turkish regional settings, double-click the `.csv`: every field is in its own column and ç, ş, ğ, İ, Cyrillic and Arabic letters are correct. (The file uses `;` between fields and a UTF-8 BOM. Excel set to English (US) shows one column; open it there with Data → From Text/CSV, delimiter Semicolon, or use the Excel button.)
11. **Yatay yazdırma / Landscape print.** The print preview is landscape A4. The table fits the page width: the rightmost column is inside the printable area, long cells (terms, addresses) wrap, the text is a readable size (12px, headings semi-bold; a 10-column list such as Adaylar still fits without a horizontal cut), and on a list longer than one page the headings repeat at the top of each page. Chrome and Edge print no "about:blank" address or browser header / footer; the window title (and the PDF's default name) is the list name and the date, e.g. "Talepler · 14.11.2026".
12. **Pencere kapanır / Window closes.** After printing, saving as PDF or pressing Cancel, the print window closes by itself and the portal page is in front again. Same on `/employer` (all four lists).

Automated: `lib/employerExport.test.ts` (whitelists, forbidden fields and values, no audit, five-language headings, localized dates, numbers and countries), `lib/exportShared.test.ts` (print window without noopener that closes on afterprint, audit option, pinned list of hidden columns, staff headings from the shared labels in five languages), `lib/exportLists.test.ts` (formula guard with phone numbers, `;` CSV, Excel text phone cells and widths, print without quotes and landscape, translated request status).

## S30. Aday teklif ve belge listesi yazdırma / Candidate offer and document list print

**Rol / Role:** A demo candidate on `/candidate`, in Chrome and Firefox (desktop). Printing happens on the same page (`window.print()`); no new window and no pop-up. Nothing is written to the database or the audit log.

1. **Teklif / Offer.** **Tekliflerim / Offers** → each offer card has **Yazdır / PDF** (EN Print / PDF). The print preview shows only that offer: heading "İş teklifi", candidate name, print date, position, employer, salary, start date, terms, status. It fits on one page (A4, 16 mm margins). Other offers, the accept / reject buttons, the tab bar and the header do not appear.
2. **Belge listesi / Document list.** **Belgelerim / Documents** → **Belge listesini yazdır** (shown only when there is at least one document). The preview is a table: document type, status, file name, review note (empty cells show "—"). No file, image or PDF content is printed.
3. **PDF olarak kaydet / Save as PDF.** In the print dialog pick "Save as PDF": the file has the same content as 2 or 1.
4. **Kapanış / After printing.** Cancel or finish the dialog: the page is unchanged and the same button works again. Pressing **Ctrl+P** without a button prints the page as before (the page is hidden on paper only while a print button's sheet is open).
5. **Diller / Languages.** Repeat 1 and 2 in EN, SQ, AR, MK: headings and column names are translated; Arabic prints right-to-left.

Automated: `lib/candidatePrint.test.ts` (offer and document whitelists, no file in the print view, the page is `print:hidden`, texts in 5 languages).

---

## S31. Ana sayfa / Home page

**Rol / Role:** Signed out, on `/`. Chrome and Firefox on desktop, and a phone (or DevTools at 360 px width).

1. **Masaüstü / Desktop.** The header shows the logo, one language switcher and one **Giriş** button. The hero has a soft green gradient, the line drawing of the office countries, west to east Kuzey Makedonya, Türkiye, Bangladeş, joined by a dashed line (the same countries as the office line and the stats bar; no Arnavutluk), and the **İşleyiş** card (Talep → Aday → Mülakat → İşe başlama). Section backgrounds alternate light and dark. Cards lift a little on hover. The numbers in the stats bar count up once when they come into view; the sectors stat reads **8 · Uzmanlaştığımız ana sektör** and its link jumps to the sector cards. Each sector card has an icon, one sentence and three example positions. The 5 steps sit on a horizontal line and appear one after another while scrolling. The **Neden güvenilir?** block has 6 cards (registry, KVKK, clear process, 30/60/90, skills, languages). No "Referans işverenler" / logo note appears. FAQ items show a chevron (no "+") that turns when opened.
2. **Adres tekrarı / Addresses.** Full addresses and phones appear only in the contact card next to the form. **Kurumsal** shows the registry facts and an **İletişim bilgileri** link to the form. The footer shows the brand, the registry name, the countries, the e-mail and the same link.
3. **Telefon / Phone.** No horizontal page scroll. The header fits on one line (logo, language, **Giriş**). The section links under the hero are one row that scrolls sideways inside itself. The timeline is vertical. Sector and trust cards are one column.
4. **Arapça / Arabic (RTL).** Switch to AR: the page is right-to-left, arrows point left, the sign-in menu opens inside the screen (aligned to the button's left edge), the timeline line sits on the right on phones. The drawing stays left-to-right (North Macedonia on the left, Türkiye in the middle, Bangladesh on the right) with Arabic country names that are not cut off.
5. **Azaltılmış hareket / Reduced motion.** Turn on "reduce motion" (Windows: Settings → Accessibility → Visual effects → Animation effects off; macOS: Reduce motion; or DevTools → Rendering → `prefers-reduced-motion: reduce`) and reload. Everything is visible at once: no fade-in, no counting (final numbers shown), no moving route line, no card lift.
6. **Giriş menüsü klavye / Sign-in menu by keyboard.** Tab to **Giriş**. Enter, Space or ↓ opens it and focuses **Aday**; ↑ opens it on **Personel**. ↓ / ↑ / Home / End move between **Aday**, **İşveren**, **Personel**. Enter opens `/candidate`, `/employer-login` or `/portal`. Escape closes and focus returns to **Giriş**; Tab closes it. A click outside closes it. With a screen reader (NVDA / VoiceOver) the button is announced as a menu button with its expanded state and the three items as menu items.
7. **Diller / Languages.** Repeat 1 in EN, SQ, MK: the new texts (menu, hero card, stats, sector cards, trust block) are translated.
8. **Rakam kartları telefonda / Stats on a phone.** At 360 px and 400 px in TR, EN, SQ, AR and MK: the four stat cards are two per row with the icon above the text; "30/60/90" and "8" are whole inside the card, labels such as "Uzmanlaştığımız ana sektör" and the Macedonian ones wrap inside the card, the cards in a row are the same height, and there is no horizontal scroll bar at any width (also at 320 px).
9. **Harita etiketleri / Map labels.** Desktop and phone, all five languages: each country name is right under its own point at the same distance (Kuzey Makedonya, Türkiye, Bangladeş), none is cut at the edge and none overlaps another or the dashed line (check the long MK "Северна Македонија" and AR).
10. **Telefonlar / Phones.** In the contact card, on `/kvkk` and in the sign-in pages' footer every number has the same spaced international style: `+389 70 385 792`, `+389 75 818 697`, `+90 545 364 49 30`, `+880 1805 511473`. Each `tel:` link dials the number without spaces. All come from `lib/company.ts` (`officePhone`).
11. **Şeffaf süreç / Clear process.** In **Neden güvenilir?** the clear-process card has two sentences (the second: the request status moves on by itself; the official process has eight steps) and is about as tall as its neighbours, in all five languages.

Automated: `lib/home-page.test.ts` (three sign-in links, one language switcher, no logo placeholder text, new texts in 5 languages, catalog example positions, map cities equal to the office cities in `lib/company.ts`, no Albania on the map, opt-in motion CSS), `lib/contrast.test.ts`.

---

## Boşluk analizi / Gap analysis

Only items checked in this repository. Hosted database policies that were never committed here are called out as absent from the migrations, not as a measured production failure.

### Empty states that show sample rows

- An employer with no `job_requests` sees `empNoDemands`. Sample construction and agriculture rows are no longer substituted.
- An employer with no `interviews` sees `empNoInterviews`. Sample appointments are no longer substituted.
- Staff with no `tasks` rows sees two local tasks assigned to named people (`app/portal/page.tsx`). The titles are dictionary keys (`taskPassportCheck`, `taskSaveDemand`) and do translate, but the rows are not stored.
- The candidate browser, YouTube block, document-status panel, and guides gate do have real empty copy.

### Validation and authorization the UI does not finish

- Employer select ignores the update error and alerts success (`handleSelectCandidate`). **Selected** is derived from `status === 'approved' || status === 'selected'` on the browse rows. `is_selected` is written but not read back.
- If `employer_browse_candidates` is missing, the employer page queries `job_candidates` with no employer predicate. The RPC itself returns only matched, non-archived candidates and omits passport, phone, and email.
- This repo’s `job_candidates` policies in `supabase/migrations/20261026240000_email_proof_gate.sql` allow a candidate to update only their own row. No employer update policy is added. Candidate accept/reject on `job_offers` has no policy in these migrations.
- `DemandForm.tsx` (video-required checkbox) and `EmployerHeader.tsx` are unused. The live demand form does not store a video-required flag.
- `invite_staff` allows `finance` and `limited`. The Staff form, task-option groups, video permission, and guide role ids do not. Those two roles would get no task groups in `TasksTab` and the generic staff label on `/guides`.
- The task dropdown is filtered by role (source, target, field, upper management). The guide says staff share the same tabs, which is true for the tab bar, and does not mention this filter.

### i18n that is still one language

Guide copy, portal dictionary, and the labor-request errors exist in TR, EN, SQ, AR, and MK. These strings do not:

- Staff invite JSON errors in `app/api/staff-invite/route.ts` (the invite email itself follows the sender's locale).
- The audit text `Personel Davet Edildi:`.
- Candidate support and emergency placeholders, the five default document names written into `documents_json`, and alerts prefixed with `Hata:`.
- Candidate signup nationality is the selected country (English value), not `Belirtilmedi`. The confirm-signup template still has to be pasted into the hosted dashboard (`supabase/templates/README.md`).

### Product UI with no guide article

Logout (S11), forgot password (S12), and the 6-digit code field on `EmailVerifyNotice` are implemented. `GUIDE_CATALOG` has no id for them.

### Screens that are not the portal map

- `/admin` is behind `AuthGuard` role `staff`. The page title comes from `homeCopy.admin.title` (“Admin hub”). The employers, demands, candidates, and tasks on that page are `useState` samples. It does not read Supabase. No navigation link points at `/admin`.
- `/supplier` is behind `StaffGate` and inserts a `job_candidates` row. No navigation link points at `/supplier`. A source-country officer’s insert is stamped with their referral code; other staff leave the code null.
- The public home page section `#nasil-calisir` is marketing copy, not the guides hub.

### What is already guarded

These are not gaps; they are here so a later pass does not re-file them:

- Lodging and meals must be boolean on new employer demands, in the client and on `job_requests` (not null, no default).
- YouTube preview uses the video id only. Supervisors in upper management, source country, and target country may write. The database trigger blocks everyone else.
- `/guides` hides articles until the session is confirmed and linked, then filters cards and how-tos with `audienceAllows`.
- Employer interview creation goes through `employer_request_interview`, which requires a match on that employer’s request.
- Source-country officers each have one system-assigned `referral_code`, created when the role is saved. Their candidate inserts are stamped with it and the code cannot be changed afterwards. Target-country staff and field officers do not have a code. Self-registration stays null. Upper management can delete a candidate, including one that has a referral code, after the confirm dialog. Officers cannot.

## S14. Cross-portal control / Çapraz portal kontrolü

Walk every signed-in portal once. For each row: do the action, then check the expected result in the language you have selected (TR, EN, SQ, AR, MK). Arabic keeps `dir="rtl"`. Do not run `supabase/scripts/delete_demo_records.sql` on production until the preview counts are reviewed; that script ends in `ROLLBACK`.

### Candidate (`/candidate`)

| Control | Expected |
| --- | --- |
| Sign-in / sign-up toggle | The matching form opens. Sign-up does not create a row until the mailbox is confirmed. |
| Nationality on sign-up | Required. Options are the European list plus Bangladesh and Uzbekistan, labeled in the active language. The stored value is the English country name, not `Belirtilmedi`. |
| Password, Google, forgot password | A password shorter than 8 characters is refused. Google uses the same address. Forgot password opens the reset screen. |
| Verify screen | A code or a pasted confirm URL confirms the mailbox. Leave that screen to the email-verification work. |
| Overview, Profile, Documents, Offers, Support, Guides | Only these tabs. Guides opens `/guides` for a candidate. |
| Profile save | Name, passport, phone, profession, sector, and nationality are required. An empty nationality is refused. A valid save reloads with the same values. An email or photo failure does not discard the other fields. |
| Header | Shows the localized nationality next to the profession. |
| Document upload | The file lands on `candidate_documents` for that slot and the status leaves pending. |
| Offers card | The title is dark on white. Salary shows `monthly_net_salary` plus currency when `offer_terms.currency` is set, then the translated “net / month” label. An empty salary shows the translated “salary not set” line. Status uses `offerStatus`, not the raw key `pending`. |
| Accept / Reject | Only while status is `pending`. The update returns a row. `job_offers.status` becomes `accepted` or `rejected` and `responded_at` is set. The same status is visible on the staff request file and, after the migration below, on the employer Interviews tab. A candidate cannot change the salary. |
| Support form | A ticket is stored and listed. |
| Log out | Returns to the candidate sign-in screen. |

### Employer (`/employer-login`, then `/employer`)

| Control | Expected |
| --- | --- |
| Register | Company name, contact, email, phone, and country are stored on the linked `employers` row. |
| First visit, Requests | No sample labour request. The empty line is `empNoDemands`. |
| Demand form | Sector, position, headcount, city, salary, lodging, and meals follow S07. A successful insert is the only row in the list. |
| Interviews with no rows | `empNoInterviews`. Offers for this employer are listed on the same tab with a translated status after the offer-select policy is applied. |
| Candidates, Selected, Support | Filters and the interview request behave as in S08. Support creates a ticket. |
| Company profile, company name | The field is editable. Save writes `employers.company_name` and copies the new name onto that employer’s `job_requests.employer_name`. The header shows the saved name after reload. |
| Language, home, log out | Labels follow the selected language. Home goes to `/`. Log out goes to `/employer-login`. |

### Staff (`/portal`)

Sign in once as each role. Tabs come from `tabsForStaffRole`.

| Role | Tabs | Files |
| --- | --- | --- |
| upper_management | Overview, Candidates, Requests, Staff, Tasks, Audit, Employers, Support | Candidate, request, and employer files |
| source_country | Candidates, Requests, Tasks | Candidate and request files. The employer file shows `routeDenied`. |
| target_country | Candidates, Requests, Tasks, Employers | All three files |
| field_officer | Overview, Candidates, Tasks, Support | Candidate file only. Request and employer files show `routeDenied`. |
| finance / limited | Overview, Tasks | No files |

| Control | Expected |
| --- | --- |
| Employers list | The company name and the file button open `/portal/employers/{that row's id}`. The heading is that company. |
| View employer portal | Opens `/employer?as={that id}` and loads that employer. Saving the company name updates that row. |
| Employer file, company name | `company_name` is on the form. Save persists it and updates linked request names. |
| Export on Candidates, Requests, Employers | CSV, Excel, and Print/PDF use the rows on screen. Offers export on Requests downloads `job_offers` the session can read. A hidden tab has no export button. |
| Delete (upper management only) | Candidates, employers, requests, and documents show Delete. The dialog names the record, notes a demo record when `is_demo` is true, and does nothing until confirm. Officers do not see Delete. Do not confirm a delete on live data during this pass. |
| Candidate file | The header shows the localized nationality. |
| Offer panel currency | A new offer stores `offer_terms.currency`. The candidate card shows that code. |
| Staff invite, tasks, audit, support | Invite stays upper management only. Tasks still filter by role. Audit and support list their rows. |

Apply after review, not before: `supabase/migrations/20261109154616_phase2_offers_and_deletes.sql`. It lets a candidate update only a pending offer’s status, lets the employer read their offers, and limits delete to upper management. Demo cleanup SQL, also not applied: `supabase/scripts/delete_demo_records.sql`.

## Employer login invitation

**Role:** Upper management, or a target-country officer whose `scope_country` matches the employer. Apply `supabase/migrations/20261110140000_employer_login_invite.sql` by hand first. Do not apply it from CI.

**Record:** `TEST İşveren A.Ş.`, id `7c0e1000-2026-1110-0001-000000000001`, contact `huseyinaksu+isveren2@gmail.com`. The row has no auth user until this invitation.

1. Open `/portal/employers/7c0e1000-2026-1110-0001-000000000001`. The card **Giriş daveti gönder** is enabled. Clear the email, save, and the button is disabled with the missing-email hint. Put the address back and save.
2. Send the invitation. The status shows the invite time. The mailbox receives one Panova card in the employer locale (Turkish when `locale` is empty). The button opens `/auth/reset-password/employer`.
3. Set a password. The next screen asks for the KVKK notice if `kvkk_accepted_at` is empty, then opens `/employer` for this company (`employers.auth_user_id` and `profiles.linked_employer_id`, `profiles.role = employer`).
4. Sign out. On `/employer-login`, **Forgot password** for that address now sends a reset. Google with the same address also reaches this employer when automatic linking is on.
5. On the employer file the status is **Hesap bağlı**. **Şifre bağlantısı gönder** sends another link. A second click inside two minutes shows the cooldown.
6. A source-country or field officer does not see the button. A target-country officer whose scope is a different country does not see it, and `POST /api/employer-invite` returns `forbidden`.
7. Point a different employer at a staff email and send. The page shows the staff-account error and that profile stays `role = staff`.

