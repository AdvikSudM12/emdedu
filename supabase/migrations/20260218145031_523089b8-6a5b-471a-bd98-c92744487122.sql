
-- ============================================================
-- Academy LMS — Full Database Schema
-- ============================================================

-- 1. Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. user_roles table (roles stored separately, never on profiles)
CREATE TABLE public.user_roles (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role      public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security-definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

-- 4. profiles table
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. lessons
CREATE TABLE public.lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  thumbnail_url TEXT,
  category      TEXT NOT NULL DEFAULT 'General',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 6. wiki_articles
CREATE TABLE public.wiki_articles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;

-- 7. prompts
CREATE TABLE public.prompts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'General',
  prompt_text TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- 8. questions
CREATE TABLE public.questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  is_hidden  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 9. answers
CREATE TABLE public.answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  is_best     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Storage bucket for avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Trigger: auto-create profile + user role on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wiki_articles_updated_at
  BEFORE UPDATE ON public.wiki_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS Policies — user_roles
-- ============================================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS Policies — profiles
-- ============================================================
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RLS Policies — lessons
-- ============================================================
CREATE POLICY "Authenticated users can read lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lessons"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS Policies — wiki_articles
-- ============================================================
CREATE POLICY "Authenticated users can read wiki"
  ON public.wiki_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert wiki"
  ON public.wiki_articles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wiki"
  ON public.wiki_articles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wiki"
  ON public.wiki_articles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS Policies — prompts
-- ============================================================
CREATE POLICY "Authenticated users can read prompts"
  ON public.prompts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert prompts"
  ON public.prompts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompts"
  ON public.prompts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete prompts"
  ON public.prompts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS Policies — questions
-- ============================================================
CREATE POLICY "Authenticated users can read non-hidden questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (is_hidden = false OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can post questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS Policies — answers
-- ============================================================
CREATE POLICY "Authenticated users can read answers"
  ON public.answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can post answers"
  ON public.answers FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own answers or mark best"
  ON public.answers FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own answers"
  ON public.answers FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Storage RLS — avatars bucket
-- ============================================================
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
