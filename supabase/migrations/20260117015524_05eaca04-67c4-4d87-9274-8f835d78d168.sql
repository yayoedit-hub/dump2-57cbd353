-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND is_admin = true
  )
$$;

-- Allow admins to view all payouts
CREATE POLICY "Admins can view all payouts"
ON public.creator_payouts
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to update payouts (to mark as completed/failed)
CREATE POLICY "Admins can update payouts"
ON public.creator_payouts
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Allow admins to view all earnings
CREATE POLICY "Admins can view all earnings"
ON public.creator_earnings
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to update earnings status
CREATE POLICY "Admins can update earnings"
ON public.creator_earnings
FOR UPDATE
USING (public.is_admin(auth.uid()));