-- ════════════════════════════════════════════════════════════
--  TripCheck — Supabase database setup
--  Paste this whole file into Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- Who has joined each trip group
create table if not exists members (
  group_id   text not null,
  name       text not null,
  created_at timestamptz default now(),
  primary key (group_id, name)
);

-- Each person's days off, per year (stored as a list of dates)
create table if not exists availability (
  group_id   text not null,
  name       text not null,
  year       int  not null,
  dates      jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (group_id, name, year)
);

-- Public holidays for each group, per year
create table if not exists holidays (
  group_id   text not null,
  year       int  not null,
  dates      jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (group_id, year)
);

-- Turn on Row Level Security
alter table members      enable row level security;
alter table availability enable row level security;
alter table holidays     enable row level security;

-- This is a casual, no-password app: anyone holding the secret group
-- link (and the app's public anon key) may read and write. The random
-- group code in the URL is what keeps each trip private.
create policy "open members"      on members      for all using (true) with check (true);
create policy "open availability" on availability for all using (true) with check (true);
create policy "open holidays"     on holidays     for all using (true) with check (true);
