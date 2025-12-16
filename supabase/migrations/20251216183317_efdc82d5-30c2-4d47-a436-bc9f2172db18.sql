-- Step 4: Turns table for game moves
CREATE TYPE public.turn_status AS ENUM ('pending_validation', 'accepted', 'rejected');

CREATE TABLE public.game_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  tiles_placed JSONB NOT NULL DEFAULT '[]'::jsonb,
  words_formed JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  is_bingo BOOLEAN NOT NULL DEFAULT false,
  status turn_status NOT NULL DEFAULT 'pending_validation',
  rejection_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(game_id, turn_number)
);

-- Enable RLS
ALTER TABLE public.game_turns ENABLE ROW LEVEL SECURITY;

-- Players in the game can view turns
CREATE POLICY "Players can view game turns"
ON public.game_turns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = game_id 
    AND (g.player1_id = auth.uid() OR g.player2_id = auth.uid())
  )
);

-- Players can insert their turns
CREATE POLICY "Players can create turns"
ON public.game_turns FOR INSERT
WITH CHECK (auth.uid() = player_id);

-- Opponent can update turn status (validate/reject)
CREATE POLICY "Opponents can validate turns"
ON public.game_turns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = game_id 
    AND (g.player1_id = auth.uid() OR g.player2_id = auth.uid())
    AND player_id != auth.uid()
  )
);

-- Accepted words list (shared between player pairs)
CREATE TABLE public.accepted_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  player1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_in_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(word, player1_id, player2_id)
);

-- Enable RLS
ALTER TABLE public.accepted_words ENABLE ROW LEVEL SECURITY;

-- Players can view their shared word lists
CREATE POLICY "Players can view accepted words"
ON public.accepted_words FOR SELECT
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Players can insert accepted words
CREATE POLICY "Players can add accepted words"
ON public.accepted_words FOR INSERT
WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_turns;