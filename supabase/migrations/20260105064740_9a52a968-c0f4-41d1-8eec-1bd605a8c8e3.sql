-- Allow users to delete their own pending invitations
CREATE POLICY "Senders can delete pending invitations"
ON public.game_invitations
FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- Allow users to delete pending games they created
CREATE POLICY "Players can delete pending games"
ON public.games
FOR DELETE
USING (auth.uid() = player1_id AND status = 'pending');