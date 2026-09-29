-- Service-role-only operational inbox. No answers, drafts, receipts or tokens.
begin;
create table public.sparky_notification_preferences (
  account_key text primary key check (account_key ~ '^[a-f0-9]{64}$'),
  revision bigint not null default 0,
  goal_minutes integer check (goal_minutes in (5,10,15,20)),
  goal_start_day date,
  push_enabled boolean not null default false,
  review boolean not null default true,
  resume boolean not null default true,
  daily_goal boolean not null default true,
  locale text not null default 'pt' check (locale in ('pt','en')),
  last_activity_at timestamptz,
  active_until timestamptz,
  created_at timestamptz not null default now()
);
create table public.sparky_study_activity (
  account_key text not null references public.sparky_notification_preferences on delete cascade,
  session_id uuid not null,
  lesson_id text not null check (length(lesson_id) between 1 and 80),
  review boolean not null,
  started_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  active_ms bigint not null default 0 check (active_ms between 0 and 28800000),
  sequence bigint not null default 0,
  primary key (account_key,session_id)
);
create index sparky_study_activity_recent on public.sparky_study_activity(account_key,last_activity_at desc);
create table public.sparky_notifications (
  id uuid primary key default gen_random_uuid(),
  sequence bigint generated always as identity unique,
  account_key text not null references public.sparky_notification_preferences on delete cascade,
  kind text not null check (kind in ('review','resume','daily-goal')),
  content jsonb not null check (jsonb_typeof(content)='object' and octet_length(content::text)<2048),
  destination jsonb not null check (jsonb_typeof(destination)='object' and octet_length(destination::text)<256),
  reminder_day date not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique(account_key,kind,reminder_day)
);
create index sparky_notifications_inbox on public.sparky_notifications(account_key,sequence desc);
create index sparky_notifications_expiry on public.sparky_notifications(created_at);
create table public.sparky_notification_deliveries (
  notification_id uuid not null references public.sparky_notifications(id) on delete cascade,
  device_id text not null check (device_id ~ '^push-sub-[a-f0-9]{64}$'),
  status text not null check (status in ('sending','sent','uncertain','retry','expired','failed')),
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (notification_id,device_id)
);

-- Import only existing consent. Goal/time cannot be inferred from old push rows.
insert into public.sparky_notification_preferences(account_key,push_enabled)
select distinct account_key,true from public.sparky_media_progress
where track_id like 'push-sub-%' and state->>'kind'='push-subscription-v1';

create function public.sparky_notification_init(p_account text) returns void
language plpgsql set search_path=public as $$
begin
  insert into sparky_notification_preferences(account_key,push_enabled)
  values(p_account,exists(select 1 from sparky_media_progress where account_key=p_account and track_id like 'push-sub-%'))
  on conflict do nothing;
end $$;

-- Lock also serializes event insertion, so all later committed events have a
-- greater sequence. A signed snapshot cannot consume concurrent arrivals.
create function public.sparky_notification_snapshot(p_account text) returns bigint
language plpgsql set search_path=public as $$
declare v_max bigint;
begin
  perform sparky_notification_init(p_account);
  perform 1 from sparky_notification_preferences where account_key=p_account for update;
  select coalesce(max(sequence),0) into v_max from sparky_notifications where account_key=p_account;
  return v_max;
end $$;
create function public.sparky_notification_open(p_account text,p_snapshot bigint) returns void
language sql set search_path=public as $$
  update sparky_notifications set read_at=now() where account_key=p_account and sequence<=p_snapshot and read_at is null;
$$;

