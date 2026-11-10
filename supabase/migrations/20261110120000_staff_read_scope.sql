-- Staff reads follow the role, not a single is_staff() gate.
-- upper_management (is_portal_manager) still reads every operational row.
-- source_country reads candidates with their referral code or scope_country
--   (matched on nationality). They still read demands, because matching is
--   their screen, and they do not read employers.
-- target_country reads employers and demands in scope_country, and the
--   candidates already matched to those demands.
-- field_officer reads candidates linked to a task they own or back up,
--   or assigned to their staff id.
-- finance / limited read neither candidates, employers, nor demands.
-- A null scope_country does not open a country. Set it on the staff row.
-- Do not apply this file from CI. Review it, then run it by hand.

alter table public.staff_members
  add column if not exists scope_country text;

comment on column public.staff_members.scope_country is
  'English country name (employers.country / job_candidates.nationality). Required before a target-country officer can read employers or demands, and used with the referral code for source-country officers.';

create or replace function public.country_key(p_value text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(p_value, '')))
    when '' then null
    when 'turkey' then 'turkey'
    when 'türkiye' then 'turkey'
    when 'turkiye' then 'turkey'
    when 'tr' then 'turkey'
    when 'north macedonia' then 'north macedonia'
    when 'macedonia' then 'north macedonia'
    when 'kuzey makedonya' then 'north macedonia'
    when 'mk' then 'north macedonia'
    when 'bangladesh' then 'bangladesh'
    when 'bangladeş' then 'bangladesh'
    when 'banglades' then 'bangladesh'
    when 'bd' then 'bangladesh'
    else lower(btrim(p_value))
  end;
$$;

create or replace function public.names_match(p_left text, p_right text)
returns boolean
language sql
immutable
as $$
  select nullif(lower(btrim(coalesce(p_left, ''))), '') is not null
     and lower(btrim(p_left)) = lower(btrim(coalesce(p_right, '')));
$$;

create or replace function public.current_staff()
returns table (
  staff_id uuid,
  role_level text,
  referral_code text,
  scope_country text,
  staff_name text,
  staff_email text
)
language sql
stable
security definer
set search_path to ''
as $$
  select s.id,
         coalesce(s.role_level, p.staff_role),
         s.referral_code,
         s.scope_country,
         coalesce(s.name, p.full_name),
         lower(s.email)
  from public.profiles p
  left join public.staff_members s
    on s.auth_user_id = p.id
    or s.id = p.linked_staff_id
  where p.id = auth.uid()
    and p.role = 'staff'
    and public.email_access_ok()
  order by case when s.auth_user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

