-- get_or_create_dm_room() was LANGUAGE plpgsql with no SECURITY DEFINER, so
-- it ran under the CALLER's RLS. Same class of bug as the profile-
-- visibility fix in 050: a non-admin starting a brand new DM (no shared
-- room with the other person yet) hit two failures under their own RLS --
-- the profiles SELECT for the room name returned nothing (NULL concat ->
-- NOT NULL violation on chat_rooms.name), and even past that, the
-- group_members insert for the OTHER user's row would be rejected by
-- group_members_insert_self (user_id = auth.uid() only). Reproduced live
-- via psql as a real non-admin user before fixing.
--
-- Made SECURITY DEFINER to bypass both, but added an explicit
-- p_user_id = auth.uid() check so it still can't be used to create a DM
-- "as" someone else -- the original INVOKER version was accidentally safe
-- against that only because RLS happened to block it as a side effect.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_or_create_dm_room(p_user_id uuid, p_other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_room_id uuid;
  v_room_name text;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'p_user_id must match the calling user';
  END IF;

  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE is_direct_message = true
  AND (
    (created_by = p_user_id AND direct_message_with = p_other_user_id)
    OR (created_by = p_other_user_id AND direct_message_with = p_user_id)
  )
  LIMIT 1;

  IF v_room_id IS NOT NULL THEN
    RETURN v_room_id;
  END IF;

  SELECT (first_name || ' ' || last_name) INTO v_room_name FROM public.profiles WHERE id = p_other_user_id;

  INSERT INTO public.chat_rooms (
    name,
    room_type,
    is_private,
    is_direct_message,
    created_by,
    direct_message_with,
    members
  ) VALUES (
    COALESCE(v_room_name, 'Direct Message'),
    'Private',
    true,
    true,
    p_user_id,
    p_other_user_id,
    ARRAY[p_user_id, p_other_user_id]
  )
  RETURNING id INTO v_room_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_room_id, p_user_id, 'member'), (v_room_id, p_other_user_id, 'member');

  RETURN v_room_id;
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
