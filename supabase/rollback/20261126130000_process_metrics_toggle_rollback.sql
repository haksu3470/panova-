-- Rollback of 20261126130000_process_metrics_toggle.sql
-- Safe with the app code still deployed: without the function the app treats
-- the feature as on (the default).
begin;

drop function if exists public.process_metrics_enabled();
delete from public.app_settings where key = 'process_metrics_enabled';

commit;
