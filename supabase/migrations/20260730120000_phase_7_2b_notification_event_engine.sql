begin;

-- ============================================================
-- HuMob Phase 7.2B
-- Notification Event Engine
--
-- Otomatisasi pembuat notifikasi berdasarkan event
-- daily_ratings (rating_completed) dan user_achievements (achievement_unlocked).
-- ============================================================

-- 1. Tambah kolom reference_id pada tabel notifications jika belum ada
alter table public.notifications
  add column if not exists reference_id text null;

comment on column public.notifications.reference_id is
  'ID referensi entitas asal (misal match_id atau achievement_key) untuk pencegahan duplikasi.';

-- 2. Buat unique index untuk deduplikasi notifikasi otomatis
create unique index if not exists idx_notifications_dedup
  on public.notifications (user_id, type, reference_id)
  where reference_id is not null;

-- 3. Helper Function: create_notification()
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_reference_id text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_user_id is null or p_type is null or p_title is null or p_message is null then
    return;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    is_read,
    created_at
  )
  values (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_reference_id,
    false,
    now()
  )
  on conflict (user_id, type, reference_id) do nothing;
end;
$function$;

alter function public.create_notification(
  uuid,
  text,
  text,
  text,
  text
) owner to postgres;

revoke all on function public.create_notification(
  uuid,
  text,
  text,
  text,
  text
) from public, anon, authenticated, service_role;

grant execute on function public.create_notification(
  uuid,
  text,
  text,
  text,
  text
) to authenticated, service_role;

-- 4. Trigger Function: handle_rating_completed_notification
create or replace function public.handle_rating_completed_notification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.user_id is not null and new.overall_rating is not null then
    perform public.create_notification(
      new.user_id,
      'rating_completed',
      'Rating selesai',
      'Rating harian kamu sudah tersedia. Lihat performamu sekarang.',
      new.daily_match_id::text
    );
  end if;

  return new;
end;
$function$;

alter function public.handle_rating_completed_notification() owner to postgres;

revoke all on function public.handle_rating_completed_notification()
from public, anon, authenticated, service_role;

drop trigger if exists on_daily_ratings_create_notification on public.daily_ratings;

create trigger on_daily_ratings_create_notification
after insert on public.daily_ratings
for each row
when (new.overall_rating is not null)
execute function public.handle_rating_completed_notification();

-- 5. Trigger Function: handle_achievement_unlocked_notification
create or replace function public.handle_achievement_unlocked_notification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.user_id is not null and new.achievement_key is not null then
    perform public.create_notification(
      new.user_id,
      'achievement_unlocked',
      'Achievement baru terbuka',
      'Selamat! Kamu berhasil membuka achievement baru.',
      new.achievement_key
    );
  end if;

  return new;
end;
$function$;

alter function public.handle_achievement_unlocked_notification() owner to postgres;

revoke all on function public.handle_achievement_unlocked_notification()
from public, anon, authenticated, service_role;

drop trigger if exists on_user_achievements_create_notification on public.user_achievements;

create trigger on_user_achievements_create_notification
after insert on public.user_achievements
for each row
execute function public.handle_achievement_unlocked_notification();

notify pgrst, 'reload schema';

commit;
