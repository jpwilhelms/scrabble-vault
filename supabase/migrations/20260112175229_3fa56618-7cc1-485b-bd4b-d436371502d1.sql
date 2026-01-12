-- Add last_move_type to games table to track pass/exchange for opponent notification
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS last_move_type TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.games.last_move_type IS 'Type of last move: word, pass, or exchange - used to notify opponent';