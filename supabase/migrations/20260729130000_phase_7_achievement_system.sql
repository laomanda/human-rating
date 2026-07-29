begin;

create extension if not exists pgcrypto;

-- ============================================================
-- HuMob Phase 7
-- Achievement System
--
-- Menyimpan unlock achievement berbasis data rating real.
-- State bersifat persisten, aman, dan idempotent.
-- ============================================================

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  source_match_id uuid null references public.daily_matches(id) on delete set null,
  unlocked_at timestamp with time zone not null default now(),

  constraint user_achievements_achievement_key_check
    check (
      achievement_key in (
        'first_match',
        'good_form',
        'unbeaten_week',
        'focused',
        'responsible',
        'elite_performance',
        'thirty_matches'
      )
    ),

  constraint user_achievements_unique
    unique (user_id, achievement_key)
);

comment on table public.user_achievements is
  'State unlock achievement HuMob per user berdasarkan data rating nyata.';

comment on column public.user_achievements.achievement_key is
  'Key achievement stabil yang dipakai oleh frontend dan logika unlock.';

alter table public.user_achievements
  enable row level security;

revoke all
on table public.user_achievements
from public, anon, authenticated, service_role;

grant select, insert
on table public.user_achievements
to authenticated, service_role;

drop policy if exists user_achievements_select_own
on public.user_achievements;

create policy user_achievements_select_own
on public.user_achievements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists user_achievements_insert_own
on public.user_achievements;

create policy user_achievements_insert_own
on public.user_achievements
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.unlock_user_achievement(
  p_user_id uuid,
  p_achievement_key text,
  p_source_match_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.user_achievements (
    user_id,
    achievement_key,
    source_match_id
  )
  values (
    p_user_id,
    p_achievement_key,
    p_source_match_id
  )
  on conflict (user_id, achievement_key)
  do nothing;
end;
$function$;

alter function public.unlock_user_achievement(
  uuid,
  text,
  uuid
)
owner to postgres;

revoke all
on function public.unlock_user_achievement(
  uuid,
  text,
  uuid
)
from public, anon, authenticated, service_role;

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
  v_responsible_match_id uuid;
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
  into v_responsible_match_id
  from public.daily_ratings dr
  where dr.user_id = p_user_id
    and dr.responsibility_rating >= 8.0
  order by dr.responsibility_rating desc, dr.created_at asc
  limit 1;

  if v_responsible_match_id is not null then
    perform public.unlock_user_achievement(
      p_user_id,
      'responsible',
      v_responsible_match_id
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
      and dr.overall_rating >= 7.0
  ),
  streaks as (
    select
      daily_match_id,
      match_date,
      match_date - rn::int as streak_group,
      count(*) over (
        partition by match_date - rn::int
      ) as streak_length,
      row_number() over (
        partition by match_date - rn::int
        order by match_date desc
      ) as reverse_rank
    from rated_days
  )
  select daily_match_id
  into v_unbeaten_week_match_id
  from streaks
  where streak_length >= 7
    and reverse_rank = 1
  order by match_date desc
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

alter function public.evaluate_user_achievements(
  uuid
)
owner to postgres;

revoke all
on function public.evaluate_user_achievements(
  uuid
)
from public, anon, authenticated, service_role;

create or replace function public.handle_daily_rating_achievements()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform public.evaluate_user_achievements(
    new.user_id
  );

  return new;
end;
$function$;

alter function public.handle_daily_rating_achievements()
owner to postgres;

revoke all
on function public.handle_daily_rating_achievements()
from public, anon, authenticated, service_role;

drop trigger if exists on_daily_ratings_unlock_achievements
on public.daily_ratings;

create trigger on_daily_ratings_unlock_achievements
after insert or update of overall_rating, focus_rating, responsibility_rating
on public.daily_ratings
for each row
when (new.overall_rating is not null)
execute function public.handle_daily_rating_achievements();

do $backfill$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct user_id
    from public.daily_ratings
    where overall_rating is not null
  loop
    perform public.evaluate_user_achievements(
      v_user_id
    );
  end loop;
end;
$backfill$;

notify pgrst, 'reload schema';

commit;
