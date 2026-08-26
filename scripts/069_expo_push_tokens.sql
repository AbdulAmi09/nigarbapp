-- Mobile push notifications for the new NCAA Arbiters Expo app
-- (~/Desktop/ncaa-mobile, separate repo). The web app already has a full
-- notification-dispatch pipeline (script 055): every insert into
-- public.notifications fires ONE trigger (dispatch_notification) that
-- gathers the recipient's email + Web Push subscriptions and POSTs them
-- to /api/notifications/dispatch, which does the actual sending. Native
-- mobile push uses a different transport (Expo push tokens, not Web
-- Push/VAPID subscriptions), so it needs its own token table, but it
-- plugs into the exact same trigger and dispatch route rather than a
-- parallel pipeline.

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user_id ON public.device_push_tokens(user_id);

ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_push_tokens_select_own ON public.device_push_tokens;
CREATE POLICY device_push_tokens_select_own ON public.device_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS device_push_tokens_delete_own ON public.device_push_tokens;
CREATE POLICY device_push_tokens_delete_own ON public.device_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Writes go through register_device_push_token() only (mirrors
-- save_push_subscription's pattern) -- same reasons as the web app: the
-- row's user_id must always be the caller's own auth.uid(), never a
-- client-supplied value, and ON CONFLICT upsert-by-token needs to run as
-- a single atomic statement.
CREATE OR REPLACE FUNCTION public.register_device_push_token(p_expo_push_token text, p_platform text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.device_push_tokens (user_id, expo_push_token, platform)
  VALUES (auth.uid(), p_expo_push_token, p_platform)
  ON CONFLICT (expo_push_token) DO UPDATE
  SET user_id = auth.uid(), platform = p_platform, updated_at = now();
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_device_push_token(text, text) TO authenticated;

-- Same reasoning as delete_push_subscription_by_endpoint: the dispatch
-- route calls this with only the anon key (no user session) to prune a
-- token Expo reports as unregistered, so it has to run as SECURITY
-- DEFINER rather than relying on an RLS policy the caller can't satisfy.
CREATE OR REPLACE FUNCTION public.delete_device_push_token(p_expo_push_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.device_push_tokens WHERE expo_push_token = p_expo_push_token;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.delete_device_push_token(text) TO anon, authenticated;

-- Extend the existing dispatch trigger to also gather Expo push tokens
-- and include them in the same webhook payload. Everything else about
-- the trigger (email gating, Web Push gating, the URL/secret) is
-- unchanged from script 055.
CREATE OR REPLACE FUNCTION public.dispatch_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_wants_email boolean;
  v_subs jsonb;
  v_expo_tokens jsonb;
BEGIN
  SELECT p.email, COALESCE(np.email_notifications, true)
  INTO v_email, v_wants_email
  FROM public.profiles p
  LEFT JOIN public.notification_preferences np ON np.user_id = p.id
  WHERE p.id = NEW.recipient_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth_key', auth_key)), '[]'::jsonb)
  INTO v_subs
  FROM public.push_subscriptions
  WHERE user_id = NEW.recipient_id;

  SELECT COALESCE(jsonb_agg(expo_push_token), '[]'::jsonb)
  INTO v_expo_tokens
  FROM public.device_push_tokens
  WHERE user_id = NEW.recipient_id;

  IF (v_wants_email AND v_email IS NOT NULL) OR jsonb_array_length(v_subs) > 0 OR jsonb_array_length(v_expo_tokens) > 0 THEN
    PERFORM net.http_post(
      url := 'https://app.ncaaweb.com.ng/api/notifications/dispatch',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '7cd336c2087a907021bcb2bb4d9b226ac7883a6f117ff013c5637c34ebfab6c1'),
      body := jsonb_build_object(
        'email', CASE WHEN v_wants_email THEN v_email ELSE NULL END,
        'title', NEW.title,
        'message', NEW.message,
        'action_url', NEW.action_url,
        'push_subscriptions', v_subs,
        'expo_push_tokens', v_expo_tokens
      ),
      timeout_milliseconds := 8000
    );
  END IF;

  RETURN NEW;
END;
$function$;
