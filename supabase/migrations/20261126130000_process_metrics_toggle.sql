-- On/off switch for the process metrics feature (20261126120000), same
-- pattern as app_settings.staff_mfa_required. Default on.
-- Off = the old screens: no metrics cards on the overview and no
-- "employment ended" box on the candidate file. The history trigger keeps
-- recording while off, so turning it back on loses nothing.
-- Upper management changes it (app_settings_update policy: is_portal_manager()).
--
-- One transaction, idempotent. Requires 20261126120000.
-- Rollback: supabase/rollback/20261126130000_process_metrics_toggle_rollback.sql

begin;

insert into public.app_settings (key, value)
values ('process_metrics_enabled', 'true'::jsonb)
on conflict (key) do nothing;

create or replace function public.process_metrics_enabled()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    (select (s.value #>> '{}')::boolean from public.app_settings s where s.key = 'process_metrics_enabled'),
    true
  );
$$;

revoke all on function public.process_metrics_enabled() from public, anon;
grant execute on function public.process_metrics_enabled() to authenticated;

commit;
