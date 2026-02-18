
-- Drop and recreate ALL policies as PERMISSIVE (AS PERMISSIVE is the default, RESTRICTIVE was the bug)

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- QUESTIONS
DROP POLICY IF EXISTS "questions_select" ON public.questions;
DROP POLICY IF EXISTS "questions_insert" ON public.questions;
DROP POLICY IF EXISTS "questions_update" ON public.questions;
DROP POLICY IF EXISTS "questions_delete" ON public.questions;

CREATE POLICY "questions_select" ON public.questions AS PERMISSIVE FOR SELECT TO authenticated USING ((is_hidden = false) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "questions_insert" ON public.questions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "questions_update" ON public.questions AS PERMISSIVE FOR UPDATE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "questions_delete" ON public.questions AS PERMISSIVE FOR DELETE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- ANSWERS
DROP POLICY IF EXISTS "answers_select" ON public.answers;
DROP POLICY IF EXISTS "answers_insert" ON public.answers;
DROP POLICY IF EXISTS "answers_update" ON public.answers;
DROP POLICY IF EXISTS "answers_delete" ON public.answers;

CREATE POLICY "answers_select" ON public.answers AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "answers_insert" ON public.answers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "answers_update" ON public.answers AS PERMISSIVE FOR UPDATE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "answers_delete" ON public.answers AS PERMISSIVE FOR DELETE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- LESSONS
DROP POLICY IF EXISTS "lessons_select" ON public.lessons;
DROP POLICY IF EXISTS "lessons_insert" ON public.lessons;
DROP POLICY IF EXISTS "lessons_update" ON public.lessons;
DROP POLICY IF EXISTS "lessons_delete" ON public.lessons;

CREATE POLICY "lessons_select" ON public.lessons AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons_insert" ON public.lessons AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "lessons_update" ON public.lessons AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "lessons_delete" ON public.lessons AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- PROMPTS
DROP POLICY IF EXISTS "prompts_select" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete" ON public.prompts;

CREATE POLICY "prompts_select" ON public.prompts AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompts_insert" ON public.prompts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "prompts_update" ON public.prompts AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "prompts_delete" ON public.prompts AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- WIKI
DROP POLICY IF EXISTS "wiki_select" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_insert" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_update" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_delete" ON public.wiki_articles;

CREATE POLICY "wiki_select" ON public.wiki_articles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "wiki_insert" ON public.wiki_articles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "wiki_update" ON public.wiki_articles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "wiki_delete" ON public.wiki_articles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- USER_ROLES
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user_roles_insert" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user_roles_update" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user_roles_delete" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Also ensure the trigger exists for auto-creating profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
