begin;

-- HuMob Phase 8
-- Public profile projections expose only fields required by Explore and the
-- public profile route. The base tables keep their existing RLS policies.

create or replace view public.public_profiles
with (security_barrier = true)
as
select
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.bio
from public.profiles p
where p.is_private is false
  and p.onboarding_completed is true
  and p.account_status = 'active'::public.account_status
  and p.username is not null;

comment on view public.public_profiles is
  'Projection field publik untuk Explore dan public profile HuMob.';

revoke all
on table public.public_profiles
from public, anon, authenticated, service_role;

grant select
on table public.public_profiles
to authenticated;

create or replace view public.public_user_achievements
with (security_barrier = true)
as
select
  ua.user_id,
  ua.achievement_key,
  ua.unlocked_at
from public.user_achievements ua
join public.public_profiles pp
  on pp.id = ua.user_id;

comment on view public.public_user_achievements is
  'Projection achievement terbuka milik profil publik HuMob.';

revoke all
on table public.public_user_achievements
from public, anon, authenticated, service_role;

grant select
on table public.public_user_achievements
to authenticated;

create or replace view public.public_profile_ratings
with (security_barrier = true)
as
select
  dr.user_id,
  dr.energy_rating,
  dr.focus_rating,
  dr.discipline_rating,
  dr.responsibility_rating,
  dr.overall_rating,
  dr.created_at
from public.daily_ratings dr
join public.public_profiles pp
  on pp.id = dr.user_id
where dr.overall_rating is not null;

comment on view public.public_profile_ratings is
  'Projection skor performa publik tanpa aktivitas, provider, model, atau metadata internal.';

revoke all
on table public.public_profile_ratings
from public, anon, authenticated, service_role;

grant select
on table public.public_profile_ratings
to authenticated;

notify pgrst, 'reload schema';

commit;
