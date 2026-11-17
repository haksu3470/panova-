# Personel MFA (TOTP)

Staff portal uses Supabase Auth TOTP. Flag: `app_settings.staff_mfa_required`.

| Mode | Behaviour |
| --- | --- |
| `true` (current) | Every staff session must enroll (if needed) and reach `aal2` before tabs or dossier pages open |
| `false` | Optional panel on Overview; enrolled users still challenged to `aal2` |

## App surfaces

- `/portal` — blocks tab bar until MFA satisfies
- `/portal/candidates|requests|employers/*` — `StaffGate` shows the same panel

## Turn on/off (upper management)

In the portal: **Ekip & Yetkiler** → **İki adımlı doğrulama (ekip)** → **Zorunlu** / **Kapalı**.

SQL fallback:

```sql
update public.app_settings
set value = 'false'::jsonb, updated_at = now()
where key = 'staff_mfa_required';
```

Or Table Editor → `app_settings` → `staff_mfa_required` → `false`.

## Auth dashboard

Authentication → Multi-Factor → ensure TOTP enrollment / verification are enabled (default on Free).
