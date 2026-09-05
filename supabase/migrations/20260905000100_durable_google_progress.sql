-- Server-only bridge for the existing verified Google identity. Does not pretend
-- the app's encrypted Google session is a Supabase Auth JWT.
create table if not exists public.sparky_account_progress (
  account_key text primary key check (length(account_key) = 64),
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.sparky_account_progress enable row level security;
revoke all on public.sparky_account_progress from anon, authenticated;
grant select, insert, update on public.sparky_account_progress to service_role;
-- Remove direct client updates to legacy role-bearing profiles and grade records.
-- This application uses server-verified Google sessions, not these client policies.
revoke update on public.profiles from anon, authenticated;
revoke insert, update, delete on public.exercise_attempts, public.review_items from anon, authenticated;
