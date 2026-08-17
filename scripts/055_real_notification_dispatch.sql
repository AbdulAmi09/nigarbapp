-- Makes the notification_preferences table actually do something. Every
-- notification in this app already funnels through a single INSERT into
-- public.notifications (from API routes, the tournament-evaluation modal,
-- and several DB-side triggers: handle_assignment_status_change,
-- notify_discussion_reply, record_paystack_payment, send_notification).
-- Rather than hooking each of those call sites individually, this adds ONE
-- AFTER INSERT trigger on notifications itself, so every notification --
-- regardless of source -- gets a chance to go out as email/push too.
--
-- pg_net lets a Postgres trigger fire an async HTTP POST without blocking
-- the insert. The trigger builds the whole payload itself (recipient's
-- email + this device's push subscriptions), so the receiving Next.js
-- route needs no database access of its own -- no service-role key
-- required anywhere in this flow, consistent with how the rest of this
-- app's server-to-server calls are built.
--
-- Push notifications are gated purely by whether a push_subscriptions row
-- exists (i.e. the user has actually subscribed in Settings) -- that
-- existence check IS the on/off switch, so there's no separate boolean to
-- keep in sync. Email is gated by notification_preferences.email_notifications
-- (defaults to true if the user has no preferences row yet).

CREATE EXTENSION IF NOT EXISTS pg_net;

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

  IF (v_wants_email AND v_email IS NOT NULL) OR jsonb_array_length(v_subs) > 0 THEN
    PERFORM net.http_post(
      url := 'https://app.ncaaweb.com.ng/api/notifications/dispatch',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '7cd336c2087a907021bcb2bb4d9b226ac7883a6f117ff013c5637c34ebfab6c1'),
      body := jsonb_build_object(
        'email', CASE WHEN v_wants_email THEN v_email ELSE NULL END,
        'title', NEW.title,
        'message', NEW.message,
        'action_url', NEW.action_url,
        'push_subscriptions', v_subs
      ),
      timeout_milliseconds := 8000
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_dispatch_notification ON public.notifications;
CREATE TRIGGER tr_dispatch_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification();
