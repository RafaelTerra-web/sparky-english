-- Lower reminder pressure without changing existing inbox items or delivery claims.
begin;
create or replace function public.sparky_notification_create(p_account text,p_kind text,p_day date,p_content jsonb,p_destination jsonb,
  p_progress_revision bigint) returns setof public.sparky_notifications
language plpgsql set search_path=public as $$
declare v_preferences sparky_notification_preferences; v_notification sparky_notifications;
begin
  -- The preference row serializes competing cron jobs for this account.
  select * into v_preferences from sparky_notification_preferences where account_key=p_account for update;
  if not found or v_preferences.last_activity_at>now()-interval '60 minutes' or v_preferences.active_until>now()
    or (p_kind='review' and not v_preferences.review) or (p_kind='resume' and not v_preferences.resume)
    or (p_kind='daily-goal' and not v_preferences.daily_goal) then return; end if;
  if p_day<>(now() at time zone 'America/Sao_Paulo')::date then return; end if;
  if p_progress_revision is not null and not exists(select 1 from sparky_account_progress where account_key=p_account and revision=p_progress_revision) then return; end if;
  -- Return the same event for bounded provider retries; never choose new copy.
  select * into v_notification from sparky_notifications where account_key=p_account and kind=p_kind and reminder_day=p_day;
  if found then return next v_notification;return;end if;
  if exists(select 1 from sparky_notifications where account_key=p_account and (reminder_day=p_day or created_at>now()-interval '20 hours')) then return;end if;
  if p_kind='resume' and exists(select 1 from sparky_notifications where account_key=p_account and kind='resume'
    and destination->>'lessonId'=p_destination->>'lessonId' and created_at>now()-interval '72 hours') then return;end if;
  -- Pause after three most recent unread reminders, resume after 72 hours.
  if (select count(*) from (select read_at,created_at from sparky_notifications where account_key=p_account order by sequence desc limit 3) recent where read_at is null)=3
    and exists(select 1 from sparky_notifications where account_key=p_account and created_at>now()-interval '72 hours') then return;end if;
  insert into sparky_notifications(account_key,kind,reminder_day,content,destination)
  values(p_account,p_kind,p_day,p_content,p_destination) returning * into v_notification;
  return next v_notification;
end $$;
create or replace function public.sparky_notification_claim(p_account text,p_notification uuid,p_device text,p_progress_revision bigint)
returns boolean language plpgsql set search_path=public as $$
declare v_pref sparky_notification_preferences; v_kind text; v_delivery sparky_notification_deliveries;
begin
  select * into v_pref from sparky_notification_preferences where account_key=p_account for update;
  if not found or not v_pref.push_enabled or v_pref.last_activity_at>now()-interval '60 minutes' or v_pref.active_until>now() then return false; end if;
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

commit;