-- Activates the production notification pipeline without changing its schema.
-- Delivery configuration is read from Supabase Vault at runtime:
--   humob_project_url
--   humob_rating_job_secret

CREATE UNIQUE INDEX IF NOT EXISTS notifications_rating_ready_dedup_idx
  ON public.notifications (user_id, (payload ->> 'daily_match_id'))
  WHERE type = 'rating_ready'::public.notification_type
    AND payload ->> 'event' = 'rating_ready';

CREATE UNIQUE INDEX IF NOT EXISTS notifications_achievement_dedup_idx
  ON public.notifications (user_id, (payload ->> 'achievement_key'))
  WHERE type = 'achievement'::public.notification_type
    AND payload ->> 'event' = 'achievement';

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notification_id uuid;
  v_dedup_key text;
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL OR p_message IS NULL THEN
    RAISE EXCEPTION 'Notification user, title, and message are required';
  END IF;

  IF p_type = 'rating_ready'::public.notification_type THEN
    v_dedup_key := NULLIF(p_payload ->> 'daily_match_id', '');

    IF p_payload ->> 'event' IS DISTINCT FROM 'rating_ready' OR v_dedup_key IS NULL
      OR NULLIF(p_payload ->> 'rating_id', '') IS NULL THEN
      RAISE EXCEPTION 'rating_ready notification payload is invalid';
    END IF;
  ELSIF p_type = 'achievement'::public.notification_type THEN
    v_dedup_key := NULLIF(p_payload ->> 'achievement_key', '');

    IF p_payload ->> 'event' IS DISTINCT FROM 'achievement' OR v_dedup_key IS NULL THEN
      RAISE EXCEPTION 'achievement notification payload is invalid';
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    payload,
    delivery_status
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    COALESCE(p_payload, '{}'::jsonb),
    'pending'::public.notification_delivery_status
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NOT NULL THEN
    RETURN v_notification_id;
  END IF;

  IF p_type = 'rating_ready'::public.notification_type THEN
    SELECT id
      INTO v_notification_id
      FROM public.notifications
      WHERE user_id = p_user_id
        AND type = p_type
        AND payload ->> 'event' = 'rating_ready'
        AND payload ->> 'daily_match_id' = v_dedup_key
      ORDER BY created_at DESC
      LIMIT 1;
  ELSIF p_type = 'achievement'::public.notification_type THEN
    SELECT id
      INTO v_notification_id
      FROM public.notifications
      WHERE user_id = p_user_id
        AND type = p_type
        AND payload ->> 'event' = 'achievement'
        AND payload ->> 'achievement_key' = v_dedup_key
      ORDER BY created_at DESC
      LIMIT 1;
  END IF;

  RETURN v_notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_daily_rating_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.overall_rating IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'rating_ready'::public.notification_type,
      'Rating selesai',
      'Rating harian kamu sudah tersedia. Lihat performamu sekarang.',
      jsonb_build_object(
        'event', 'rating_ready',
        'daily_match_id', NEW.daily_match_id,
        'rating_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_achievement_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_achievement_key text;
BEGIN
  SELECT code
    INTO v_achievement_key
    FROM public.achievements
    WHERE id = NEW.achievement_id;

  IF v_achievement_key IS NULL THEN
    RAISE WARNING 'Achievement notification skipped because achievement code is missing';
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    NEW.user_id,
    'achievement'::public.notification_type,
    'Achievement baru terbuka',
    'Selamat! Kamu berhasil membuka achievement baru.',
    jsonb_build_object(
      'event', 'achievement',
      'achievement_key', v_achievement_key
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_notification_push_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_url text;
  v_push_secret text;
BEGIN
  SELECT decrypted_secret
    INTO v_project_url
    FROM vault.decrypted_secrets
    WHERE name = 'humob_project_url'
    LIMIT 1;

  SELECT decrypted_secret
    INTO v_push_secret
    FROM vault.decrypted_secrets
    WHERE name = 'humob_rating_job_secret'
    LIMIT 1;

  IF NULLIF(BTRIM(v_project_url), '') IS NULL
    OR NULLIF(BTRIM(v_push_secret), '') IS NULL THEN
    UPDATE public.notifications
      SET delivery_status = 'failed'::public.notification_delivery_status,
          error_message = 'PUSH_DELIVERY_CONFIGURATION_MISSING'
      WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := RTRIM(v_project_url, '/') || '/functions/v1/send-push-notification',
    body := jsonb_build_object('notification_id', NEW.id),
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-humob-push-secret', v_push_secret
    ),
    timeout_milliseconds := 10000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_ratings_create_notification ON public.daily_ratings;
CREATE TRIGGER daily_ratings_create_notification
  AFTER INSERT ON public.daily_ratings
  FOR EACH ROW
  WHEN (NEW.overall_rating IS NOT NULL)
  EXECUTE FUNCTION public.handle_daily_rating_notification();

DROP TRIGGER IF EXISTS user_achievements_create_notification ON public.user_achievements;
CREATE TRIGGER user_achievements_create_notification
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_achievement_notification();

DROP TRIGGER IF EXISTS notifications_enqueue_push_delivery ON public.notifications;
CREATE TRIGGER notifications_enqueue_push_delivery
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notification_push_delivery();

REVOKE ALL ON FUNCTION public.create_notification(
  uuid,
  public.notification_type,
  text,
  text,
  jsonb
) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_daily_rating_notification()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_user_achievement_notification()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_notification_push_delivery()
  FROM PUBLIC, anon, authenticated;
