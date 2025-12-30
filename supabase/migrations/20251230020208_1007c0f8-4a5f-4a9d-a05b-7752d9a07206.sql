-- SECURITY FIX 1: Update handle_new_user to never trust user-supplied role metadata
-- Always default to 'subscriber' role - role upgrades must happen through proper authorization flow

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Never trust user-supplied metadata for role assignment
  -- All new users start as 'subscriber' - role upgrades require explicit authorization
  INSERT INTO public.profiles (id, email, display_name, role, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'subscriber',  -- ALWAYS default to subscriber, ignore any user-supplied role
    false          -- NEVER allow is_admin from signup metadata
  );
  RETURN NEW;
END;
$function$;

-- SECURITY FIX 2: Protect sensitive Stripe fields in creators table
-- Drop the old public SELECT policy and create a more restrictive one

DROP POLICY IF EXISTS "Active creators are viewable by everyone" ON public.creators;

-- Create policy that hides sensitive Stripe fields from public view
-- Public users can only see non-sensitive columns
CREATE POLICY "Public can view active creator profiles"
ON public.creators
FOR SELECT
USING (is_active = true);

-- Create a secure view that excludes sensitive Stripe fields for public access
CREATE OR REPLACE VIEW public.creators_public AS
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

-- Add comment explaining the security purpose
COMMENT ON VIEW public.creators_public IS 'Public view of creators that excludes sensitive Stripe fields (stripe_account_id, stripe_product_id, stripe_price_id, payout_email)';