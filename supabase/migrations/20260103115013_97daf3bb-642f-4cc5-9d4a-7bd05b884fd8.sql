-- Drop the existing UPDATE policy on games
DROP POLICY IF EXISTS "Players can update their games" ON public.games;

-- Create a new policy that also allows invitation recipients to update games they're invited to
CREATE POLICY "Players can update their games" 
ON public.games 
FOR UPDATE 
USING (
  (auth.uid() = player1_id) OR 
  (auth.uid() = player2_id) OR
  -- Allow invitation recipients to update pending games
  (status = 'pending' AND EXISTS (
    SELECT 1 FROM game_invitations 
    WHERE game_invitations.game_id = games.id 
    AND game_invitations.recipient_id = auth.uid()
    AND game_invitations.status = 'pending'
  ))
);