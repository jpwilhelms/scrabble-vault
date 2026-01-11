-- Create dictionary table for caching valid words
CREATE TABLE public.dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dictionary ENABLE ROW LEVEL SECURITY;

-- Everyone can read the dictionary
CREATE POLICY "Dictionary is readable by everyone" 
ON public.dictionary 
FOR SELECT 
USING (true);

-- Authenticated users can insert words (via edge function or direct)
CREATE POLICY "Authenticated users can insert words" 
ON public.dictionary 
FOR INSERT 
WITH CHECK (true);

-- Create index for fast word lookups
CREATE INDEX idx_dictionary_word ON public.dictionary(word);