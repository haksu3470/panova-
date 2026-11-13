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

**Mülakata Katıl / Join interview:** On the employer Interviews tab, an interview with no `meeting_url` shows the “link pending” text (`meetingLinkPending`) and no join button. With a link, **Mülakata Katıl** opens it in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Only upper management and target-country staff can add or change the link (`canEditMeetingUrl`; the trigger `interviews_guard_meeting_url` refuses everyone else). Only `http`/`https` links are accepted.

**Bilinen engel / Known blocker:** Employer “select” does not use this match result. See S08. Candidate accept/reject needs migration `20261109154616_phase2_offers_and_deletes.sql` on the hosted database. Until it is applied, the update matches no row and the candidate sees `offerUpdateFailed`.

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

