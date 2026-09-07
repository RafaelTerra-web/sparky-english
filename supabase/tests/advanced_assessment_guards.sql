-- Execute after the migrations. Synthetic rows are rolled back, even on error.
begin;
do $$
declare
  account text := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
  attempt uuid;
  cert uuid;
  slot integer;
  rejected boolean;
begin
  for slot in 1..6 loop
    if not public.sparky_take_assessment_slot(account) then
      raise exception 'Rate limiter rejected an allowed slot';
    end if;
  end loop;
  if public.sparky_take_assessment_slot(account) then
    raise exception 'Rate limiter accepted a seventh slot';
  end if;
  if has_table_privilege('service_role', 'public.sparky_certificates', 'DELETE') or
     has_table_privilege('service_role', 'public.sparky_certificates', 'TRUNCATE') then
    raise exception 'Service can remove certificates instead of revoking them';
  end if;
  if has_table_privilege('anon', 'public.sparky_assessment_ratings', 'SELECT') or
     has_table_privilege('authenticated', 'public.sparky_assessment_answers', 'INSERT') or
     has_table_privilege('anon', 'public.sparky_account_progress', 'SELECT') then
    raise exception 'Private data accessible to browser roles';
  end if;
  insert into public.sparky_assessment_attempts(account_key,request_key,request_hash,assessment_id,version,level,kind,expires_at)
    values (account,gen_random_uuid(),account,'qa-rollback-only','sparky-advanced-beta-2026-09-v1','B2','checkpoint',now()+interval '1 hour') returning id into attempt;
  insert into public.sparky_certificates(account_key,attempt_id,token,display_name,level,version,skill_profile,public_consent_at)
    values (account,attempt,replace(replace(rtrim(encode(gen_random_bytes(32),'base64'),'='),'+','-'),'/','_'),'QA rollback only','B2','sparky-advanced-beta-2026-09-v1','{}',now()) returning id into cert;
  rejected := false;
  begin
    update public.sparky_certificates set display_name = 'Changed' where id = cert;
  exception when raise_exception then
    if sqlerrm <> 'certificate-immutable' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Certificate payload changed'; end if;
  update public.sparky_certificates set revoked_at = now() where id = cert;
  rejected := false;
  begin
    update public.sparky_certificates set revoked_at = null where id = cert;
  exception when raise_exception then
    if sqlerrm <> 'certificate-immutable' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Revoked certificate was restored'; end if;
end $$;
rollback;
select 'Rate limit, browser isolation, immutable payload and one-way revocation passed; QA data rolled back.' as verification;
