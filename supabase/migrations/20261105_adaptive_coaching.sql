-- Noticing 2.0: private, structured coaching records.
-- Apply manually in Supabase SQL Editor before enabling coaching features.
-- All four personal tables are protected by owner-only RLS.
create extension if not exists pgcrypto;

create table if not exists public.coaching_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fluid_goal_ml integer not null default 1800 check (fluid_goal_ml between 1200 and 4000),
  fluid_restricted boolean,
  all_drinks_logged boolean not null default false,
  allow_checkin_invites boolean not null default true,
  max_daily_invites smallint not null default 2 check (max_daily_invites between 0 and 2),
  cloud_enabled boolean not null default false,
  cloud_consent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  local_date date not null,
  recorded_at timestamptz not null default now(),
  energy smallint not null check (energy between 1 and 5),
  mood smallint not null check (mood between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  thought_topic text not null check (thought_topic in
    ('work','worries','planning','relationships','enjoyment','everyday','other','prefer_not_to_say')),
  thought_detail text check (char_length(thought_detail) <= 600),
  recently_ate boolean,
  thirsty boolean,
  physical_discomfort boolean,
  overwhelmed boolean,
  thought_actionable boolean,
  rested boolean,
  created_at timestamptz not null default now(),
  unique (user_id, request_key)
);
create index if not exists wellness_checkins_user_time
  on public.wellness_checkins(user_id, recorded_at desc);

create table if not exists public.coaching_interventions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_id uuid not null unique references public.wellness_checkins(id) on delete cascade,
  action_code text not null check (action_code in
    ('eat','drink','rest','pause','small_task','movement','reflect','maintain')),
  title text not null check (char_length(title) between 1 and 160),
  benefit text not null check (char_length(benefit) between 1 and 500),
  status text not null default 'offered'
    check (status in ('offered','accepted','dismissed','reviewed')),
  follow_up_at timestamptz,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists coaching_interventions_due
  on public.coaching_interventions(user_id, status, follow_up_at)
  where follow_up_at is not null;

create table if not exists public.coaching_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intervention_id uuid not null unique references public.coaching_interventions(id) on delete cascade,
  tried boolean,
  helped boolean,
  energy_after smallint check (energy_after between 1 and 5),
  mood_after smallint check (mood_after between 1 and 5),
  note text check (char_length(note) <= 300),
  reviewed_at timestamptz not null default now()
);

-- Only server-side authenticated RPC can increment this counter.
create table if not exists public.coaching_cloud_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  requests smallint not null check (requests between 0 and 6),
  primary key (user_id, usage_date)
);

alter table public.coaching_preferences enable row level security;
alter table public.wellness_checkins enable row level security;
alter table public.coaching_interventions enable row level security;
alter table public.coaching_outcomes enable row level security;
alter table public.coaching_cloud_usage enable row level security;

create policy "owner controls preferences" on public.coaching_preferences
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner controls checkins" on public.wellness_checkins
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner controls interventions" on public.coaching_interventions
  for all to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.wellness_checkins c
      where c.id = checkin_id and c.user_id = (select auth.uid())
    )
  );
create policy "owner controls outcomes" on public.coaching_outcomes
  for all to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.coaching_interventions i
      where i.id = intervention_id and i.user_id = (select auth.uid())
    )
  );
create policy "owner reads usage" on public.coaching_cloud_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- A failing/free-quota-exhausted request still consumes one allowance,
-- preventing repeated expensive retries. Clients cannot reset counters.
create or replace function public.claim_free_coaching_cloud_request()
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_allowed boolean;
begin
  if v_user is null then return false; end if;
  select cloud_enabled and cloud_consent_at is not null
    into v_allowed from public.coaching_preferences
    where user_id = v_user;
  if coalesce(v_allowed, false) is not true then return false; end if;
  insert into public.coaching_cloud_usage(user_id, usage_date, requests)
    values (v_user, current_date, 1)
    on conflict (user_id, usage_date)
      do update set requests = public.coaching_cloud_usage.requests + 1
      where public.coaching_cloud_usage.requests < 6;
  return found;
end;
$$;
revoke all on function public.claim_free_coaching_cloud_request() from public, anon;
grant execute on function public.claim_free_coaching_cloud_request() to authenticated;
