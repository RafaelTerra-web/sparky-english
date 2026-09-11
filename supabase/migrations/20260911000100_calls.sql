begin;

create table public.sparky_call_sessions (
  id uuid primary key,
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('active','ended')) default 'active',
  level text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  locale text not null check (locale in ('pt-BR','en-US')),
  mascot text not null check (mascot in ('sparky','pinky')),
  topic text not null check (char_length(topic) between 2 and 100),
  objectives jsonb not null,
  opening_turn jsonb not null,
  revision bigint not null default 0,
  turn_count integer not null default 0 check (turn_count between 0 and 20),
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 hours'
);
create index sparky_call_sessions_account_idx on public.sparky_call_sessions(account_key, updated_at desc);

create table public.sparky_call_turns (
  session_id uuid not null references public.sparky_call_sessions(id) on delete cascade,
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  sequence integer not null check (sequence between 1 and 20),
  learner_transcript text not null check (char_length(learner_transcript) between 1 and 4000),
  assistant_text text not null check (char_length(assistant_text) between 1 and 600),
  feedback jsonb not null,
  created_at timestamptz not null default now(),
  primary key(session_id, sequence)
);

create table public.sparky_call_requests (
  account_key text not null check (account_key ~ '^[a-f0-9]{64}$'),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  action text not null check (action in ('start','turn','end')),
  response jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  primary key(account_key,idempotency_key)
);

alter table public.sparky_call_sessions enable row level security;
alter table public.sparky_call_turns enable row level security;
alter table public.sparky_call_requests enable row level security;
revoke all on public.sparky_call_sessions,public.sparky_call_turns,public.sparky_call_requests from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.sparky_call_sessions,public.sparky_call_turns,public.sparky_call_requests to service_role;

create function public.sparky_take_call_slot(p_account text,p_action text) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer; minute_limit integer; daily_used bigint;
begin
 if p_account !~ '^[a-f0-9]{64}$' or p_action not in ('start','turn','end','read') then return false; end if;
 delete from public.sparky_call_requests where expires_at<now();
 delete from public.sparky_call_sessions where expires_at<now();
 delete from public.sparky_rate_windows where action like 'call-%' and window_start<now()-interval '2 days';
 minute_limit := case p_action when 'start' then 3 when 'turn' then 20 when 'end' then 8 else 60 end;
 if p_action='start' then
  select coalesce(sum(used),0) into daily_used from public.sparky_rate_windows where account_key=p_account and action='call-start' and window_start>=date_trunc('day',now());
  if daily_used>=20 then return false; end if;
 end if;
 insert into public.sparky_rate_windows(account_key,action,window_start,used) values(p_account,'call-'||p_action,date_trunc('minute',now()),1)
 on conflict(account_key,action,window_start) do update set used=public.sparky_rate_windows.used+1 where public.sparky_rate_windows.used<minute_limit returning used into n;
 return n is not null;
end;$$;

create function public.sparky_append_call_turn(p_account text,p_session uuid,p_revision bigint,p_transcript text,p_assistant text,p_feedback jsonb,p_objectives jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare next_sequence integer; next_revision bigint;
begin
 select turn_count+1 into next_sequence from public.sparky_call_sessions where id=p_session and account_key=p_account and status='active' and revision=p_revision and expires_at>now() for update;
 if not found then raise exception 'call-conflict'; end if;
 if next_sequence>20 then raise exception 'call-limit'; end if;
 insert into public.sparky_call_turns(session_id,account_key,sequence,learner_transcript,assistant_text,feedback) values(p_session,p_account,next_sequence,p_transcript,p_assistant,p_feedback);
 update public.sparky_call_sessions set objectives=p_objectives,turn_count=next_sequence,revision=revision+1,updated_at=now(),expires_at=now()+interval '2 hours' where id=p_session returning revision into next_revision;
 return next_revision;
end;$$;

create function public.sparky_finish_call(p_account text,p_session uuid,p_revision bigint,p_summary jsonb,p_keep_transcripts boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.sparky_call_sessions set status='ended',summary=p_summary,revision=revision+1,updated_at=now(),expires_at=now()+interval '30 days' where id=p_session and account_key=p_account and status='active' and revision=p_revision;
 if not found then raise exception 'call-conflict'; end if;
 if not p_keep_transcripts then update public.sparky_call_turns set learner_transcript='[apagado ao encerrar]' where session_id=p_session and account_key=p_account; end if;
 return true;
end;$$;

revoke all on function public.sparky_take_call_slot(text,text),public.sparky_append_call_turn(text,uuid,bigint,text,text,jsonb,jsonb),public.sparky_finish_call(text,uuid,bigint,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.sparky_take_call_slot(text,text),public.sparky_append_call_turn(text,uuid,bigint,text,text,jsonb,jsonb),public.sparky_finish_call(text,uuid,bigint,jsonb,boolean) to service_role;
commit;
