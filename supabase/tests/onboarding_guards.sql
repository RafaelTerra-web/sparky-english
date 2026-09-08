begin;
do $$
begin
 if has_table_privilege('anon','public.sparky_learner_profiles','SELECT') or has_table_privilege('authenticated','public.sparky_onboarding_sessions','UPDATE') or has_table_privilege('anon','public.sparky_name_audio','SELECT') then raise exception 'Private onboarding table exposed';end if;
 if has_function_privilege('anon','public.sparky_finish_onboarding(text,bigint,jsonb,text)','EXECUTE') then raise exception 'Completion RPC exposed';end if;
 if exists(select 1 from storage.buckets where id='sparky-personal-audio' and public) then raise exception 'Audio bucket is public';end if;
end $$;
-- Exercise atomic completion and verify existing reward fields are preserved.
insert into public.sparky_account_progress(account_key,state) values(repeat('f',64),'{"coins":123,"mascot":"sparky","completedBits":"AQ","ownedBits":"Ag"}');
insert into public.sparky_onboarding_sessions(account_key) values(repeat('f',64));
select public.sparky_finish_onboarding(repeat('f',64),0,'{"name":"Teste","age":18,"mascot":"pinky","level":"B2","guardianConsent":false}',repeat('a',64));
do $$ begin
 if (select state->>'coins' from public.sparky_account_progress where account_key=repeat('f',64))<>'123' then raise exception 'Coins changed';end if;
 if (select state->>'completedBits' from public.sparky_account_progress where account_key=repeat('f',64))<>'AQ' then raise exception 'Progress changed';end if;
 if (select state->>'mascot' from public.sparky_account_progress where account_key=repeat('f',64))<>'pinky' then raise exception 'Mascot not applied';end if;
 if public.sparky_finish_onboarding(repeat('f',64),0,'{}',repeat('a',64)) then raise exception 'Duplicate finish accepted';end if;
end $$;
rollback;
