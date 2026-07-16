-- Project Charter — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- The whole charter (goal, tasks, RACI, people) is stored as a single JSONB
-- document per row. This keeps the app storage-agnostic: the same shape works
-- against localStorage in the browser and against this table in the cloud.

create table if not exists public.charters (
  id          uuid primary key default gen_random_uuid(),
  data        jsonb not null default '{}'::jsonb,
  owner_email text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists charters_updated_at_idx
  on public.charters (updated_at desc);

-- Row Level Security. For a quick internal MVP this policy allows anyone with
-- the anon key to read/write. Tighten this (e.g. per owner_email, or require
-- auth) before putting anything sensitive in here.
alter table public.charters enable row level security;

drop policy if exists "charters open access" on public.charters;
create policy "charters open access"
  on public.charters
  for all
  using (true)
  with check (true);
