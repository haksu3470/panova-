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

In-app how-to ids (`GUIDE_CATALOG` in `lib/guides-model.ts`): `staff-login`, `staff-invite`, `dossier-review`, `matching-offers`, `employer-request`, `employer-browse`, `candidate-register`.

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

1. Open `/portal`. The sign-in field is an email (`type="email"`), labeled as username and email.
2. Sign in with password, or Google, using the invited address.
3. If the mailbox is not confirmed, the verify screen opens (`EmailVerifyNotice`). Paste the numeric code (6–10 digits) or the confirm URL, or use the link in the message. Resend waits 30 seconds.
4. Sign out from the portal header, then sign in again with an address that was never invited.

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

**Bilinen engel / Known blocker:** Signup metadata stores `nationality: 'Belirtilmedi'` regardless of the UI language (`app/candidate/page.tsx`). Delivery of the code depends on the Supabase confirm-signup template (`supabase/templates/confirmation.html`); the numeric field needs `{{ .Token }}`.

In-app guide: `candidate-register`.

## S04. Aday profil düzenleme / Candidate profile edit

**Rol / Role:** Signed-in candidate.

**Önkoşul / Preconditions:** S03 completed. The candidate row is linked to this auth user.

**Adımlar / Steps:**

1. Open **Profile**.
2. Change name, passport, phone, email, profession, sector, photo, and emergency contact. Clear one required registration field and try to save.
3. Save a valid profile. Reload the page.
4. Open **Documents** and upload into a slot. Open **Offers** and **Support**.

**Beklenen / Expected:** Blank registration fields are rejected before the write (`candidateIdentityPayload`). A successful save returns the same row (`assertCandidatePersisted`). Passport is stored uppercased and email lowercased. The candidate does not get inputs for YouTube URLs; videos render only when a supervisor has saved them (`CandidateYouTube`). Duplicate phone, passport, or email shows the matching profile error.

**Bilinen engel / Known blocker:** If `documents_json` is empty, the first profile save writes five document names in Turkish (`Pasaport Taraması`, and the other four defaults in `handleUpdateProfile`). Emergency and support placeholders are Turkish (`Örn: Md Samad Bepary`, `Örn: Belge Güncellemesi Hakkında`, `Sorununuzu detaylı yazın...`). Offer and support failures alert `Hata:` plus the raw message. Changing the auth email is not part of this save.

In-app guide: `candidate-register` (profile and documents steps).

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

**Bilinen engel / Known blocker:** Employer “select” does not use this match result. See S08. The employer Interviews “join” control only raises an alert (`ui.joiningCall`); it does not open a meeting. This repo’s migrations do not define a `job_offers` policy for the candidate update, so accept/reject can fail with a database error until that policy exists in the hosted database. The candidate alert for that failure is the Turkish prefix `Hata:`.

In-app guide: `matching-offers`.

## S07. İşveren işgücü talebi (konaklama ve yemek) / Employer labor request (lodging and meals)

**Rol / Role:** Linked employer.

**Önkoşul / Preconditions:** Sign-in at `/employer-login` completed and `link_my_employer` returned an id. Confirmed email.

**Adımlar / Steps:**

1. Open **Requests** on `/employer`.
2. Choose a sector (agriculture, construction, or trade), one or more positions, headcount, city, salary text, duration, experience, and language.
3. Leave accommodation and meals on the placeholder and submit. Then set only one of them and submit. Then set both to Yes or No, with a salary such as `1200 EUR`, and submit.
4. Open the new row on the staff **Requests** tab and on `/portal/requests/[id]`. Try to clear accommodation or meals and save.

**Beklenen / Expected:** The employer form does not insert until both answers and a positive salary are present (`buildEmployerDemandInsert`). Messages are `lodgingRequired`, `mealsRequired`, `lodgingAndMealsRequired`, or `salaryAmountRequired` in the active language. The stored columns are `accommodation_provided` and `food_provided` (booleans, not null). Staff see the same yes/no wording. The staff file also refuses a save that clears either answer.

**Bilinen engel / Known blocker:** An employer with zero rows does not see an empty state. `fetchEmployerData` substitutes two sample demands (construction in Skopje, agriculture in Struga) that are not database rows. After a real insert, those samples disappear. `app/employer/components/DemandForm.tsx` is not mounted. Its “video interview required” checkbox is not on the live form and is not written by `buildEmployerDemandInsert`.

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

**Beklenen / Expected:** Signed out: title, body, and three links (`/portal`, `/employer-login`, `/candidate`). Unconfirmed: the verify card, no articles. Unlinked: the unlinked card, no articles. A linked user sees the usage map and the how-tos for that audience. Upper management sees `staff-invite`. Other staff do not. The upper-management card’s Staff screen tells other staff that only upper management can see that tab. Employers see `employer-request` and `employer-browse`, not dossier or staff invite. Candidates see `candidate-register` only. Back returns to `/portal`, `/employer`, `/candidate`, or `/` for a signed-out viewer. Switching language reloads `guidesCopy` for that locale. Screen paths in the map point at `app/.../page.tsx` files.

**Bilinen engel / Known blocker:** The guides page has no logout control. Sign out from the portal you came from (S11). There is no how-to for logout, forgot password, or the OTP field. `finance` and `limited` are not guide roles; a staff row with one of those `role_level` values is labeled with the generic staff name (`resolvePortalViewer`).

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

## S13. Bölge sorumlusu yönlendirme kodu / Region supervisor referral code

**Rol / Role:** `source_country` and `target_country` supervisors, then `upper_management`. Repeat once as `field_officer` and once as a self-registered candidate.

