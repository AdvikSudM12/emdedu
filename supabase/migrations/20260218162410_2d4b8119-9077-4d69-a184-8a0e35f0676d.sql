
-- =====================================================
-- FIX: Drop ALL existing policies and recreate as PERMISSIVE
-- In PostgreSQL, CREATE POLICY without AS RESTRICTIVE = PERMISSIVE by default
-- Previous policies may have been created with AS RESTRICTIVE flag
-- =====================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---- questions ----
DROP POLICY IF EXISTS "Authenticated users can post questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read non-hidden questions" ON public.questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;

CREATE POLICY "questions_select" ON public.questions
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_hidden = false) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "questions_insert" ON public.questions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "questions_update" ON public.questions
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "questions_delete" ON public.questions
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- ---- answers ----
DROP POLICY IF EXISTS "Authenticated users can post answers" ON public.answers;
DROP POLICY IF EXISTS "Authenticated users can read answers" ON public.answers;
DROP POLICY IF EXISTS "Users can update their own answers or mark best" ON public.answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON public.answers;

CREATE POLICY "answers_select" ON public.answers
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "answers_insert" ON public.answers
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "answers_update" ON public.answers
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "answers_delete" ON public.answers
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- ---- lessons ----
DROP POLICY IF EXISTS "Authenticated users can read lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON public.lessons;

CREATE POLICY "lessons_select" ON public.lessons
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "lessons_insert" ON public.lessons
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "lessons_update" ON public.lessons
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "lessons_delete" ON public.lessons
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ---- prompts ----
DROP POLICY IF EXISTS "Authenticated users can read prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can insert prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can update prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can delete prompts" ON public.prompts;

CREATE POLICY "prompts_select" ON public.prompts
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "prompts_insert" ON public.prompts
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "prompts_update" ON public.prompts
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "prompts_delete" ON public.prompts
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ---- wiki_articles ----
DROP POLICY IF EXISTS "Authenticated users can read wiki" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can insert wiki" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can update wiki" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can delete wiki" ON public.wiki_articles;

CREATE POLICY "wiki_select" ON public.wiki_articles
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "wiki_insert" ON public.wiki_articles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "wiki_update" ON public.wiki_articles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "wiki_delete" ON public.wiki_articles
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ---- user_roles ----
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_insert" ON public.user_roles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_update" ON public.user_roles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_delete" ON public.user_roles
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- Ensure handle_new_user trigger exists
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
