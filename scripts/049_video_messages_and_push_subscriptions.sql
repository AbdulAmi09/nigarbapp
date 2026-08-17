-- Video message type (chat_messages.message_type CHECK constraint only
-- allowed text/file/image/voice/call) and web push subscriptions, needed
-- for: video messages with inline playback, and push notifications for
-- new messages when the browser tab isn't focused.

BEGIN;

ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_message_type_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type = ANY (ARRAY['text'::text, 'file'::text, 'image'::text, 'voice'::text, 'call'::text, 'video'::text]));

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Postgres RLS note: DELETE/UPDATE still need a SELECT policy to make rows
-- visible to the scan in the first place -- a DELETE-only USING policy on
-- its own left this row invisible and every self-delete silently matched
-- zero rows (caught via psql simulation before shipping any client code).
CREATE POLICY push_subscriptions_select_own ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY push_subscriptions_delete_own ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Upsert as SECURITY DEFINER: a browser push endpoint can outlive an
-- account switch on a shared device, so the existing row's owner may not
-- be the caller. Ownership of the *new* value is enforced by writing
-- auth.uid() directly rather than trusting a p_user_id argument, so this
-- can never be used to reassign a subscription to someone else.
CREATE OR REPLACE FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth_key)
  VALUES (auth.uid(), p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
  SET user_id = auth.uid(), p256dh = p_p256dh, auth_key = p_auth;
END;
$function$;

-- Lets a message sender fetch push targets for a room without granting
-- general read access to other users' subscription rows. Re-validates
-- the caller is both the claimed sender and an actual room member
-- server-side (never trusts the client-supplied room/sender pair alone).
CREATE OR REPLACE FUNCTION public.get_push_recipients(p_room_id uuid, p_sender_id uuid)
 RETURNS TABLE (user_id uuid, endpoint text, p256dh text, auth_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_sender_id <> auth.uid() OR NOT public.is_group_member(p_room_id, auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ps.user_id, ps.endpoint, ps.p256dh, ps.auth_key
  FROM public.push_subscriptions ps
  WHERE ps.user_id <> p_sender_id
  AND public.is_group_member(p_room_id, ps.user_id);
END;
$function$;

-- Lets the push-send API route prune dead subscriptions (410 Gone from the
-- push service) without needing broad delete rights on the table.
CREATE OR REPLACE FUNCTION public.delete_push_subscription_by_endpoint(p_endpoint text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