**Önkoşul / Preconditions:** Migration `20261104193000_supervisor_referral_codes.sql` is applied. Each supervisor row has `staff_members.referral_code` (`PV` plus 6 letters). Field officers, finance, and limited staff do not. A candidate account is not a staff member.

**Adımlar / Steps:**

1. Sign in as a source-country or target-country supervisor at `/portal`. Read the code in the header badge and copy it.
2. Open **Candidates**, register a candidate (name, nationality, phone, profession, sector). Leave email empty or use a new one.
3. Sign in as upper management. On **Candidates**, set the code filter to that supervisor’s code, then to **No code / open registration**.
4. As upper management, register one candidate with a supervisor code selected and one with the open-registration option.
5. On a no-code row, use **Delete open registration**. Open a coded row and confirm that button is absent. Try the same delete as the supervisor.
6. Register a candidate at `/candidate` (self-signup) and, as a field officer, from **Candidates** or `/supplier`.
7. Open the candidate file `/portal/candidates/[id]` and switch the language (TR, GB, MK, AL, SA).

**Beklenen / Expected:** The supervisor’s new candidate stores that supervisor’s code even if the request names a different code. Self-registration, field-officer registration, and `/supplier` used by anyone who is not a region supervisor stay null. Upper management can filter by a code and by no code. The list and the dossier show the code or an empty / open-registration label. Only upper management can delete a null-code candidate; coded rows and supervisor sessions cannot. Copy is available in TR, EN, SQ, AR, and MK. Arabic keeps `dir="rtl"`.

**Bilinen engel / Known blocker:** The database is the control. The Candidates screen does not send a supervisor’s own code; the insert trigger writes it. `/supplier` is still not linked from the portal navigation. Deleting a no-code candidate is a hard delete (related rows cascade; the profile link is set null). There is no in-app guide article for this flow.

Automated: `lib/referralCode.test.ts`.

---

## Boşluk analizi / Gap analysis

Only items checked in this repository. Hosted database policies that were never committed here are called out as absent from the migrations, not as a measured production failure.

### Empty states that show sample rows

- Employer with no `job_requests` sees two hard-coded demands in `app/employer/page.tsx` (`demoConstruction`, `demoAgriculture`). They are not `is_demo` rows and they are not in the database.
- Employer with no `interviews` sees two hard-coded appointments in the same function, so the empty copy `empNoInterviews` does not appear.
- Staff with no `tasks` rows sees two local tasks assigned to named people (`app/portal/page.tsx`). The titles are dictionary keys (`taskPassportCheck`, `taskSaveDemand`) and do translate, but the rows are not stored.
- The candidate browser, YouTube block, document-status panel, and guides gate do have real empty copy.

### Validation and authorization the UI does not finish

- Employer select ignores the update error and alerts success (`handleSelectCandidate`). **Selected** is derived from `status === 'approved' || status === 'selected'` on the browse rows. `is_selected` is written but not read back.
- Employer interview join is an alert, not a call.
- If `employer_browse_candidates` is missing, the employer page queries `job_candidates` with no employer predicate. The RPC itself returns only matched, non-archived candidates and omits passport, phone, and email.
- This repo’s `job_candidates` policies in `supabase/migrations/20261026240000_email_proof_gate.sql` allow a candidate to update only their own row. No employer update policy is added. Candidate accept/reject on `job_offers` has no policy in these migrations.
- `DemandForm.tsx` (video-required checkbox) and `EmployerHeader.tsx` are unused. The live demand form does not store a video-required flag.
- `invite_staff` allows `finance` and `limited`. The Staff form, task-option groups, video permission, and guide role ids do not. Those two roles would get no task groups in `TasksTab` and the generic staff label on `/guides`.
- The task dropdown is filtered by role (source, target, field, upper management). The guide says staff share the same tabs, which is true for the tab bar, and does not mention this filter.

### i18n that is still one language

Guide copy, portal dictionary, and the labor-request errors exist in TR, EN, SQ, AR, and MK. These strings do not:

- Staff invite email HTML and the JSON errors in `app/api/staff-invite/route.ts`.
- The audit text `Personel Davet Edildi:`.
- Candidate support and emergency placeholders, the five default document names written into `documents_json`, and alerts prefixed with `Hata:`.
- Candidate signup metadata `nationality: 'Belirtilmedi'`.

### Product UI with no guide article

Logout (S11), forgot password (S12), and the OTP/paste field on `EmailVerifyNotice` are implemented. `GUIDE_CATALOG` has no id for them.

### Screens that are not the portal map

- `/admin` is behind `AuthGuard` role `staff`. The page title comes from `homeCopy.admin.title` (“Admin hub”). The employers, demands, candidates, and tasks on that page are `useState` samples. It does not read Supabase. No navigation link points at `/admin`.
- `/supplier` is behind `StaffGate` and inserts a `job_candidates` row. No navigation link points at `/supplier`. A region supervisor’s insert is stamped with their referral code; other staff leave the code null.
- The public home page section `#nasil-calisir` is marketing copy, not the guides hub.

### What is already guarded

These are not gaps; they are here so a later pass does not re-file them:

- Lodging and meals must be boolean on new employer demands, in the client and on `job_requests` (not null, no default).
- YouTube preview uses the video id only. Supervisors in upper management, source country, and target country may write. The database trigger blocks everyone else.
- `/guides` hides articles until the session is confirmed and linked, then filters cards and how-tos with `audienceAllows`.
- Employer interview creation goes through `employer_request_interview`, which requires a match on that employer’s request.
- Region supervisors (`source_country`, `target_country`) each have one `referral_code`. Their candidate inserts are stamped with it. Self-registration stays null. Only a portal manager can delete a candidate, and only when `referral_code` is null.
