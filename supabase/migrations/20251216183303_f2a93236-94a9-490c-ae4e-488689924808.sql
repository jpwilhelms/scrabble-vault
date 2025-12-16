-- Step 3: Invitations table for game invitations
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE public.game_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_players CHECK (sender_id != recipient_id)
);

-- Enable RLS
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see invitations they sent or received
CREATE POLICY "Users can view their invitations"
ON public.game_invitations FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can create invitations (as sender)
CREATE POLICY "Users can send invitations"
ON public.game_invitations FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Recipients can update invitation status
CREATE POLICY "Recipients can respond to invitations"
ON public.game_invitations FOR UPDATE
USING (auth.uid() = recipient_id);

-- Enable realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invitations;