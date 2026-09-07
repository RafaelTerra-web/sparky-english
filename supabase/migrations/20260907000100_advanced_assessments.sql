-- Server-verified Google identity, not a client Supabase Auth session.
-- Apply after both existing migrations. No browser role may read answer keys,
-- assessment evidence, transcripts or private certificate identities.
begin;

create table if not exists public.sparky_rubrics (
  version text primary key,
  specification jsonb not null check (jsonb_typeof(specification) = 'object'),
  status text not null default 'beta' check (status in ('beta', 'reviewed', 'retired')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sparky_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  request_key uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  assessment_id text not null,
  version text not null references public.sparky_rubrics(version),
  level text not null check (level in ('B2', 'C1', 'C2')),
  kind text not null check (kind in ('diagnostic', 'mock', 'checkpoint')),
  status text not null default 'in-progress' check (status in ('in-progress', 'evaluating', 'scored', 'human-review', 'unavailable', 'abandoned')),
  result jsonb,
  consent_version text,
  consented_at timestamptz,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  unique (account_key, request_key),
  check (expires_at > started_at)
);
create index if not exists sparky_attempts_account on public.sparky_assessment_attempts(account_key, started_at desc);

create table if not exists public.sparky_assessment_answers (
  attempt_id uuid not null references public.sparky_assessment_attempts(id) on delete cascade,
  item_id text not null,
  skill text not null check (skill in ('reading', 'use-of-english', 'listening', 'writing', 'speaking', 'mediation')),
  response jsonb not null,
  submitted_at timestamptz not null default now(),
  primary key (attempt_id, item_id)
);

create table if not exists public.sparky_assessment_ratings (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.sparky_assessment_attempts(id) on delete cascade,
  item_id text not null,
  rater text not null check (rater in ('astra-1', 'astra-2', 'audio-evidence', 'human')),
  model text not null,
  rubric_version text not null references public.sparky_rubrics(version),
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, item_id, rater)
);

create table if not exists public.sparky_assessment_reviews (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.sparky_assessment_attempts(id) on delete cascade,
  item_id text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  reviewer_account_key text check (reviewer_account_key ~ '^[a-f0-9]{64}$'),
  decision jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (attempt_id, item_id),
  check (status <> 'resolved' or (reviewer_account_key is not null and decision is not null and resolved_at is not null))
);

create table if not exists public.sparky_certificates (
  id uuid primary key default gen_random_uuid(),
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  attempt_id uuid not null unique references public.sparky_assessment_attempts(id),
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{43}$'),
  display_name text not null check (length(display_name) between 1 and 120),
  level text not null check (level in ('B2', 'C1', 'C2')),
  version text not null references public.sparky_rubrics(version),
  skill_profile jsonb not null check (jsonb_typeof(skill_profile) = 'object'),
  public_consent_at timestamptz not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists sparky_certificates_account on public.sparky_certificates(account_key, issued_at desc);

-- The payload is immutable; revocation is a one-way timestamp, never deletion.
create or replace function public.sparky_certificate_immutable() returns trigger language plpgsql
set search_path = '' as $$
begin
  if (to_jsonb(new) - 'revoked_at') is distinct from (to_jsonb(old) - 'revoked_at')
     or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at) then
    raise exception 'certificate-immutable';
  end if;
  return new;
end;
$$;
create trigger sparky_certificate_immutable before update on public.sparky_certificates
for each row execute function public.sparky_certificate_immutable();

create table if not exists public.sparky_personal_work (
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  work_id text not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (account_key, work_id)
);

-- Shared counter across Vercel instances; window and limit are server-owned.
create table if not exists public.sparky_rate_windows (
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  action text not null,
  window_start timestamptz not null,
  used integer not null check (used > 0),
  primary key (account_key, action, window_start)
);
create or replace function public.sparky_take_assessment_slot(p_account text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_used integer;
begin
  insert into public.sparky_rate_windows(account_key, action, window_start, used)
  values (p_account, 'assessment', date_trunc('hour', now()), 1)
  on conflict (account_key, action, window_start) do update
    set used = public.sparky_rate_windows.used + 1
    where public.sparky_rate_windows.used < 6
  returning used into current_used;
  return current_used is not null;
end;
$$;

alter table public.sparky_rubrics enable row level security;
alter table public.sparky_assessment_attempts enable row level security;
alter table public.sparky_assessment_answers enable row level security;
alter table public.sparky_assessment_ratings enable row level security;
alter table public.sparky_assessment_reviews enable row level security;
alter table public.sparky_certificates enable row level security;
alter table public.sparky_personal_work enable row level security;
alter table public.sparky_rate_windows enable row level security;

revoke all on public.sparky_rubrics, public.sparky_assessment_attempts, public.sparky_assessment_answers,
  public.sparky_assessment_ratings, public.sparky_assessment_reviews, public.sparky_certificates,
  public.sparky_personal_work, public.sparky_rate_windows from public, anon, authenticated;
grant select, insert, update on public.sparky_rubrics, public.sparky_assessment_attempts, public.sparky_assessment_answers,
  public.sparky_assessment_ratings, public.sparky_assessment_reviews, public.sparky_certificates,
  public.sparky_personal_work, public.sparky_rate_windows to service_role;
revoke all on function public.sparky_take_assessment_slot(text) from public, anon, authenticated;
grant execute on function public.sparky_take_assessment_slot(text) to service_role;
revoke all on function public.sparky_certificate_immutable() from public, anon, authenticated;

-- Audio is processed in request memory and is not uploaded to Storage. This
-- deliberately creates no public bucket or durable audio-retention permission.
commit;
