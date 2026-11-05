-- Noticing journal, editable check-in reflections and configurable daily invitations.
-- Apply after 20261105_adaptive_coaching.sql. Existing check-in notes are preserved.
alter table public.coaching_preferences
  drop constraint if exists coaching_preferences_max_daily_invites_check;
alter table public.coaching_preferences
  add constraint coaching_preferences_max_daily_invites_check
  check (max_daily_invites between 0 and 24);

alter table public.wellness_checkins
  drop constraint if exists wellness_checkins_thought_detail_check;
alter table public.wellness_checkins
  add constraint wellness_checkins_thought_detail_check
  check (char_length(thought_detail) <= 12000);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null default 'Untitled thought'
    check (char_length(title) between 1 and 160),
  body text not null default ''
    check (char_length(body) <= 12000),
  status text not null default 'saved'
    check (status in ('draft','saved')),
  origin text not null default 'journal'
    check (origin in ('journal','checkin_draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_month
  on public.journal_entries (user_id, entry_date desc, updated_at desc);
alter table public.journal_entries enable row level security;

-- Repeatable migration. Owner can manage entries but never read another user's.
drop policy if exists "journal owner selects" on public.journal_entries;
drop policy if exists "journal owner inserts" on public.journal_entries;
drop policy if exists "journal owner updates" on public.journal_entries;
drop policy if exists "journal owner deletes" on public.journal_entries;
create policy "journal owner selects" on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "journal owner inserts" on public.journal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "journal owner updates" on public.journal_entries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "journal owner deletes" on public.journal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Existing wellness_checkins.thought_detail stays where it is. The journal
-- combines those records with journal_entries; no copying or duplication.
