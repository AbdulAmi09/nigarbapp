-- Pre-pilot critical fixes, all confirmed against live production schema.
--
-- 1. handle_assignment_status_change wrote an invalid action_type enum value
--    ('Status_Update' isn't a real label of the action_type enum), which threw
--    and rolled back every Accept/Decline on an assignment.
-- 2. get_arbiter_activity_summary compared payment_status to 'Paid'/'Pending'
--    but the live enum is lowercase, so every call threw and dashboard/profile
--    stats always read 0.
-- 3 & 4. search_users_for_dm and get_or_create_dm_room both referenced a
--    profiles.name column that doesn't exist (real columns: first_name,
--    last_name), breaking DM search and DM room creation outright.
-- 5. unread_messages had RLS on with no INSERT policy, so the trigger that
--    tracks unread counts for other room members failed and rolled back the
--    triggering chat message insert whenever a brand-new row was needed
--    (i.e. the first message in any new conversation).
-- 6. profiles RLS allowed any authenticated user to update any column on
--    their own row, including arbiter_level/is_verified/rating/role — the
--    app-layer allowlist fix doesn't help since nothing in the app calls
--    that route; every real edit surface writes to Supabase directly. This
--    adds the actual gate at the database layer via a BEFORE UPDATE trigger.

BEGIN;

-- 1. Fix invalid action_type enum literal in the assignment-status trigger.
CREATE OR REPLACE FUNCTION public.handle_assignment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.assignment_status != OLD.assignment_status THEN
    INSERT INTO public.notifications (
      recipient_id,
      notification_type,
      action_type,
      title,
      message,
      related_id,
      action_url,
      action_required,
      is_read,
      created_at
    ) VALUES (
      NEW.arbiter_id::uuid,
      'assignment',
      'Tournament_assignment',
      'Assignment Status Updated',
      'Your assignment status for ' || NEW.tournament_name || ' has been updated to ' || NEW.assignment_status,
      NEW.id,
      '/dashboard/tournament-assignment',
      false,
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Fix payment_status enum casing (live values are lowercase).
CREATE OR REPLACE FUNCTION public.get_arbiter_activity_summary(arbiter_uuid uuid)
 RETURNS TABLE(total_assignments bigint, completed_assignments bigint, pending_assignments bigint, total_earnings numeric, pending_payments numeric, average_rating numeric, tournaments_this_month bigint, next_assignment_date date)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(ta.id) as total_assignments,
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Completed') as completed_assignments,
    COUNT(ta.id) FILTER (WHERE ta.assignment_status = 'Pending') as pending_assignments,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'paid'), 0) as total_earnings,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'pending'), 0) as pending_payments,
    public.calculate_arbiter_rating(arbiter_uuid) as average_rating,
    COUNT(ta.id) FILTER (WHERE t.start_date >= DATE_TRUNC('month', CURRENT_DATE)) as tournaments_this_month,
    MIN(t.start_date) FILTER (WHERE t.start_date > CURRENT_DATE AND ta.assignment_status = 'Accepted') as next_assignment_date
  FROM public.tournament_assignments ta
  LEFT JOIN public.tournaments t ON ta.tournament_id = t.id
  LEFT JOIN public.payments p ON ta.arbiter_id = p.arbiter_id
  WHERE ta.arbiter_id = arbiter_uuid;
END;
$function$;

-- 3. Fix nonexistent profiles.name / arbiter_category in DM user search.
CREATE OR REPLACE FUNCTION public.search_users_for_dm(p_search_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, email text, avatar_url text, arbiter_category text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, (p.first_name || ' ' || p.last_name) AS name, p.email, p.avatar_url, p.arbiter_level::text AS arbiter_category
  FROM public.profiles p
  WHERE (p.first_name ILIKE '%' || p_search_query || '%'
     OR p.last_name ILIKE '%' || p_search_query || '%'
     OR p.email ILIKE '%' || p_search_query || '%')
  AND p.id != auth.uid()
  LIMIT p_limit;
END;
$function$;

-- 4. Fix nonexistent profiles.name when naming a new DM room.
CREATE OR REPLACE FUNCTION public.get_or_create_dm_room(p_user_id uuid, p_other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_room_id uuid;
  v_room_name text;
BEGIN
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
    v_room_name,
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

-- 5. Allow the unread-count trigger to insert rows for other room members.
CREATE POLICY unread_messages_insert_authenticated ON public.unread_messages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Lock arbiter credential fields behind admin-only writes at the DB layer.
-- auth.role() = 'service_role' is allowed through because that role already
-- bypasses RLS entirely for trusted backend/service callers; this trigger
-- only needs to stop a regular authenticated arbiter from editing their own
-- credentials, not trusted server-side tooling.
CREATE OR REPLACE FUNCTION public.protect_profile_credentials()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.is_main_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.arbiter_level IS DISTINCT FROM OLD.arbiter_level
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.license_number IS DISTINCT FROM OLD.license_number
     OR NEW.license_expiry IS DISTINCT FROM OLD.license_expiry
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.tournaments_officiated IS DISTINCT FROM OLD.tournaments_officiated
  THEN
    RAISE EXCEPTION 'Only an administrator can change arbiter credential fields';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_profile_credentials ON public.profiles;
CREATE TRIGGER trg_protect_profile_credentials
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_credentials();

COMMIT;
