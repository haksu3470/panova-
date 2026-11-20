# Personel MFA (TOTP)

Staff portal uses Supabase Auth TOTP. Flag: `app_settings.staff_mfa_required`.

| Mode | Behaviour |
| --- | --- |
| Org `staff_mfa_required = true` | Every staff session must enroll (if needed) and reach `aal2` |
| Org `false` + person `staff_members.mfa_required = true` | Only that person is forced to MFA |
| Both false | Optional panel on Overview; leftover enrolled factors do not block login |

Gate RPC: `current_staff_mfa_required()` = org flag **OR** the signed-in staff row’s `mfa_required`.

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
