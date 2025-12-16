-- Create enums
CREATE TYPE public.user_role AS ENUM ('subscriber', 'creator', 'both');
CREATE TYPE public.license_type AS ENUM ('personal_only', 'commercial_with_credit');
CREATE TYPE public.pack_type AS ENUM ('flp_only', 'zipped_project', 'compatible_pack');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due');
CREATE TYPE public.report_status AS ENUM ('open', 'resolved');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'subscriber',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create creators table
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT,
  tags TEXT[] DEFAULT '{}',
  banner_url TEXT,
  price_usd INTEGER DEFAULT 5,
  license_type license_type DEFAULT 'personal_only',
  back_catalog_access BOOLEAN DEFAULT true,
  stripe_account_id TEXT,
  payout_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create dump_packs table
CREATE TABLE public.dump_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bpm INTEGER,
  key TEXT,
  tags TEXT[] DEFAULT '{}',
  pack_type pack_type NOT NULL,
  preview_path TEXT NOT NULL,
  project_zip_path TEXT,
  flp_path TEXT,
  stems_zip_path TEXT,
  midi_zip_path TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  status subscription_status DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(subscriber_id, creator_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dump_pack_id UUID REFERENCES public.dump_packs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dump_pack_id UUID REFERENCES public.dump_packs(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dump_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Creators policies
CREATE POLICY "Active creators are viewable by everyone" ON public.creators
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create their own creator profile" ON public.creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update their own profile" ON public.creators
  FOR UPDATE USING (auth.uid() = user_id);

-- Dump packs policies
CREATE POLICY "Non-deleted packs are viewable by everyone" ON public.dump_packs
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Creators can insert their own packs" ON public.dump_packs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.creators WHERE id = creator_id AND user_id = auth.uid())
  );

CREATE POLICY "Creators can update their own packs" ON public.dump_packs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.creators WHERE id = creator_id AND user_id = auth.uid())
  );

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = subscriber_id);

CREATE POLICY "Creators can view subscriptions to them" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.creators WHERE id = creator_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = subscriber_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Subscribers can comment on packs they have access to" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.dump_packs dp ON dp.creator_id = s.creator_id
      WHERE dp.id = dump_pack_id AND s.subscriber_id = auth.uid() AND s.status = 'active'
    )
  );

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'subscriber')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dump_packs_updated_at
  BEFORE UPDATE ON public.dump_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for dumps
INSERT INTO storage.buckets (id, name, public) VALUES ('dumps', 'dumps', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('previews', 'previews', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for previews (public read)
CREATE POLICY "Previews are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'previews');

CREATE POLICY "Creators can upload previews" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'previews' AND
    EXISTS (SELECT 1 FROM public.creators WHERE user_id = auth.uid())
  );

-- Storage policies for dumps (restricted)
CREATE POLICY "Creators can upload to dumps bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dumps' AND
    EXISTS (SELECT 1 FROM public.creators WHERE user_id = auth.uid())
  );

CREATE POLICY "Creators can access their own dumps" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dumps' AND
    EXISTS (SELECT 1 FROM public.creators WHERE user_id = auth.uid())
  );

CREATE POLICY "Subscribers can download dumps they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dumps' AND
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.creators c ON c.id = s.creator_id
      WHERE s.subscriber_id = auth.uid() AND s.status = 'active'
    )
  );

-- Storage policies for avatars
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );