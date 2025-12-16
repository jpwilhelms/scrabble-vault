-- Step 2: Games table for multiplayer sessions
CREATE TYPE public.game_status AS ENUM ('pending', 'active', 'finished', 'abandoned');

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_turn_player_id UUID REFERENCES public.profiles(id),
  status game_status NOT NULL DEFAULT 'pending',
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  board_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  tile_bag JSONB NOT NULL DEFAULT '[]'::jsonb,
  player1_rack JSONB NOT NULL DEFAULT '[]'::jsonb,
  player2_rack JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_solo BOOLEAN NOT NULL DEFAULT false,
  winner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Players can view games they participate in
CREATE POLICY "Players can view their games"
ON public.games FOR SELECT
USING (
  auth.uid() = player1_id OR 
  auth.uid() = player2_id OR
  (is_solo = true AND auth.uid() = player1_id)
);

-- Player1 can create games
CREATE POLICY "Users can create games"
ON public.games FOR INSERT
WITH CHECK (auth.uid() = player1_id);

-- Players in the game can update it
CREATE POLICY "Players can update their games"
ON public.games FOR UPDATE
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Update timestamp trigger
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for games
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;