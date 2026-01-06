-- Add column to track consecutive passes for game end condition
ALTER TABLE public.games ADD COLUMN consecutive_passes integer NOT NULL DEFAULT 0;