-- Require staff TOTP MFA. Portal + StaffGate block until enroll/aal2.
-- Upper management can set app_settings.staff_mfa_required back to false.

update public.app_settings
set value = 'true'::jsonb,
    updated_at = now()
where key = 'staff_mfa_required';

insert into public.app_settings (key, value)
select 'staff_mfa_required', 'true'::jsonb
where not exists (
  select 1 from public.app_settings where key = 'staff_mfa_required'
);
