begin;

-- ============================================================
-- HuMob Phase 7.4
-- PWA Push Notification Foundation
--
-- Creates:
-- 1. device_tokens — stores FCM registration tokens per user
-- 2. notification_preferences — per-user push/email toggles
-- 3. push_status column on notifications
-- 4. push delivery trigger via pg_net
-- ============================================================


-- ============================================================
-- 1. DEVICE TOKENS
-- ============================================================

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'web'
    check (platform in ('web', 'android', 'ios')),
  device_name text,
  app_version text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint device_tokens_token_unique unique (token)
);

comment on table public.device_tokens is
  'FCM registration tokens untuk push notification per perangkat user.';

-- Indexes
create index if not exists idx_device_tokens_user_active
  on public.device_tokens (user_id, is_active)
  where is_active = true;

-- RLS
alter table public.device_tokens enable row level security;

create policy "Users can view own device tokens"
  on public.device_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own device tokens"
  on public.device_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own device tokens"
  on public.device_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own device tokens"
  on public.device_tokens for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 2. NOTIFICATION PREFERENCES
-- ============================================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_preferences_user_unique unique (user_id)
);

comment on table public.notification_preferences is
  'Preferensi notifikasi per user. Satu baris per user.';

-- RLS
alter table public.notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- 3. PUSH STATUS COLUMN ON NOTIFICATIONS
-- ============================================================

alter table public.notifications
  add column if not exists push_status text not null default 'pending'
  check (push_status in ('pending', 'sent', 'skipped', 'failed'));

comment on column public.notifications.push_status is
  'Status pengiriman push notification: pending, sent, skipped, failed.';


-- ============================================================
-- 4. PUSH DELIVERY TRIGGER
-- ============================================================

-- Helper: get Edge Function URL from env or use default Supabase pattern
-- The trigger uses pg_net to make an async HTTP POST to the Edge Function.

create or replace function public.handle_notification_push_delivery()
returns trigger
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_push_enabled boolean;
  v_function_url text;
  v_anon_key text;
  v_request_id bigint;
begin
  -- Check if user has push enabled
  select push_enabled into v_push_enabled
  from public.notification_preferences
  where user_id = new.user_id;

  -- If no preference row exists, default to true (first-time user)
  if v_push_enabled is null then
    v_push_enabled := true;
  end if;

  -- If push disabled, mark as skipped and return
  if not v_push_enabled then
    update public.notifications
    set push_status = 'skipped'
    where id = new.id;
    return new;
  end if;

  -- Check if user has any active device tokens
  if not exists (
    select 1 from public.device_tokens
    where user_id = new.user_id and is_active = true
    limit 1
  ) then
    update public.notifications
    set push_status = 'skipped'
    where id = new.id;
    return new;
  end if;

  -- Build Edge Function URL
  -- Uses SUPABASE_URL which is available in all Supabase environments
  v_function_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    current_setting('pgrst.db_uri', true)
  );

  -- Fallback: read from env variable available in Supabase hosted
  if v_function_url is null or v_function_url = '' then
    -- On hosted Supabase, the URL follows a known pattern
    -- We rely on the pg_net extension to call the edge function
    v_function_url := 'https://ibafjtfzyldycanulfxg.supabase.co';
  end if;

  v_function_url := v_function_url || '/functions/v1/send-push-notification';

  -- Get the service role key for internal calls
  v_anon_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  -- Make async HTTP POST via pg_net
  select net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := jsonb_build_object(
      'notification_id', new.id::text,
      'user_id', new.user_id::text
    )
  ) into v_request_id;

  return new;
end;
$fn$;

alter function public.handle_notification_push_delivery() owner to postgres;

revoke all on function public.handle_notification_push_delivery()
from public, anon, authenticated, service_role;

-- Create the trigger
drop trigger if exists on_notification_push_delivery on public.notifications;

create trigger on_notification_push_delivery
after insert on public.notifications
for each row
execute function public.handle_notification_push_delivery();


-- ============================================================
-- 5. ENABLE pg_net EXTENSION
-- ============================================================

create extension if not exists pg_net with schema extensions;


notify pgrst, 'reload schema';

commit;
