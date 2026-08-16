-- Emoji reactions (new table) and call history appearing inline in a chat
-- thread (chat_messages gets a new 'call' message_type — the existing
-- CHECK constraint only allowed text/file/image/voice).

BEGIN;

CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions are visible to anyone who can see the message's room, matching
-- the same room-membership check chat_messages itself uses.
CREATE POLICY message_reactions_select_room_member ON public.message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_rooms cr ON cr.id = cm.room_id
      WHERE cm.id = message_reactions.message_id
      AND ((NOT cr.is_private) OR (auth.uid() = ANY (cr.members)) OR (auth.uid() = cr.created_by)
           OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = cr.id AND gm.user_id = auth.uid()))
    )
  );

CREATE POLICY message_reactions_insert_own ON public.message_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY message_reactions_delete_own ON public.message_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_message_type_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type = ANY (ARRAY['text'::text, 'file'::text, 'image'::text, 'voice'::text, 'call'::text]));

COMMIT;

NOTIFY pgrst, 'reload schema';
