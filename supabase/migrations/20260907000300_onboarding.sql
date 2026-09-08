begin;
create table public.sparky_learner_profiles (
 account_key text primary key check(account_key ~ '^[a-f0-9]{64}$'),
 data jsonb not null default '{}'::jsonb,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table public.sparky_onboarding_sessions (
 account_key text primary key check(account_key ~ '^[a-f0-9]{64}$'),
 data jsonb not null default '{"step":"welcome"}'::jsonb,
 revision bigint not null default 0,
 expires_at timestamptz not null default now()+interval '30 days'
);
create table public.sparky_name_audio (
 account_key text not null check(account_key ~ '^[a-f0-9]{64}$'),
 hash text not null check(hash ~ '^[a-f0-9]{64}$'),
 status text not null check(status in ('generating','ready','failed')),
 attempts integer not null default 1,
 path text not null,
 expires_at timestamptz default now()+interval '24 hours',
 updated_at timestamptz not null default now(),
 primary key(account_key,hash)
);
alter table public.sparky_learner_profiles enable row level security;
alter table public.sparky_onboarding_sessions enable row level security;
alter table public.sparky_name_audio enable row level security;
revoke all on public.sparky_learner_profiles,public.sparky_onboarding_sessions,public.sparky_name_audio from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.sparky_learner_profiles,public.sparky_onboarding_sessions,public.sparky_name_audio to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('sparky-personal-audio','sparky-personal-audio',false,2000000,array['audio/wav']) on conflict(id) do nothing;
create function public.sparky_finish_onboarding(p_account text,p_revision bigint,p_profile jsonb,p_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.sparky_onboarding_sessions where account_key=p_account and revision=p_revision for update;
 if not found then return false; end if;
 if not (p_profile->>'age')::integer between 4 and 120 or (p_profile->>'age')::integer<13 and not coalesce((p_profile->>'guardianConsent')::boolean,false) then raise exception 'invalid-profile';end if;
 if p_profile->>'level' not in ('A1','A2','B1','B2','C1','C2') or p_profile->>'mascot' not in ('sparky','pinky') then raise exception 'invalid-profile';end if;
 perform 1 from public.sparky_account_progress where account_key=p_account for update;
 if not found then raise exception 'progress-missing';end if;
 insert into public.sparky_learner_profiles(account_key,data) values(p_account,p_profile||'{"onboardingCompleted":true}'::jsonb)
 on conflict(account_key) do update set data=excluded.data,revision=public.sparky_learner_profiles.revision+1,updated_at=now();
 update public.sparky_account_progress set state=jsonb_set(state,'{mascot}',p_profile->'mascot'),revision=revision+1,updated_at=now() where account_key=p_account;
 update public.sparky_name_audio set expires_at=null where account_key=p_account and hash=p_hash and status='ready';
 delete from public.sparky_onboarding_sessions where account_key=p_account;
 return true;
end;$$;
create function public.sparky_take_onboarding_slot(p_account text) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.sparky_rate_windows(account_key,action,window_start,used) values(p_account,'onboarding',date_trunc('minute',now()),1)
 on conflict(account_key,action,window_start) do update set used=public.sparky_rate_windows.used+1 where public.sparky_rate_windows.used<40 returning used into n;
 return n is not null;
end;$$;
revoke all on function public.sparky_finish_onboarding(text,bigint,jsonb,text),public.sparky_take_onboarding_slot(text) from public,anon,authenticated;
grant execute on function public.sparky_finish_onboarding(text,bigint,jsonb,text),public.sparky_take_onboarding_slot(text) to service_role;
commit;
