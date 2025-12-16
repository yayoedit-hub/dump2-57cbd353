-- Add Stripe fields to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add stripe_customer_id to subscriptions if not present
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;