begin;

create table public.sparky_appearance_preferences (
  account_key text primary key check (account_key ~ '^[a-f0-9]{64}$'),
  palette text not null default 'sparky' check (palette in ('sparky','beatrice','ocean','sunset','graphite')),
  mode text not null default 'system' check (mode in ('system','light','dark')),
  updated_at timestamptz not null default now()
);

alter table public.sparky_appearance_preferences enable row level security;
revoke all on public.sparky_appearance_preferences from public, anon, authenticated, service_role;
grant select, insert, update on public.sparky_appearance_preferences to service_role;

commit;