create function public.sparky_notification_preferences_update(p_account text,p_revision bigint,p_patch jsonb,p_import boolean default false)
returns setof public.sparky_notification_preferences language plpgsql set search_path=public as $$
declare v_row sparky_notification_preferences;
begin
  perform sparky_notification_init(p_account);
  select * into v_row from sparky_notification_preferences where account_key=p_account for update;
  if p_import and v_row.goal_minutes is not null then return next v_row; return; end if;
  if not p_import and v_row.revision<>p_revision then raise exception 'preferences-conflict'; end if;
  update sparky_notification_preferences set
    goal_minutes=case when p_patch ? 'goalMinutes' then (p_patch->>'goalMinutes')::integer else goal_minutes end,
    goal_start_day=case when goal_minutes is null and p_patch ? 'goalMinutes' then (now() at time zone 'America/Sao_Paulo')::date+1 else goal_start_day end,
    push_enabled=coalesce((p_patch->>'pushEnabled')::boolean,push_enabled),
    review=coalesce((p_patch->>'review')::boolean,review),
    resume=coalesce((p_patch->>'resume')::boolean,resume),
    daily_goal=coalesce((p_patch->>'dailyGoal')::boolean,daily_goal),
    locale=coalesce(p_patch->>'locale',locale), revision=revision+1
  where account_key=p_account returning * into v_row;
  return next v_row;
end $$;

create function public.sparky_notification_presence(p_account text,p_active boolean) returns void
language plpgsql set search_path=public as $$
begin
  perform sparky_notification_init(p_account);
  update sparky_notification_preferences set last_activity_at=now(),
    active_until=case when p_active then now()+interval '90 seconds' else active_until end where account_key=p_account;
end $$;

create function public.sparky_study_activity_update(p_account text,p_session uuid,p_lesson text,p_review boolean,
  p_started timestamptz,p_sequence bigint,p_active_ms bigint,p_complete boolean default false)
returns void language plpgsql set search_path=public as $$
declare v_old sparky_study_activity; v_time bigint;
begin
  perform sparky_notification_presence(p_account,not p_complete);
  if p_started>now() or p_started<now()-interval '8 hours' then raise exception 'study-expired'; end if;
  v_time:=greatest(0,least(p_active_ms,floor(extract(epoch from now()-p_started)*1000)::bigint,28800000));
  select * into v_old from sparky_study_activity where account_key=p_account and session_id=p_session for update;
  if found then
    if v_old.lesson_id<>p_lesson or v_old.review<>p_review or v_old.started_at<>p_started then raise exception 'invalid-session'; end if;
    if v_old.completed_at is not null then return; end if;
    if not p_complete and p_sequence<=v_old.sequence then return; end if;
    update sparky_study_activity set active_ms=greatest(active_ms,v_time),sequence=greatest(sequence,p_sequence),
      last_activity_at=now(),completed_at=case when p_complete then now() else null end
      where account_key=p_account and session_id=p_session;
  else
    insert into sparky_study_activity(account_key,session_id,lesson_id,review,started_at,sequence,active_ms,completed_at)
    values(p_account,p_session,p_lesson,p_review,p_started,p_sequence,v_time,case when p_complete then now() else null end);
  end if;
end $$;

-- Completion metadata and the reward ledger commit together or neither commits.
create function public.sparky_complete_study_progress(p_account text,p_revision bigint,p_state jsonb,p_session uuid,
  p_lesson text,p_review boolean,p_started timestamptz,p_active_ms bigint) returns boolean
language plpgsql set search_path=public as $$
begin
  update sparky_account_progress set state=p_state,revision=revision+1,updated_at=now()
    where account_key=p_account and revision=p_revision;
  if not found then return false; end if;
  perform sparky_study_activity_update(p_account,p_session,p_lesson,p_review,p_started,0,p_active_ms,true);
  return true;
end $$;

create function public.sparky_notification_create(p_account text,p_kind text,p_day date,p_content jsonb,p_destination jsonb,
  p_progress_revision bigint) returns setof public.sparky_notifications
