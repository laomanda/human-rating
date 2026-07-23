grant usage on schema public to service_role;

grant select on table
  public.profiles,
  public.daily_matches,
  public.scoring_configs,
  public.performance_baselines,
  public.sleep_entries,
  public.physical_activities,
  public.productive_activities,
  public.responsibilities,
  public.other_activities,
  public.daily_ratings
to service_role;

grant update on table public.daily_matches to service_role;

grant insert on table public.daily_ratings to service_role;
