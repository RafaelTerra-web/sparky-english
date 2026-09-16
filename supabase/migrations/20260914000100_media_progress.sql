-- Apply to a dedicated staging Supabase project first. No existing progress is changed.
create table if not exists public.sparky_media_progress (
  account_key text not null check (length(account_key) = 64),
  track_id text not null check (track_id ~ '^[a-z0-9-]+$'),
  revision bigint not null default 1 check (revision > 0),
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 16000),
  updated_at timestamptz not null default now(),
  primary key (account_key, track_id)
);
alter table public.sparky_media_progress enable row level security;
revoke all on public.sparky_media_progress from anon, authenticated;
grant select, insert, update, delete on public.sparky_media_progress to service_role;
