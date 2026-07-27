begin;

-- ============================================================
-- HuMob Phase 5H.2A
-- Profile Backend Contract
--
-- Mencakup:
-- 1. Reserved usernames
-- 2. Username availability RPC
-- 3. Complete onboarding RPC
-- 4. Update profile RPC
-- 5. Compatibility wrapper untuk complete_onboarding lama
-- 6. Function grants dan security hardening
-- ============================================================


-- ============================================================
-- 1. RESERVED USERNAMES
-- ============================================================

create table if not exists public.reserved_usernames (
  username text primary key,
  reason text not null default 'system',
  created_at timestamp with time zone
    not null default now(),

  constraint reserved_usernames_username_not_blank
    check (length(btrim(username)) > 0),

  constraint reserved_usernames_username_normalized
    check (username = lower(btrim(username))),

  constraint reserved_usernames_username_format
    check (
      username ~ '^[a-z0-9._]+$'
    )
);

comment on table public.reserved_usernames is
  'Daftar username yang tidak boleh digunakan oleh pengguna HuMob.';

comment on column public.reserved_usernames.username is
  'Username lowercase yang dicadangkan untuk sistem, brand, atau route internal.';

comment on column public.reserved_usernames.reason is
  'Alasan username dicadangkan.';


alter table public.reserved_usernames
  enable row level security;

revoke all
on table public.reserved_usernames
from public, anon, authenticated, service_role;


insert into public.reserved_usernames (
  username,
  reason
)
values
  ('admin', 'system'),
  ('administrator', 'system'),
  ('api', 'system route'),
  ('auth', 'system route'),
  ('calendar', 'application route'),
  ('contact', 'public route'),
  ('explore', 'application route'),
  ('help', 'support identity'),
  ('humob', 'official brand'),
  ('login', 'authentication route'),
  ('logout', 'authentication route'),
  ('moderator', 'system role'),
  ('notifications', 'application route'),
  ('official', 'official identity'),
  ('onboarding', 'application route'),
  ('privacy', 'public route'),
  ('profile', 'application route'),
  ('profiles', 'application route'),
  ('register', 'authentication route'),
  ('root', 'system identity'),
  ('security', 'system identity'),
  ('settings', 'application route'),
  ('signup', 'authentication route'),
  ('staff', 'official identity'),
  ('support', 'support identity'),
  ('system', 'system identity'),
  ('terms', 'public route')
on conflict (username)
do update
set reason = excluded.reason;


-- ============================================================
-- 2. NORMALIZE PROFILE FIELDS
-- ============================================================

create or replace function public.normalize_profile_fields()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.username is not null then
    new.username :=
      lower(
        btrim(new.username::text)
      );
  end if;

  if new.full_name is not null then
    new.full_name :=
      nullif(
        btrim(new.full_name),
        ''
      );
  end if;

  if new.bio is not null then
    new.bio :=
      nullif(
        btrim(new.bio),
        ''
      );
  end if;

  if new.avatar_url is not null then
    new.avatar_url :=
      nullif(
        btrim(new.avatar_url),
        ''
      );
  end if;

  return new;
end;
$function$;

alter function public.normalize_profile_fields()
  owner to postgres;

revoke all
on function public.normalize_profile_fields()
from public, anon, authenticated, service_role;


-- ============================================================
-- 3. CHECK USERNAME AVAILABILITY
-- ============================================================

