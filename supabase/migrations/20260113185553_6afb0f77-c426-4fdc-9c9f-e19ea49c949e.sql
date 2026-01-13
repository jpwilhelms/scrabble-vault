-- Fix played_words RLS: Require authentication
DROP POLICY IF EXISTS "Anyone can read played words" ON public.played_words;
DROP POLICY IF EXISTS "Anyone can insert played words" ON public.played_words;

CREATE POLICY "Authenticated users can read played words"
  ON public.played_words FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert played words"
  ON public.played_words FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix profiles RLS: Require authentication to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix dictionary RLS: Remove public insert policy (edge function uses service role which bypasses RLS)
DROP POLICY IF EXISTS "Authenticated users can insert words" ON public.dictionary;

-- Only allow reading dictionary for authenticated users (insert only via service role/edge function)
DROP POLICY IF EXISTS "Anyone can read dictionary" ON public.dictionary;

CREATE POLICY "Authenticated users can read dictionary"
  ON public.dictionary FOR SELECT
  USING (auth.uid() IS NOT NULL);