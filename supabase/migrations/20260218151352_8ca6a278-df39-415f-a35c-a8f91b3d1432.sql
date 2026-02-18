
-- Drop and recreate all RLS policies as PERMISSIVE (they were created as RESTRICTIVE which blocks inserts)

-- Fix questions policies
DROP POLICY IF EXISTS "Authenticated users can post questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read non-hidden questions" ON public.questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;

CREATE POLICY "Authenticated users can post questions" ON public.questions
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authenticated users can read non-hidden questions" ON public.questions
  FOR SELECT TO authenticated USING ((is_hidden = false) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own questions" ON public.questions
  FOR UPDATE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions" ON public.questions
  FOR DELETE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix answers policies
DROP POLICY IF EXISTS "Authenticated users can post answers" ON public.answers;
DROP POLICY IF EXISTS "Authenticated users can read answers" ON public.answers;
DROP POLICY IF EXISTS "Users can update their own answers or mark best" ON public.answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON public.answers;

CREATE POLICY "Authenticated users can post answers" ON public.answers
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authenticated users can read answers" ON public.answers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own answers or mark best" ON public.answers
  FOR UPDATE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own answers" ON public.answers
  FOR DELETE TO authenticated USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix lessons policies
DROP POLICY IF EXISTS "Authenticated users can read lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON public.lessons;

CREATE POLICY "Authenticated users can read lessons" ON public.lessons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert lessons" ON public.lessons
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lessons" ON public.lessons
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lessons" ON public.lessons
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix wiki policies
DROP POLICY IF EXISTS "Authenticated users can read wiki" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can insert wiki" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can update wiki" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can delete wiki" ON public.wiki_articles;

CREATE POLICY "Authenticated users can read wiki" ON public.wiki_articles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert wiki" ON public.wiki_articles
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wiki" ON public.wiki_articles
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wiki" ON public.wiki_articles
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix prompts policies
DROP POLICY IF EXISTS "Authenticated users can read prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can insert prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can update prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can delete prompts" ON public.prompts;

CREATE POLICY "Authenticated users can read prompts" ON public.prompts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert prompts" ON public.prompts
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prompts" ON public.prompts
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete prompts" ON public.prompts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