create or replace function public.check_username_availability(
  p_username text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;
  v_username text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'available', false,
      'code', 'AUTH_REQUIRED',
      'message', 'User belum login',
      'normalized_username', null
    );
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'available', false,
      'code', 'PROFILE_NOT_FOUND',
      'message', 'Profil tidak ditemukan',
      'normalized_username', null
    );
  end if;

  if v_profile.account_status
       <> 'active'::public.account_status
  then
    return jsonb_build_object(
      'success', false,
      'available', false,
      'code', 'ACCOUNT_NOT_ACTIVE',
      'message', 'Akun tidak aktif',
      'normalized_username', null
    );
  end if;

  v_username :=
    lower(
      nullif(
        btrim(p_username),
        ''
      )
    );

  if v_username is null then
    return jsonb_build_object(
      'success', true,
      'available', false,
      'code', 'USERNAME_REQUIRED',
      'message', 'Username wajib diisi',
      'normalized_username', null
    );
  end if;

  if char_length(v_username) < 4
    or char_length(v_username) > 20
  then
    return jsonb_build_object(
      'success', true,
      'available', false,
      'code', 'USERNAME_LENGTH_INVALID',
      'message', 'Username harus 4–20 karakter',
      'normalized_username', v_username
    );
  end if;

  if v_username !~ '^[a-z0-9._]+$' then
    return jsonb_build_object(
      'success', true,
      'available', false,
      'code', 'USERNAME_FORMAT_INVALID',
      'message',
      'Username hanya boleh berisi huruf kecil, angka, titik, dan underscore',
      'normalized_username', v_username
    );
  end if;

  if exists (
    select 1
    from public.reserved_usernames
    where username = v_username
  ) then
    return jsonb_build_object(
      'success', true,
      'available', false,
      'code', 'USERNAME_RESERVED',
      'message', 'Username ini tidak dapat digunakan',
      'normalized_username', v_username
    );
  end if;

  if exists (
    select 1
    from public.profiles
    where username::text = v_username
      and id <> v_user_id
  ) then
    return jsonb_build_object(
      'success', true,
      'available', false,
      'code', 'USERNAME_TAKEN',
      'message', 'Username sudah digunakan',
      'normalized_username', v_username
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'available', true,
    'code', 'USERNAME_AVAILABLE',
    'message', 'Username tersedia',
    'normalized_username', v_username
  );
end;
$function$;

alter function public.check_username_availability(text)
  owner to postgres;

revoke all
on function public.check_username_availability(text)
from public, anon, authenticated, service_role;

grant execute
on function public.check_username_availability(text)
to authenticated, service_role;

comment on function
  public.check_username_availability(text)
is
  'Memvalidasi format, reserved status, dan ketersediaan username HuMob tanpa membuka data profil pengguna lain.';


-- ============================================================
-- 4. COMPLETE MY ONBOARDING
-- ============================================================