language plpgsql set search_path=public as $$
declare v_preferences sparky_notification_preferences; v_notification sparky_notifications;
begin
  select * into v_preferences from sparky_notification_preferences where account_key=p_account for update;
  if not found or v_preferences.last_activity_at>now()-interval '15 minutes' or v_preferences.active_until>now()
    or (p_kind='review' and not v_preferences.review) or (p_kind='resume' and not v_preferences.resume)
    or (p_kind='daily-goal' and not v_preferences.daily_goal) then return; end if;
  if p_progress_revision is not null and not exists(select 1 from sparky_account_progress where account_key=p_account and revision=p_progress_revision) then return; end if;
  insert into sparky_notifications(account_key,kind,reminder_day,content,destination)
  values(p_account,p_kind,p_day,p_content,p_destination) on conflict(account_key,kind,reminder_day) do nothing;
  select * into v_notification from sparky_notifications where account_key=p_account and kind=p_kind and reminder_day=p_day;
  return next v_notification;
end $$;

create function public.sparky_notification_claim(p_account text,p_notification uuid,p_device text,p_progress_revision bigint)
returns boolean language plpgsql set search_path=public as $$
declare v_pref sparky_notification_preferences; v_kind text; v_delivery sparky_notification_deliveries;
begin
  select * into v_pref from sparky_notification_preferences where account_key=p_account for update;
  if not found or not v_pref.push_enabled or v_pref.last_activity_at>now()-interval '15 minutes' or v_pref.active_until>now() then return false; end if;
  select kind into v_kind from sparky_notifications where account_key=p_account and id=p_notification and reminder_day=(now() at time zone 'America/Sao_Paulo')::date;
  if not found or (v_kind='review' and not v_pref.review) or (v_kind='resume' and not v_pref.resume) or (v_kind='daily-goal' and not v_pref.daily_goal) then return false; end if;
  if p_progress_revision is not null and not exists(select 1 from sparky_account_progress where account_key=p_account and revision=p_progress_revision) then return false; end if;
  if not exists(select 1 from sparky_media_progress where account_key=p_account and track_id=p_device) then return false; end if;
  select * into v_delivery from sparky_notification_deliveries where notification_id=p_notification and device_id=p_device for update;
  if found then
    -- An abandoned sending claim may have reached the provider: never reclaim it.
    if v_delivery.status<>'retry' or v_delivery.attempts>=3 or v_delivery.updated_at>now()-interval '1 minute' then return false; end if;
    update sparky_notification_deliveries set status='sending',attempts=attempts+1,updated_at=now() where notification_id=p_notification and device_id=p_device;
  else
    insert into sparky_notification_deliveries(notification_id,device_id,status) values(p_notification,p_device,'sending');
  end if;
  return true;
end $$;

-- Endpoint reassociation is atomic, including two accounts registering together.
create function public.sparky_push_register(p_account text,p_device text,p_state jsonb) returns void
language plpgsql set search_path=public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_device,0));
  delete from sparky_media_progress where track_id=p_device and account_key<>p_account;
  insert into sparky_media_progress(account_key,track_id,revision,state,updated_at)
  values(p_account,p_device,1,p_state,now()) on conflict(account_key,track_id) do update set state=excluded.state,revision=sparky_media_progress.revision+1,updated_at=now();
  perform sparky_notification_init(p_account);
end $$;

alter table public.sparky_notification_preferences enable row level security;
alter table public.sparky_study_activity enable row level security;
alter table public.sparky_notifications enable row level security;
alter table public.sparky_notification_deliveries enable row level security;
revoke all on public.sparky_notification_preferences,public.sparky_study_activity,public.sparky_notifications,public.sparky_notification_deliveries from public,anon,authenticated;
grant select,insert,update,delete on public.sparky_notification_preferences,public.sparky_study_activity,public.sparky_notifications,public.sparky_notification_deliveries to service_role;
grant usage,select on sequence public.sparky_notifications_sequence_seq to service_role;
-- Functions are invoker rights and callable only by the existing server role.
do $$ declare r record; begin
  for r in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('sparky_notification_init','sparky_notification_snapshot','sparky_notification_open',
    'sparky_notification_preferences_update','sparky_notification_presence','sparky_study_activity_update',
    'sparky_complete_study_progress','sparky_notification_create','sparky_notification_claim','sparky_push_register') loop
    execute format('revoke all on function %s from public,anon,authenticated',r.signature);
    execute format('grant execute on function %s to service_role',r.signature);
  end loop;
end $$;
commit;
