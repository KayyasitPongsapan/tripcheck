-- ════════════════════════════════════════════════════════════
--  TripCheck — UPDATE: add the "abroad" feature
--  Run this once in Supabase → SQL Editor → New query → Run
--  (Safe to run even if you've already added it — it won't duplicate.)
-- ════════════════════════════════════════════════════════════

create table if not exists abroad (
  group_id   text not null,
  name       text not null,
  year       int  not null,
  dates      jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (group_id, name, year)
);

alter table abroad enable row level security;

drop policy if exists "open abroad" on abroad;
create policy "open abroad" on abroad for all using (true) with check (true);