create or replace function public.staff_can_read_candidate(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or exists (
      select 1
      from public.current_staff() me
      join public.job_candidates c on c.id = p_id
      where me.role_level = 'source_country'
        and (
          (me.referral_code is not null and c.referral_code = me.referral_code)
          or (
            public.country_key(me.scope_country) is not null
            and public.country_key(c.nationality) = public.country_key(me.scope_country)
          )
        )
    )
    or exists (
      select 1
      from public.current_staff() me
      where me.role_level = 'target_country'
        and public.country_key(me.scope_country) is not null
        and exists (
          select 1
          from public.request_matches m
          join public.job_requests r on r.id = m.request_id
          left join public.employers e on e.id = r.employer_id
          where m.candidate_id = p_id
            and (
              public.country_key(r.country) = public.country_key(me.scope_country)
              or public.country_key(e.country) = public.country_key(me.scope_country)
            )
        )
    )
    or exists (
      select 1
      from public.current_staff() me
      join public.job_candidates c on c.id = p_id
      where me.role_level = 'field_officer'
        and (
          c.assigned_to = me.staff_id
          or c.assigned_backup = me.staff_id
          or exists (
            select 1
            from public.tasks t
            where (
                public.names_match(t.assignee, me.staff_name)
                or public.names_match(t.backup_assignee, me.staff_name)
                or public.names_match(t.assignee, me.staff_email)
                or public.names_match(t.backup_assignee, me.staff_email)
              )
              and (
                (t.related_entity_type in ('candidate', 'job_candidate') and t.related_entity_id = p_id)
                or (
                  t.related_entity_type in ('request', 'job_request')
                  and exists (
                    select 1 from public.request_matches m
                    where m.request_id = t.related_entity_id and m.candidate_id = p_id
                  )
                )
              )
          )
        )
    );
$$;

create or replace function public.staff_can_read_employer(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or exists (
      select 1
      from public.current_staff() me
      join public.employers e on e.id = p_id
      where me.role_level = 'target_country'
        and public.country_key(me.scope_country) is not null
        and public.country_key(e.country) = public.country_key(me.scope_country)
    );
$$;

create or replace function public.staff_can_read_request(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or exists (
      select 1 from public.current_staff() me
      where me.role_level = 'source_country'
    )
    or exists (
      select 1
      from public.current_staff() me
      join public.job_requests r on r.id = p_id
      left join public.employers e on e.id = r.employer_id
      where me.role_level = 'target_country'
        and public.country_key(me.scope_country) is not null
        and (
          public.country_key(r.country) = public.country_key(me.scope_country)
          or public.country_key(e.country) = public.country_key(me.scope_country)
        )
    );
$$;

create or replace function public.staff_can_insert_candidate()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or exists (
      select 1 from public.current_staff() me
      where me.role_level = 'source_country'
    );
$$;

create or replace function public.task_visible_to_me(p_assignee text, p_backup text, p_created_by uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or p_created_by = auth.uid()
    or exists (
      select 1 from public.current_staff() me
      where public.names_match(p_assignee, me.staff_name)
         or public.names_match(p_backup, me.staff_name)
         or public.names_match(p_assignee, me.staff_email)
         or public.names_match(p_backup, me.staff_email)
    );
$$;

revoke all on function public.country_key(text) from public, anon;
revoke all on function public.names_match(text, text) from public, anon;
revoke all on function public.current_staff() from public, anon;
revoke all on function public.staff_can_read_candidate(uuid) from public, anon;
revoke all on function public.staff_can_read_employer(uuid) from public, anon;
revoke all on function public.staff_can_read_request(uuid) from public, anon;
revoke all on function public.staff_can_insert_candidate() from public, anon;
revoke all on function public.task_visible_to_me(text, text, uuid) from public, anon;

grant execute on function public.country_key(text) to authenticated;
grant execute on function public.names_match(text, text) to authenticated;
grant execute on function public.current_staff() to authenticated;
grant execute on function public.staff_can_read_candidate(uuid) to authenticated;
grant execute on function public.staff_can_read_employer(uuid) to authenticated;
grant execute on function public.staff_can_read_request(uuid) to authenticated;
grant execute on function public.staff_can_insert_candidate() to authenticated;
grant execute on function public.task_visible_to_me(text, text, uuid) to authenticated;

-- Candidates
drop policy if exists staff_select_candidates on public.job_candidates;
drop policy if exists staff_insert_candidates on public.job_candidates;
drop policy if exists staff_update_candidates on public.job_candidates;
create policy staff_select_candidates on public.job_candidates
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(id));
create policy staff_insert_candidates on public.job_candidates
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_insert_candidate());
create policy staff_update_candidates on public.job_candidates
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(id))
  with check (public.is_staff() and public.staff_can_read_candidate(id));

-- Employers: target country and upper management. Source and field do not.
drop policy if exists staff_select_employers on public.employers;
drop policy if exists staff_insert_employers on public.employers;
drop policy if exists staff_update_employers on public.employers;
create policy staff_select_employers on public.employers
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_employer(id));
create policy staff_insert_employers on public.employers
  for insert to authenticated
  with check (public.is_staff() and public.is_portal_manager());
create policy staff_update_employers on public.employers
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_employer(id))
  with check (
    public.is_staff()
    and (
      public.is_portal_manager()
      or exists (
        select 1 from public.current_staff() me
        where me.role_level = 'target_country'
          and public.country_key(me.scope_country) is not null
          and public.country_key(country) = public.country_key(me.scope_country)
      )
    )
  );

