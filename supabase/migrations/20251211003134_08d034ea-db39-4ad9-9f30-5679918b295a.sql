-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Schools table
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  spots_total integer NOT NULL DEFAULT 50,
  spots_remaining integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active schools"
ON public.schools FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage schools"
ON public.schools FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Personality traits table
CREATE TABLE public.personality_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personality_traits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active traits"
ON public.personality_traits FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage traits"
ON public.personality_traits FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Interests table
CREATE TABLE public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active interests"
ON public.interests FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage interests"
ON public.interests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Venue types table
CREATE TABLE public.venue_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active venues"
ON public.venue_types FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage venues"
ON public.venue_types FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Challenges table
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 5,
  verification_type text NOT NULL DEFAULT 'honor',
  icon text,
  external_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
ON public.challenges FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
ON public.challenges FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Ambassador types table
CREATE TABLE public.ambassador_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  assignment_weight integer NOT NULL DEFAULT 16,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassador_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ambassador types"
ON public.ambassador_types FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage ambassador types"
ON public.ambassador_types FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Settings table (key-value store)
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
ON public.settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin notes table
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES public.applicants(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notes"
ON public.admin_notes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add status column to applicants
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Seed schools
INSERT INTO public.schools (name, spots_total, spots_remaining, sort_order) VALUES
('University of Toronto', 50, 50, 1),
('York University', 50, 50, 2),
('Toronto Metropolitan University', 50, 50, 3),
('Western University', 50, 50, 4),
('McMaster University', 50, 50, 5),
('University of Waterloo', 50, 50, 6),
('Wilfrid Laurier University', 50, 50, 7),
('University of Ottawa', 50, 50, 8),
('Queen''s University', 50, 50, 9),
('University of Guelph', 50, 50, 10);

-- Seed personality traits
INSERT INTO public.personality_traits (label, emoji, sort_order) VALUES
('Outgoing', '🎉', 1),
('Creative', '🎨', 2),
('Chill', '😎', 3),
('Hustler', '💪', 4),
('Trendsetter', '✨', 5),
('Connector', '🤝', 6),
('Leader', '👑', 7),
('Wild Card', '🃏', 8);

-- Seed interests
INSERT INTO public.interests (label, emoji, sort_order) VALUES
('Sports', '⚽', 1),
('Gaming', '🎮', 2),
('Music', '🎵', 3),
('Fashion', '👗', 4),
('Fitness', '💪', 5),
('Food & Drink', '🍕', 6),
('Tech', '💻', 7),
('Nightlife', '🌙', 8),
('Content Creation', '📱', 9);

-- Seed venue types
INSERT INTO public.venue_types (label, emoji, sort_order) VALUES
('Campus bars', '🍺', 1),
('House parties', '🏠', 2),
('Club venues', '🎶', 3),
('Campus events', '🎓', 4),
('Sporting events', '🏟️', 5),
('Coffee shops', '☕', 6),
('Gyms', '🏋️', 7),
('Gaming lounges', '🕹️', 8);

-- Seed challenges
INSERT INTO public.challenges (title, description, points, verification_type, icon, external_url, sort_order) VALUES
('Follow @getsauce on TikTok', 'Show us some love on TikTok', 5, 'honor', 'Users', 'https://tiktok.com/@getsauce', 1),
('Post story tagging @getsauce', 'Tag us in your Instagram story', 10, 'screenshot', 'Share2', NULL, 2),
('Refer a friend who applies', 'Share your unique link', 20, 'auto', 'UserPlus', NULL, 3),
('Complete Brand Quiz', 'Test your brand knowledge', 10, 'honor', 'Award', NULL, 4);

-- Seed ambassador types
INSERT INTO public.ambassador_types (name, description, assignment_weight) VALUES
('The Connector', 'You know everyone and everyone knows you. Your network is your superpower.', 17),
('The Content King', 'Your content game is unmatched. Every post is a vibe.', 17),
('The Party Starter', 'Where you go, the party follows. You set the energy.', 16),
('The Hype Machine', 'You can sell ice to a penguin. Your enthusiasm is contagious.', 17),
('The Trendsetter', 'You don''t follow trends, you create them.', 17),
('The Insider', 'You always know what''s happening before anyone else.', 16);

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
('agency_name', '"Sauce"'),
('contact_email', '"hello@getsauce.co"'),
('email_requirement', '"end"'),
('age_gate_enabled', 'true'),
('minimum_age', '19'),
('waitlist_start_min', '1'),
('waitlist_start_max', '100'),
('notify_on_apply', 'false'),
('max_personality_traits', '3'),
('max_interests', '0');