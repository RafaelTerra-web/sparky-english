-- Transactional production audit for RewardState v4. The synthetic row is
-- always rolled back, so this script never changes learner data.
begin;
set local role service_role;

do $$
declare
  audit_key text := repeat(replace(gen_random_uuid()::text, '-', ''), 2);
  affected integer;
  saved jsonb;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.sparky_account_progress'::regclass) then
    raise exception 'RLS disabled';
  end if;
  if has_table_privilege('anon', 'public.sparky_account_progress', 'SELECT')
    or has_table_privilege('authenticated', 'public.sparky_account_progress', 'UPDATE') then
    raise exception 'client access exposed';
  end if;

  insert into public.sparky_account_progress(account_key, state, revision)
  values (audit_key, '{"version":3,"coins":100,"completedBits":"AQ"}', 0);

  update public.sparky_account_progress
  set state = '{"version":4,"wardrobeVersion":3,"coins":130,"sceneRefund":30,"retiredRefundBits":"EA","completedBits":"AQ"}',
      revision = 1
  where account_key = audit_key and revision = 0;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'current revision was not updated'; end if;

  update public.sparky_account_progress
  set state = '{"coins":999}', revision = 2
  where account_key = audit_key and revision = 0;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'stale revision overwrote state'; end if;

  select state into saved from public.sparky_account_progress where account_key = audit_key;
  if saved->>'coins' <> '130' or saved->>'completedBits' <> 'AQ' then
    raise exception 'saved state did not preserve learner fields';
  end if;
end $$;

select 'PASS: service role, RLS, v4 state and stale-revision rejection; changes rolled back' as wardrobe_persistence_audit;
rollback;
