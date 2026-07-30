begin;

-- The deployed notification_preferences table predates the push foundation.
-- Keep the existing column contract and allow users to create their own row.
do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and policyname = 'Users can insert own notification preferences'
  ) then
    create policy "Users can insert own notification preferences"
      on public.notification_preferences
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end;
$policy$;

create or replace function public.update_my_notification_preference(
  p_push_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'AUTH_REQUIRED',
      'message', 'User belum login'
    );
  end if;

  insert into public.notification_preferences (
    user_id,
    push_enabled,
    updated_at
  )
  values (
    v_user_id,
    p_push_enabled,
    now()
  )
  on conflict (user_id)
  do update
  set
    push_enabled = excluded.push_enabled,
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'code', 'NOTIFICATION_PREFERENCE_UPDATED',
    'message', 'Preferensi notifikasi berhasil diperbarui',
    'push_enabled', p_push_enabled
  );
end;
$function$;

alter function public.update_my_notification_preference(boolean)
  owner to postgres;

revoke all
on function public.update_my_notification_preference(boolean)
from public, anon, authenticated, service_role;

grant execute
on function public.update_my_notification_preference(boolean)
to authenticated, service_role;

comment on function public.update_my_notification_preference(boolean) is
  'Memperbarui push_enabled milik authenticated user secara atomik.';

-- Settings profile privacy must use the same protected update path as other
-- profile mutations. This function only updates the caller's own profile.
create or replace function public.update_my_profile_privacy(
  p_is_private boolean
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'AUTH_REQUIRED',
      'message', 'User belum login'
    );
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'PROFILE_NOT_FOUND',
      'message', 'Profil tidak ditemukan'
    );
  end if;

  if v_profile.account_status <> 'active'::public.account_status then
    return jsonb_build_object(
      'success', false,
      'code', 'ACCOUNT_NOT_ACTIVE',
      'message', 'Akun tidak aktif'
    );
  end if;

  if v_profile.onboarding_completed is not true then
    return jsonb_build_object(
      'success', false,
      'code', 'ONBOARDING_REQUIRED',
      'message', 'Selesaikan onboarding sebelum mengubah privasi profil'
    );
  end if;

  perform pg_catalog.set_config(
    'app.humob_trusted_profile_update',
    'on',
    true
  );

  update public.profiles
  set is_private = p_is_private
  where id = v_user_id;

  perform pg_catalog.set_config(
    'app.humob_trusted_profile_update',
    'off',
    true
  );

  return jsonb_build_object(
    'success', true,
    'code', 'PROFILE_PRIVACY_UPDATED',
    'message', 'Privasi profil berhasil diperbarui',
    'is_private', p_is_private
  );
exception
  when others then
    perform pg_catalog.set_config(
      'app.humob_trusted_profile_update',
      'off',
      true
    );

    raise;
end;
$function$;

alter function public.update_my_profile_privacy(boolean)
  owner to postgres;

revoke all
on function public.update_my_profile_privacy(boolean)
from public, anon, authenticated, service_role;

grant execute
on function public.update_my_profile_privacy(boolean)
to authenticated, service_role;

comment on function public.update_my_profile_privacy(boolean) is
  'Memperbarui privasi profil milik authenticated user melalui kontrak profile terproteksi.';

notify pgrst, 'reload schema';

commit;
