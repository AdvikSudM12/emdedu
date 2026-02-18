
-- Drop existing restrictive policies on questions and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can post questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read non-hidden questions" ON public.questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;

CREATE POLICY "Authenticated users can post questions"
ON public.questions FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authenticated users can read non-hidden questions"
ON public.questions FOR SELECT
USING ((is_hidden = false) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own questions"
ON public.questions FOR UPDATE
USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
ON public.questions FOR DELETE
USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Also fix answers table policies (same issue)
DROP POLICY IF EXISTS "Authenticated users can post answers" ON public.answers;
DROP POLICY IF EXISTS "Authenticated users can read answers" ON public.answers;
DROP POLICY IF EXISTS "Users can update their own answers or mark best" ON public.answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON public.answers;

CREATE POLICY "Authenticated users can post answers"
ON public.answers FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authenticated users can read answers"
ON public.answers FOR SELECT
USING (true);

CREATE POLICY "Users can update their own answers or mark best"
ON public.answers FOR UPDATE
USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own answers"
ON public.answers FOR DELETE
USING ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