create or replace function public.complete_my_onboarding(
  p_full_name text,
  p_username text,
  p_bio text,
  p_timezone text,
  p_avatar_url text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;

  v_full_name text;
  v_username text;
  v_bio text;
  v_timezone text;
  v_avatar_url text;

  v_cutoff time without time zone;
  v_local_now timestamp without time zone;
  v_start_date date;
  v_now timestamp with time zone := now();
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

  if v_profile.account_status
       <> 'active'::public.account_status
  then
    return jsonb_build_object(
      'success', false,
      'code', 'ACCOUNT_NOT_ACTIVE',
      'message', 'Akun tidak aktif'
    );
  end if;

  if v_profile.onboarding_completed is true then
    return jsonb_build_object(
      'success', true,
      'code', 'ONBOARDING_ALREADY_COMPLETED',
      'message', 'Onboarding sudah selesai',
      'daily_match_start_date',
        v_profile.daily_match_start_date,
      'profile',
        jsonb_build_object(
          'id', v_profile.id,
          'full_name', v_profile.full_name,
          'username', v_profile.username,
          'bio', v_profile.bio,
          'avatar_url', v_profile.avatar_url,
          'timezone', v_profile.timezone,
          'onboarding_completed',
            v_profile.onboarding_completed
        )
    );
  end if;


  v_full_name :=
    nullif(
      btrim(p_full_name),
      ''
    );

  if v_full_name is null then
    return jsonb_build_object(
      'success', false,
      'code', 'FULL_NAME_REQUIRED',
      'message', 'Nama tampilan wajib diisi'
    );
  end if;

  if char_length(v_full_name) < 2
    or char_length(v_full_name) > 80
  then
    return jsonb_build_object(
      'success', false,
      'code', 'FULL_NAME_LENGTH_INVALID',
      'message',
      'Nama tampilan harus 2–80 karakter'
    );
  end if;


  v_username :=
    lower(
      nullif(
        btrim(p_username),
        ''
      )
    );

  if v_username is null then
    return jsonb_build_object(
      'success', false,
      'code', 'USERNAME_REQUIRED',
      'message', 'Username wajib diisi'
    );
  end if;

  if char_length(v_username) < 4
    or char_length(v_username) > 20
  then
    return jsonb_build_object(
      'success', false,
      'code', 'USERNAME_LENGTH_INVALID',
      'message', 'Username harus 4–20 karakter'
    );
  end if;

  if v_username !~ '^[a-z0-9._]+$' then
    return jsonb_build_object(
      'success', false,
      'code', 'USERNAME_FORMAT_INVALID',
      'message',
      'Username hanya boleh berisi huruf kecil, angka, titik, dan underscore'
    );
  end if;

  if exists (
    select 1
    from public.reserved_usernames
    where username = v_username
  ) then
    return jsonb_build_object(
      'success', false,
      'code', 'USERNAME_RESERVED',
      'message', 'Username ini tidak dapat digunakan'
    );
  end if;

  if exists (
    select 1
    from public.profiles
    where username::text = v_username
      and id <> v_user_id
  ) then
    return jsonb_build_object(
      'success', false,
      'code', 'USERNAME_TAKEN',
      'message', 'Username sudah digunakan'
    );
  end if;


  v_bio :=
    nullif(
      btrim(p_bio),
      ''
    );

  if v_bio is not null
    and char_length(v_bio) > 160
  then
    return jsonb_build_object(
      'success', false,
      'code', 'BIO_TOO_LONG',
      'message', 'Bio maksimal 160 karakter'
    );
  end if;


  v_timezone :=
    nullif(
      btrim(p_timezone),
      ''
    );

  if v_timezone is null
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = v_timezone
    )
  then
    return jsonb_build_object(
      'success', false,
      'code', 'TIMEZONE_INVALID',
      'message', 'Timezone tidak valid'
    );
  end if;


  v_avatar_url :=
    coalesce(
      nullif(
        btrim(p_avatar_url),
        ''
      ),
      nullif(
        btrim(v_profile.avatar_url),
        ''
      )
    );

  if v_avatar_url is not null
    and char_length(v_avatar_url) > 2048
  then
    return jsonb_build_object(
      'success', false,
      'code', 'AVATAR_URL_TOO_LONG',
      'message', 'URL foto profil terlalu panjang'
    );
  end if;

  if v_avatar_url is not null
    and v_avatar_url !~ '^https://[^[:space:]]+$'
  then
    return jsonb_build_object(
      'success', false,
      'code', 'AVATAR_URL_INVALID',
      'message',
      'URL foto profil harus menggunakan HTTPS'
    );
  end if;


  select new_user_activation_cutoff
  into v_cutoff
  from public.app_config
  where singleton is true;

  if not found then
    raise exception 'APP_CONFIG_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  v_local_now :=
    v_now at time zone v_timezone;

  v_start_date :=
    v_local_now::date
    + case
        when v_local_now::time >= v_cutoff
          then 1
        else 0
      end;


  perform pg_catalog.set_config(
    'app.humob_trusted_profile_update',
    'on',
    true
  );

  begin
    update public.profiles
    set
      full_name = v_full_name,
      username = v_username,
      bio = v_bio,
      avatar_url = v_avatar_url,
      timezone = v_timezone,
      pending_timezone = null,
      timezone_effective_from = null,
      onboarding_completed = true,
      daily_match_start_date = v_start_date
    where id = v_user_id;

  exception
    when unique_violation then
      perform pg_catalog.set_config(
        'app.humob_trusted_profile_update',
        'off',
        true
      );

      return jsonb_build_object(
        'success', false,
        'code', 'USERNAME_TAKEN',
        'message', 'Username sudah digunakan'
      );
  end;

  perform pg_catalog.set_config(
    'app.humob_trusted_profile_update',
    'off',
    true
  );


  return jsonb_build_object(
    'success', true,
    'code', 'ONBOARDING_COMPLETED',
    'message', 'Onboarding berhasil',
    'daily_match_start_date', v_start_date,
    'profile',
      jsonb_build_object(
        'id', v_user_id,
        'full_name', v_full_name,
        'username', v_username,
        'bio', v_bio,
        'avatar_url', v_avatar_url,
        'timezone', v_timezone,
        'onboarding_completed', true
      )
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

alter function public.complete_my_onboarding(
  text,
  text,
  text,
  text,
  text
)
owner to postgres;

revoke all
on function public.complete_my_onboarding(
  text,
  text,
  text,
  text,
  text
)
from public, anon, authenticated, service_role;

grant execute
on function public.complete_my_onboarding(
  text,
  text,
  text,
  text,
  text
)
to authenticated, service_role;

comment on function public.complete_my_onboarding(
  text,
  text,
  text,
  text,
  text
) is
  'Menyelesaikan onboarding HuMob secara atomik dengan validasi nama, username, bio, timezone, dan avatar.';


-- ============================================================
-- 5. UPDATE MY PROFILE
-- ============================================================

create or replace function public.update_my_profile(
  p_full_name text,
  p_bio text,
  p_avatar_url text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;

  v_full_name text;
  v_bio text;
  v_avatar_url text;
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

  if v_profile.account_status
       <> 'active'::public.account_status
  then
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
      'message',
      'Selesaikan onboarding sebelum mengubah profil'
    );
  end if;


  v_full_name :=
    nullif(
      btrim(p_full_name),
      ''
    );

  if v_full_name is null then
    return jsonb_build_object(
      'success', false,
      'code', 'FULL_NAME_REQUIRED',
      'message', 'Nama tampilan wajib diisi'
    );
  end if;

  if char_length(v_full_name) < 2
    or char_length(v_full_name) > 80
  then
    return jsonb_build_object(
      'success', false,
      'code', 'FULL_NAME_LENGTH_INVALID',
      'message',
      'Nama tampilan harus 2–80 karakter'
    );
  end if;


  v_bio :=
    nullif(
      btrim(p_bio),
      ''
    );

  if v_bio is not null
    and char_length(v_bio) > 160
  then
    return jsonb_build_object(
      'success', false,
      'code', 'BIO_TOO_LONG',
      'message', 'Bio maksimal 160 karakter'
    );
  end if;


  v_avatar_url :=
    coalesce(
      nullif(
        btrim(p_avatar_url),
        ''
      ),
      nullif(
        btrim(v_profile.avatar_url),
        ''
      )
    );

  if v_avatar_url is not null
    and char_length(v_avatar_url) > 2048
  then
    return jsonb_build_object(
      'success', false,
      'code', 'AVATAR_URL_TOO_LONG',
      'message', 'URL foto profil terlalu panjang'
    );
  end if;

  if v_avatar_url is not null
    and v_avatar_url !~ '^https://[^[:space:]]+$'
  then
    return jsonb_build_object(
      'success', false,
      'code', 'AVATAR_URL_INVALID',
      'message',
      'URL foto profil harus menggunakan HTTPS'
    );
  end if;


  update public.profiles
  set
    full_name = v_full_name,
    bio = v_bio,
    avatar_url = v_avatar_url
  where id = v_user_id;


  return jsonb_build_object(
    'success', true,
    'code', 'PROFILE_UPDATED',
    'message', 'Profil berhasil diperbarui',
    'profile',
      jsonb_build_object(
        'id', v_user_id,
        'full_name', v_full_name,
        'username', v_profile.username,
        'bio', v_bio,
        'avatar_url', v_avatar_url,
        'timezone', v_profile.timezone,
        'onboarding_completed',
          v_profile.onboarding_completed
      )
  );
end;
$function$;

alter function public.update_my_profile(
  text,
  text,
  text
)
owner to postgres;

revoke all
on function public.update_my_profile(
  text,
  text,
  text
)
from public, anon, authenticated, service_role;

grant execute
on function public.update_my_profile(
  text,
  text,
  text
)
to authenticated, service_role;

comment on function public.update_my_profile(
  text,
  text,
  text
) is
  'Memperbarui nama tampilan, bio, dan avatar pengguna HuMob tanpa membuka perubahan username atau timezone.';


-- ============================================================
-- 6. COMPATIBILITY WRAPPER
-- ============================================================

create or replace function public.complete_onboarding(
  p_username text,
  p_timezone text
)
returns json
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
    return json_build_object(
      'success', false,
      'code', 'AUTH_REQUIRED',
      'message', 'User belum login'
    );
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id;

  if not found then
    return json_build_object(
      'success', false,
      'code', 'PROFILE_NOT_FOUND',
      'message', 'Profil tidak ditemukan'
    );
  end if;

  return public.complete_my_onboarding(
    p_full_name => v_profile.full_name,
    p_username => p_username,
    p_bio => v_profile.bio,
    p_timezone => p_timezone,
    p_avatar_url => v_profile.avatar_url
  )::json;
end;
$function$;

alter function public.complete_onboarding(
  text,
  text
)
owner to postgres;

revoke all
on function public.complete_onboarding(
  text,
  text
)
from public, anon, authenticated, service_role;

grant execute
on function public.complete_onboarding(
  text,
  text
)
to authenticated, service_role;

comment on function public.complete_onboarding(
  text,
  text
) is
  'Compatibility wrapper untuk onboarding lama. Seluruh validasi diteruskan ke complete_my_onboarding.';


-- ============================================================
-- 7. POSTGREST SCHEMA RELOAD
-- ============================================================

notify pgrst, 'reload schema';

commit;