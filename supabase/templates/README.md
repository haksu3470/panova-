# Supabase Auth email templates

Hosted project `vptcihlhkzfmwxpaituf` does not read these files. There is no push script. After this change is deployed, paste each subject and body in the dashboard, and set the OTP length. The app already sends `locale` (`tr`, `en`, `sq`, `ar`, or `mk`) in `signUp` `options.data`, which Supabase stores as `user_metadata.locale`. The templates read it as `{{ .Data.locale }}` and show one language. An account with no locale gets the short five-line fallback.

The card, logo, dashed code box, and footer come from `lib/email/layout.ts`. Logo URL: `https://panovagroup.org/logo.png`. Regenerate the HTML from that layout if the shell changes; `lib/email/layout.test.ts` fails when these files drift.

## 1. OTP length (required)

The live project has been sending an 8-digit code. The length is not in this repo and cannot be changed from application code.

Dashboard:

1. Open the project [vptcihlhkzfmwxpaituf](https://supabase.com/dashboard/project/vptcihlhkzfmwxpaituf).
2. Go to **Authentication → Sign In / Providers → Email** ([direct link](https://supabase.com/dashboard/project/vptcihlhkzfmwxpaituf/auth/providers?provider=Email)).
3. Set **OTP length** to **6**.
4. Save.

Management API, if you prefer that to the form:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/vptcihlhkzfmwxpaituf/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mailer_otp_length": 6}'
```

`mailer_otp_length` must be an integer from 6 to 10. Local CLI, only if you add `supabase/config.toml` later: `[auth.email]` `otp_length = 6`. That file is not used by the hosted project.

Send a new signup email after saving. An older 8-digit code still verifies in the app until it expires.

## 2. Paste the templates

Dashboard: **Authentication → Emails → Templates** ([direct link](https://supabase.com/dashboard/project/vptcihlhkzfmwxpaituf/auth/templates)).

For each row, replace the **subject** with the one line below and the **body** with the whole HTML file, including the comment and the `{{ $locale }}` line. Do not enable a copy button in the email. Email clients do not run JavaScript; the code is selectable text, and the site has the Paste code button.

### Confirm signup

File: `confirmation.html`

Subject (one line):

```
{{ $locale := "" }}{{ with .Data }}{{ with index . "locale" }}{{ $locale = . }}{{ end }}{{ end }}{{ if eq $locale `tr` }}Panova güvenlik kodunuz{{ else if eq $locale `en` }}Your Panova security code{{ else if eq $locale `sq` }}Kodi juaj i sigurisë Panova{{ else if eq $locale `ar` }}رمز الأمان من Panova{{ else if eq $locale `mk` }}Вашиот безбедносен код за Panova{{ else }}Panova{{ end }}
```

### Magic Link

File: `magic_link.html`

Use the **same subject** as Confirm signup. Resend of a signup message uses this template.

### Reset password

File: `recovery.html`

Subject (one line):

```
{{ $locale := "" }}{{ with .Data }}{{ with index . "locale" }}{{ $locale = . }}{{ end }}{{ end }}{{ if eq $locale `tr` }}Panova şifre yenileme{{ else if eq $locale `en` }}Reset your Panova password{{ else if eq $locale `sq` }}Rivendosni fjalëkalimin Panova{{ else if eq $locale `ar` }}إعادة تعيين كلمة مرور Panova{{ else if eq $locale `mk` }}Ресетирајте ја лозинката за Panova{{ else }}Panova{{ end }}
```

Password recovery uses the locale already stored on the account. A signed-in language change updates that value. A reset requested while signed out, for an account created before locale was saved, uses the short multilingual fallback.

Also allow these redirect URLs under **Authentication → URL Configuration** if they are not there yet:

```
https://panovagroup.org/auth/reset-password/**
http://localhost:3000/auth/reset-password/**
```

## 3. Check

Sign up once in Turkish and once in English. Each message should show the dark page, the white card, the Panova logo, one language, a 6-digit code in the dashed box, the green button, and the footer with Panova Group, panova@panovagroup.org, and panovagroup.org.
