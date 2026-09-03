create extension if not exists pgcrypto;

create type public.sparky_role as enum ('owner', 'editor', 'learner');
create type public.lesson_step_kind as enum ('teach', 'example', 'dialogue', 'choice', 'complete_sentence', 'order_words', 'match', 'summary');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  level text not null default 'A1' check (level in ('A1', 'A2', 'B1')),
  role public.sparky_role not null default 'learner',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.courses (
  id text primary key,
  title text not null,
  description text not null default '',
  level text not null check (level in ('A1', 'A2', 'B1')),
  published boolean not null default false,
  sort_order integer not null default 0
);

create table public.modules (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  published boolean not null default false
);

create table public.lessons (
  id text primary key,
  module_id text not null references public.modules(id) on delete cascade,
  title text not null,
  estimated_minutes smallint not null default 4 check (estimated_minutes between 1 and 30),
  sort_order integer not null default 0,
  published boolean not null default false
);

create table public.lesson_steps (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  kind public.lesson_step_kind not null,
  title text not null,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons(id) on delete cascade,
  title text not null,
  published boolean not null default false
);

create table public.exercise_items (
  id uuid primary key default gen_random_uuid(),
  exercise_set_id uuid not null references public.exercise_sets(id) on delete cascade,
  kind public.lesson_step_kind not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer jsonb not null,
  explanation text not null default '',
  sort_order integer not null default 0
);

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_item_id uuid not null references public.exercise_items(id) on delete cascade,
  selected_answer jsonb not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_step_id text not null references public.lesson_steps(id) on delete cascade,
  due_at timestamptz not null default now(),
  interval_days numeric not null default 1,
  ease numeric not null default 2.5,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  unique (user_id, lesson_step_id)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.mascot_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null check (state in ('welcome', 'explain', 'thinking', 'encourage', 'celebrate', 'review')),
  context text not null default '',
  shown_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_steps enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.exercise_items enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.review_items enable row level security;
alter table public.study_sessions enable row level security;
alter table public.xp_events enable row level security;
alter table public.mascot_events enable row level security;

create policy "users read their profile" on public.profiles for select using (auth.uid() = id);
create policy "users update their profile" on public.profiles for update using (auth.uid() = id);
create policy "learners read published courses" on public.courses for select using (published = true or exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'editor')));
create policy "learners read published modules" on public.modules for select using (published = true or exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'editor')));
create policy "learners read published lessons" on public.lessons for select using (published = true or exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'editor')));
create policy "learners read lesson steps" on public.lesson_steps for select using (exists (select 1 from public.lessons where id = lesson_id and (published = true or exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'editor')))));
create policy "users manage own attempts" on public.exercise_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own reviews" on public.review_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own sessions" on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own xp" on public.xp_events for select using (auth.uid() = user_id);
create policy "users read own mascot events" on public.mascot_events for select using (auth.uid() = user_id);

create index review_items_due_idx on public.review_items (user_id, due_at);
create index exercise_attempts_user_idx on public.exercise_attempts (user_id, created_at desc);
