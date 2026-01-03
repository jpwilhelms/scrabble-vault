-- 1) Create function to auto-activate game when invitation is accepted
CREATE OR REPLACE FUNCTION public.apply_invitation_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE public.games 
    SET 
      player2_id = NEW.recipient_id,
      status = 'active',
      current_turn_player_id = NEW.sender_id,
      updated_at = now()
    WHERE id = NEW.game_id AND player2_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Create trigger on game_invitations
DROP TRIGGER IF EXISTS on_invitation_accepted ON public.game_invitations;
CREATE TRIGGER on_invitation_accepted
  AFTER UPDATE OF status ON public.game_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_invitation_accept();

-- 3) Backfill: Fix stuck games where invitation was accepted but game not activated
UPDATE public.games g
SET 
  player2_id = i.recipient_id,
  status = 'active',
  current_turn_player_id = i.sender_id,
  updated_at = now()
FROM public.game_invitations i
WHERE i.game_id = g.id 
  AND i.status = 'accepted' 
  AND g.status = 'pending' 
  AND g.player2_id IS NULL;

-- 4) Update SELECT policy to allow invited recipients to see games
DROP POLICY IF EXISTS "Players can view their games" ON public.games;
CREATE POLICY "Players can view their games" 
ON public.games 
FOR SELECT 
USING (
  (auth.uid() = player1_id) OR 
  (auth.uid() = player2_id) OR
  -- Allow invited recipients to see the game
  EXISTS (
    SELECT 1 FROM game_invitations 
    WHERE game_invitations.game_id = games.id 
    AND game_invitations.recipient_id = auth.uid()
    AND game_invitations.status IN ('pending', 'accepted')
  )
);

-- 5) Update UPDATE policy to be more robust (allow accepted invitations too)
DROP POLICY IF EXISTS "Players can update their games" ON public.games;
CREATE POLICY "Players can update their games" 
ON public.games 
FOR UPDATE 
USING (
  (auth.uid() = player1_id) OR 
  (auth.uid() = player2_id) OR
  -- Allow invitation recipients to update games they're invited to
  (status = 'pending' AND EXISTS (
    SELECT 1 FROM game_invitations 
    WHERE game_invitations.game_id = games.id 
    AND game_invitations.recipient_id = auth.uid()
    AND game_invitations.status IN ('pending', 'accepted')
  ))
);