-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.tournament_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_committees_updated_at
  BEFORE UPDATE ON public.committees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to send notification on new assignment
CREATE OR REPLACE FUNCTION public.notify_assignment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  tournament_name TEXT;
BEGIN
  SELECT name INTO tournament_name
  FROM public.tournaments
  WHERE id = NEW.tournament_id;
  
  PERFORM public.send_notification(
    NEW.arbiter_id,
    NEW.assigned_by,
    'New Tournament Assignment',
    'You have been assigned to officiate ' || tournament_name || ' as ' || NEW.role,
    'Assignment',
    NEW.id,
    '/dashboard/tournament-assignment'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_assignment_created
  AFTER INSERT ON public.tournament_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_assignment_created();

-- Trigger to update tournament participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
