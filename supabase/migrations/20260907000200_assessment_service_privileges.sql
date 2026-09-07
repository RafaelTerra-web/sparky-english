-- Supabase default privileges can already grant ALL to service_role. A GRANT
-- of a smaller set does not remove those inherited table privileges.
begin;
revoke all on public.sparky_rubrics, public.sparky_assessment_attempts,
  public.sparky_assessment_answers, public.sparky_assessment_ratings,
  public.sparky_assessment_reviews, public.sparky_certificates,
  public.sparky_personal_work, public.sparky_rate_windows from service_role;
grant select, insert, update on public.sparky_rubrics, public.sparky_assessment_attempts,
  public.sparky_assessment_answers, public.sparky_assessment_ratings,
  public.sparky_assessment_reviews, public.sparky_certificates,
  public.sparky_personal_work, public.sparky_rate_windows to service_role;
-- Account progress is also server-only when a project has custom defaults.
revoke all on public.sparky_account_progress from public, anon, authenticated, service_role;
grant select, insert, update on public.sparky_account_progress to service_role;
commit;
