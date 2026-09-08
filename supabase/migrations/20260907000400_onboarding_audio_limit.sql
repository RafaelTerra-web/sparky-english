begin;
create function public.sparky_take_name_audio_slot(p_account text) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.sparky_rate_windows(account_key,action,window_start,used) values(p_account,'name-audio',date_trunc('hour',now()),1)
 on conflict(account_key,action,window_start) do update set used=public.sparky_rate_windows.used+1 where public.sparky_rate_windows.used<6 returning used into n;
 return n is not null;
end;$$;
revoke all on function public.sparky_take_name_audio_slot(text) from public,anon,authenticated;
grant execute on function public.sparky_take_name_audio_slot(text) to service_role;
commit;
