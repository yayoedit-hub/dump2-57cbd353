-- Add social link fields to creators table
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS soundcloud_url text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS spotify_url text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS youtube_url text;