-- Demands: source country (matching) and the target country of the demand.
drop policy if exists staff_select_requests on public.job_requests;
drop policy if exists staff_insert_requests on public.job_requests;
drop policy if exists staff_update_requests on public.job_requests;
create policy staff_select_requests on public.job_requests
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_request(id));
create policy staff_insert_requests on public.job_requests
  for insert to authenticated
  with check (
    public.is_staff()
    and (
      public.is_portal_manager()
      or exists (select 1 from public.current_staff() me where me.role_level = 'source_country')
      or public.staff_can_read_request(id)
    )
  );
create policy staff_update_requests on public.job_requests
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_request(id))
  with check (
    public.is_staff()
    and (
      public.is_portal_manager()
      or exists (select 1 from public.current_staff() me where me.role_level = 'source_country')
      or exists (
        select 1
        from public.current_staff() me
        left join public.employers e on e.id = employer_id
        where me.role_level = 'target_country'
          and public.country_key(me.scope_country) is not null
          and (
            public.country_key(country) = public.country_key(me.scope_country)
            or public.country_key(e.country) = public.country_key(me.scope_country)
          )
      )
    )
  );

-- Documents, offers, interviews follow the candidate. A target officer reaches
-- them because the candidate is on one of their demands.
drop policy if exists staff_select_documents on public.candidate_documents;
drop policy if exists staff_insert_documents on public.candidate_documents;
drop policy if exists staff_update_documents on public.candidate_documents;
create policy staff_select_documents on public.candidate_documents
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_insert_documents on public.candidate_documents
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_update_documents on public.candidate_documents
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

drop policy if exists staff_select_offers on public.job_offers;
drop policy if exists staff_insert_offers on public.job_offers;
drop policy if exists staff_update_offers on public.job_offers;
create policy staff_select_offers on public.job_offers
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_insert_offers on public.job_offers
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_update_offers on public.job_offers
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

drop policy if exists staff_all on public.interviews;
create policy staff_select_interviews on public.interviews
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_insert_interviews on public.interviews
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_update_interviews on public.interviews
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_delete_interviews on public.interviews
  for delete to authenticated
  using (public.is_portal_manager());

drop policy if exists staff_all on public.request_matches;
create policy staff_select_matches on public.request_matches
  for select to authenticated
  using (
    public.is_staff()
    and (
      public.staff_can_read_request(request_id)
      or public.staff_can_read_candidate(candidate_id)
    )
  );
create policy staff_insert_matches on public.request_matches
  for insert to authenticated
  with check (
    public.is_staff()
    and public.staff_can_read_request(request_id)
    and public.staff_can_read_candidate(candidate_id)
  );
create policy staff_update_matches on public.request_matches
  for update to authenticated
  using (
    public.is_staff()
    and public.staff_can_read_request(request_id)
    and public.staff_can_read_candidate(candidate_id)
  )
  with check (
    public.is_staff()
    and public.staff_can_read_request(request_id)
    and public.staff_can_read_candidate(candidate_id)
  );
create policy staff_delete_matches on public.request_matches
  for delete to authenticated
  using (
    public.is_staff()
    and public.staff_can_read_request(request_id)
    and public.staff_can_read_candidate(candidate_id)
  );

drop policy if exists staff_all on public.tasks;
create policy staff_select_tasks on public.tasks
  for select to authenticated
  using (public.is_staff() and public.task_visible_to_me(assignee, backup_assignee, created_by));
create policy staff_insert_tasks on public.tasks
  for insert to authenticated
  with check (public.is_staff());
create policy staff_update_tasks on public.tasks
  for update to authenticated
  using (public.is_staff() and public.task_visible_to_me(assignee, backup_assignee, created_by))
  with check (public.is_staff() and public.task_visible_to_me(assignee, backup_assignee, created_by));
