-- Candidate profile videos are YouTube links from the Panova channel
-- (panova@panovagroup.org). Region and country supervisors, and upper
-- management, may set them. Candidates and employers can read the link.
-- Employers have no SELECT policy on job_candidates, so the browse function
-- returns the video columns with the rest of the public profile.

update public.job_candidates
set
  video_url = nullif(btrim(video_url), ''),
  video_url_1 = nullif(btrim(video_url_1), ''),
  video_url_2 = nullif(btrim(video_url_2), ''),
  video_url_3 = nullif(btrim(video_url_3), '')
where video_url is not null
   or video_url_1 is not null
   or video_url_2 is not null
   or video_url_3 is not null;

alter table public.job_candidates
  drop constraint if exists job_candidates_video_url_youtube,
  drop constraint if exists job_candidates_video_url_1_youtube,
  drop constraint if exists job_candidates_video_url_2_youtube,
  drop constraint if exists job_candidates_video_url_3_youtube;

-- youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed. Null clears the field.
alter table public.job_candidates
  add constraint job_candidates_video_url_youtube
    check (video_url is null or video_url ~ '^https://(www\.|m\.)?(youtube\.com/watch\?([^#]*&)?v=|youtube\.com/shorts/|youtube\.com/embed/|youtu\.be/)[A-Za-z0-9_-]{11}([?&#/].*)?$'),
  add constraint job_candidates_video_url_1_youtube
    check (video_url_1 is null or video_url_1 ~ '^https://(www\.|m\.)?(youtube\.com/watch\?([^#]*&)?v=|youtube\.com/shorts/|youtube\.com/embed/|youtu\.be/)[A-Za-z0-9_-]{11}([?&#/].*)?$'),
  add constraint job_candidates_video_url_2_youtube
    check (video_url_2 is null or video_url_2 ~ '^https://(www\.|m\.)?(youtube\.com/watch\?([^#]*&)?v=|youtube\.com/shorts/|youtube\.com/embed/|youtu\.be/)[A-Za-z0-9_-]{11}([?&#/].*)?$'),
  add constraint job_candidates_video_url_3_youtube
    check (video_url_3 is null or video_url_3 ~ '^https://(www\.|m\.)?(youtube\.com/watch\?([^#]*&)?v=|youtube\.com/shorts/|youtube\.com/embed/|youtu\.be/)[A-Za-z0-9_-]{11}([?&#/].*)?$');

comment on column public.job_candidates.video_url is
  'Primary YouTube URL on the candidate profile. Same film as video_url_1 when staff save from the portal.';
comment on column public.job_candidates.video_url_1 is
  'YouTube slot 1 (general introduction).';
comment on column public.job_candidates.video_url_2 is
  'YouTube slot 2 (professional skill).';
comment on column public.job_candidates.video_url_3 is
  'YouTube slot 3 (field interview).';

create or replace function public.can_manage_candidate_video()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'staff'
      and p.staff_role in ('upper_management', 'source_country', 'target_country')
  );
$$;

revoke all on function public.can_manage_candidate_video() from public, anon;
grant execute on function public.can_manage_candidate_video() to authenticated;

create or replace function public.guard_candidate_youtube_video()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.video_url is not distinct from old.video_url
     and new.video_url_1 is not distinct from old.video_url_1
     and new.video_url_2 is not distinct from old.video_url_2
     and new.video_url_3 is not distinct from old.video_url_3
  then
    return new;
  end if;

  if tg_op = 'INSERT'
     and new.video_url is null
     and new.video_url_1 is null
     and new.video_url_2 is null
     and new.video_url_3 is null
  then
    return new;
  end if;

  -- Migrations and the SQL editor have no auth.uid(). API calls always do.
  if (select auth.uid()) is null then
    return new;
  end if;

  if (select public.can_manage_candidate_video()) then
    return new;
  end if;

  raise exception 'youtube_video_forbidden'
    using errcode = '42501';
end;
$$;

revoke all on function public.guard_candidate_youtube_video() from public, anon;
grant execute on function public.guard_candidate_youtube_video() to authenticated;

drop trigger if exists job_candidates_guard_youtube on public.job_candidates;
create trigger job_candidates_guard_youtube
  before insert or update on public.job_candidates
  for each row
  execute function public.guard_candidate_youtube_video();

-- Return type changes, so replace cannot alter the existing function in place.
drop function if exists public.employer_browse_candidates();

create function public.employer_browse_candidates()
returns table (
  id uuid,
  full_name text,
  profession text,
  sector text,
  nationality text,
  city text,
  experience_years integer,
  language_skills text,
  shift_suitable boolean,
  status text,
  travel_status text,
  created_at timestamptz,
  active_request_id uuid,
  video_url text,
  video_url_1 text,
  video_url_2 text,
  video_url_3 text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    picked.id,
    picked.full_name,
    picked.profession,
    picked.sector,
    picked.nationality,
    picked.city,
    picked.experience_years,
    picked.language_skills,
    picked.shift_suitable,
    picked.status,
    picked.travel_status,
    picked.created_at,
    picked.active_request_id,
    picked.video_url,
    picked.video_url_1,
    picked.video_url_2,
    picked.video_url_3
  from (
    select distinct on (c.id)
      c.id,
      c.full_name,
      c.profession,
      c.sector,
      c.nationality,
      c.city,
      c.experience_years,
      c.language_skills,
      c.shift_suitable,
      c.status,
      c.travel_status,
      c.created_at,
      m.request_id as active_request_id,
      c.video_url,
      c.video_url_1,
      c.video_url_2,
      c.video_url_3
    from public.job_candidates c
    join public.request_matches m on m.candidate_id = c.id
    join public.job_requests r on r.id = m.request_id
    where public.my_employer_id() is not null
      and r.employer_id = public.my_employer_id()
      and c.archived_at is null
    order by c.id, m.presented_at desc nulls last, m.created_at desc
  ) picked
  order by picked.created_at desc nulls last, picked.full_name;
$$;

revoke all on function public.employer_browse_candidates() from public, anon;
grant execute on function public.employer_browse_candidates() to authenticated;

notify pgrst, 'reload schema';
