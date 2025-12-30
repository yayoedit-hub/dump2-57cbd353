-- Fix: Remove SECURITY DEFINER from the view by recreating it with security_invoker = true
DROP VIEW IF EXISTS public.creators_public;

-- Recreate view with security_invoker to respect RLS of the querying user
CREATE VIEW public.creators_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  handle,
  bio,
  tags,
  price_usd,
  license_type,
  back_catalog_access,
  banner_url,
  youtube_url,
  instagram_url,
  website_url,
  spotify_url,
  soundcloud_url,
  user_id,
  is_active,
  created_at,
  updated_at
FROM public.creators
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.creators_public TO anon, authenticated;

COMMENT ON VIEW public.creators_public IS 'Public view of creators that excludes sensitive Stripe fields (stripe_account_id, stripe_product_id, stripe_price_id, payout_email). Uses security_invoker to respect RLS.';

-- Fix profiles email exposure: Create a public view that excludes email
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  role,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the profiles view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

COMMENT ON VIEW public.profiles_public IS 'Public view of profiles that excludes sensitive email addresses.';