create policy staff_delete_tasks on public.tasks
  for delete to authenticated
  using (public.is_portal_manager());

drop policy if exists staff_all on public.candidate_notifications;
create policy staff_select_notifications on public.candidate_notifications
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_write_notifications on public.candidate_notifications
  for all to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

drop policy if exists staff_all on public.placement_followups;
create policy staff_select_followups on public.placement_followups
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id));
create policy staff_write_followups on public.placement_followups
  for all to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

-- Support tickets. Employer rows use employer_id. Candidate rows use candidate_id.
drop policy if exists staff_all on public.candidate_support_tickets;
create policy staff_select_tickets on public.candidate_support_tickets
  for select to authenticated
  using (
    public.is_staff()
    and (
      public.is_portal_manager()
      or (candidate_id is not null and public.staff_can_read_candidate(candidate_id))
      or (employer_id is not null and public.staff_can_read_employer(employer_id))
      or exists (
        select 1 from public.current_staff() me
        where me.role_level = 'field_officer'
          and candidate_id is not null
          and public.staff_can_read_candidate(candidate_id)
      )
    )
  );
create policy staff_insert_tickets on public.candidate_support_tickets
  for insert to authenticated
  with check (
    public.is_staff()
    and (
      public.is_portal_manager()
      or (employer_id is not null and candidate_id is null and public.staff_can_read_employer(employer_id))
      or (candidate_id is not null and public.staff_can_read_candidate(candidate_id))
    )
  );
create policy staff_update_tickets on public.candidate_support_tickets
  for update to authenticated
  using (
    public.is_staff()
    and (
      public.is_portal_manager()
      or (candidate_id is not null and public.staff_can_read_candidate(candidate_id))
      or (employer_id is not null and public.staff_can_read_employer(employer_id))
    )
  )
  with check (
    public.is_staff()
    and (
      public.is_portal_manager()
      or (candidate_id is not null and public.staff_can_read_candidate(candidate_id))
      or (employer_id is not null and public.staff_can_read_employer(employer_id))
    )
  );

drop policy if exists emp_tickets_select on public.candidate_support_tickets;
drop policy if exists emp_tickets_insert on public.candidate_support_tickets;
create policy emp_tickets_select on public.candidate_support_tickets
  for select to authenticated
  using (employer_id = public.my_employer_id() and public.email_access_ok());
create policy emp_tickets_insert on public.candidate_support_tickets
  for insert to authenticated
  with check (
    employer_id = public.my_employer_id()
    and candidate_id is null
    and public.email_access_ok()
  );

drop policy if exists audit_staff_select on public.audit_logs;
create policy audit_staff_select on public.audit_logs
  for select to authenticated
  using (public.is_portal_manager());

drop policy if exists staff_all on public.profiles;

drop policy if exists staff_all on public.staff_members;
create policy staff_select_staff on public.staff_members
  for select to authenticated
  using (public.is_staff());
create policy staff_insert_staff on public.staff_members
  for insert to authenticated
  with check (public.is_portal_manager());
create policy staff_update_staff on public.staff_members
  for update to authenticated
  using (public.is_portal_manager())
  with check (public.is_portal_manager());
create policy staff_delete_staff on public.staff_members
  for delete to authenticated
  using (public.is_portal_manager());

drop policy if exists staff_all on public.applicants;
create policy upper_applicants on public.applicants
  for all to authenticated
  using (public.is_portal_manager())
  with check (public.is_portal_manager());

drop policy if exists staff_all on public.portal_users;
create policy upper_portal_users on public.portal_users
  for all to authenticated
  using (public.is_portal_manager())
  with check (public.is_portal_manager());

drop policy if exists contact_submissions_select_staff on public.contact_submissions;
create policy contact_submissions_select_staff on public.contact_submissions
  for select to authenticated
  using (public.is_portal_manager());

-- wipe_demo_data deletes rows. The app does not call it. Keep it off the anon key.
revoke all on function public.wipe_demo_data() from public, anon, authenticated;

notify pgrst, 'reload schema';
