
-- Remove overly permissive policy - service role bypasses RLS automatically
DROP POLICY "Service role full access" ON public.weekly_reports;
