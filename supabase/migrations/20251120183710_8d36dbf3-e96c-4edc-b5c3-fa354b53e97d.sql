-- Tabelle für gespeicherte Wörter
CREATE TABLE IF NOT EXISTS public.played_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  points INTEGER NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('horizontal', 'vertical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.played_words ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann Wörter lesen (öffentlich)
CREATE POLICY "Anyone can read played words"
  ON public.played_words
  FOR SELECT
  USING (true);

-- Policy: Jeder kann Wörter einfügen (öffentlich)
CREATE POLICY "Anyone can insert played words"
  ON public.played_words
  FOR INSERT
  WITH CHECK (true);