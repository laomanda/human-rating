begin;

-- HuMob Responsibility Deprecation Migration
-- Permanently removes Responsibility projection from public_profile_ratings view
-- and updates achievement triggers to exclude the deprecated 'responsible' achievement.

-- 1. Update public_profile_ratings view
create or replace view public.public_profile_ratings
with (security_barrier = true)
as
select
  dr.user_id,
  dr.energy_rating,
  dr.focus_rating,
  dr.discipline_rating,
  dr.overall_rating,
  dr.created_at
from public.daily_ratings dr
join public.public_profiles pp
  on pp.id = dr.user_id
where dr.overall_rating is not null;

comment on view public.public_profile_ratings is
  'Projection skor performa publik tanpa aktivitas, provider, model, atau metadata internal (Responsibility deprecated).';

revoke all
on table public.public_profile_ratings
from public, anon, authenticated, service_role;

grant select
on table public.public_profile_ratings
to authenticated;

-- 2. Update evaluate_user_achievements function to exclude 'responsible' achievement
create or replace function public.evaluate_user_achievements(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_first_match_id uuid;
  v_good_form_match_id uuid;
  v_unbeaten_week_match_id uuid;
  v_focused_match_id uuid;
  v_elite_match_id uuid;
  v_thirty_match_id uuid;
  v_rated_count integer;
begin
  if p_user_id is null then
    return;
  end if;

  select dr.daily_match_id
  into v_first_match_id
  from public.daily_ratings dr
  where dr.user_id = p_user_id
    and dr.overall_rating is not null
  order by dr.created_at asc
  limit 1;

  if v_first_match_id is not null then
    perform public.unlock_user_achievement(
      p_user_id,
      'first_match',
      v_first_match_id
    );
  end if;

  select count(*)
  into v_rated_count
  from public.daily_ratings dr
  where dr.user_id = p_user_id
    and dr.overall_rating is not null;

  if v_rated_count >= 30 then
    select dr.daily_match_id
    into v_thirty_match_id
    from public.daily_ratings dr
    where dr.user_id = p_user_id
      and dr.overall_rating is not null
    order by dr.created_at asc
    offset 29
    limit 1;

    if v_thirty_match_id is not null then
      perform public.unlock_user_achievement(
        p_user_id,
        'thirty_matches',
        v_thirty_match_id
      );
    end if;
  end if;

  select dr.daily_match_id
  into v_good_form_match_id
  from public.daily_ratings dr
  where dr.user_id = p_user_id
    and dr.overall_rating >= 7.5
  order by dr.overall_rating desc, dr.created_at asc
  limit 1;

  if v_good_form_match_id is not null then
    perform public.unlock_user_achievement(
      p_user_id,
      'good_form',
      v_good_form_match_id
    );
  end if;

  select dr.daily_match_id
  into v_focused_match_id
  from public.daily_ratings dr
  where dr.user_id = p_user_id
    and dr.focus_rating >= 8.0
  order by dr.focus_rating desc, dr.created_at asc
  limit 1;

  if v_focused_match_id is not null then
    perform public.unlock_user_achievement(
      p_user_id,
      'focused',
      v_focused_match_id
    );
  end if;

  select dr.daily_match_id
  into v_elite_match_id
  from public.daily_ratings dr
  where dr.user_id = p_user_id
    and dr.overall_rating >= 9.0
  order by dr.overall_rating desc, dr.created_at asc
  limit 1;

  if v_elite_match_id is not null then
    perform public.unlock_user_achievement(
      p_user_id,
      'elite_performance',
      v_elite_match_id
    );
  end if;

  with rated_days as (
    select
      dm.match_date,
      dr.daily_match_id,
      row_number() over (
        order by dm.match_date
      ) as rn
    from public.daily_ratings dr
    join public.daily_matches dm
      on dm.id = dr.daily_match_id
    where dr.user_id = p_user_id
      and dr.overall_rating is not null
  ),
  streaks as (
    select
      daily_match_id,
      match_date,
      match_date - (rn * interval '1 day') as group_date,
      count(*) over (
        partition by match_date - (rn * interval '1 day')
      ) as streak_length
    from rated_days
  )
  select daily_match_id
  into v_unbeaten_week_match_id
  from streaks
  where streak_length >= 7
  order by match_date asc
  limit 1;

  if v_unbeaten_week_match_id is not null then
    perform public.unlock_user_achievement(
      p_user_id,
      'unbeaten_week',
      v_unbeaten_week_match_id
    );
  end if;
end;
$function$;

-- 3. Re-create daily rating trigger without responsibility_rating
drop trigger if exists on_daily_ratings_unlock_achievements
on public.daily_ratings;

create trigger on_daily_ratings_unlock_achievements
after insert or update of overall_rating, focus_rating, discipline_rating, energy_rating
on public.daily_ratings
for each row
when (new.overall_rating is not null)
execute function public.handle_daily_rating_achievements();

notify pgrst, 'reload schema';

commit;
