-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY ADVISORIES FIX - BATCH 2
-- Date: 2026-01-27
-- ═══════════════════════════════════════════════════════════════════════════
-- Fixes:
--   1. Function Search Path Mutable (6 functions)
--   2. Overly permissive RLS policies on tag tables (4 policies → admin-only)
--   3. Overly permissive RLS policies on logs/tickets (3 policies → tightened)
--
-- NOT fixed here (intentionally permissive):
--   - applications INSERT (public form submission)
--   - contact_submissions INSERT (public contact form)
--   - subscribers INSERT (public newsletter signup)
--   - password_reset_tokens INSERT (anyone can request password reset)
--
-- NOT fixed here (Dashboard setting, not SQL):
--   - Leaked Password Protection → enable in Supabase Dashboard
--     https://supabase.com/docs/guides/auth/password-security
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: FIX FUNCTION SEARCH PATHS
-- Set search_path = '' to prevent search_path injection attacks
-- ═══════════════════════════════════════════════════════════════════════════

-- 1a. update_why_attend_cards_updated_at (trigger function, no args)
CREATE OR REPLACE FUNCTION public.update_why_attend_cards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1b. sync_email_verified (trigger function, no args)
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE public.user_profiles
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 1c. update_noai_archives_updated_at (trigger function, no args)
CREATE OR REPLACE FUNCTION public.update_noai_archives_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1d. assign_random_applications (4 UUID args)
CREATE OR REPLACE FUNCTION public.assign_random_applications(
  p_reviewer_id UUID,
  p_event_id UUID,
  p_count INTEGER,
  p_assigned_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_assigned INTEGER := 0;
  v_application RECORD;
BEGIN
  FOR v_application IN
    SELECT fr.id as application_id
    FROM public.form_responses fr
    JOIN public.form_templates ft ON fr.template_id = ft.id
    WHERE ft.event_id = p_event_id
      AND fr.status IN ('pending', 'submitted', 'shortlisted')
      AND NOT EXISTS (
        SELECT 1 FROM public.paper_assignments pa
        WHERE pa.application_id = fr.id
          AND pa.reviewer_id = p_reviewer_id
      )
    ORDER BY RANDOM()
    LIMIT p_count
  LOOP
    INSERT INTO public.paper_assignments (
      reviewer_id,
      application_id,
      event_id,
      assigned_by
    ) VALUES (
      p_reviewer_id,
      v_application.application_id,
      p_event_id,
      p_assigned_by
    )
    ON CONFLICT (reviewer_id, application_id) DO NOTHING;

    IF FOUND THEN
      v_assigned := v_assigned + 1;
    END IF;
  END LOOP;

  RETURN v_assigned;
END;
$$;

-- 1e. assign_random_papers (3 args with default, returns table)
-- Must DROP first because CREATE OR REPLACE cannot remove parameter defaults
DROP FUNCTION IF EXISTS public.assign_random_papers(uuid, uuid, integer);
CREATE FUNCTION public.assign_random_papers(
  p_reviewer_id UUID,
  p_event_id UUID,
  p_count INTEGER DEFAULT 10
)
RETURNS TABLE(assigned_count INTEGER, paper_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_assigned_ids UUID[];
  v_count INTEGER := 0;
BEGIN
  WITH unassigned_papers AS (
    SELECT p.id
    FROM public.papers p
    WHERE p.event_id = p_event_id
      AND p.status = 'submitted'
      AND NOT EXISTS (
        SELECT 1 FROM public.paper_reviewer_assignments pa WHERE pa.paper_id = p.id
      )
    ORDER BY RANDOM()
    LIMIT p_count
  ),
  inserted AS (
    INSERT INTO public.paper_reviewer_assignments (paper_id, reviewer_id, event_id, assigned_by)
    SELECT id, p_reviewer_id, p_event_id, auth.uid()
    FROM unassigned_papers
    RETURNING paper_id
  )
  SELECT ARRAY_AGG(paper_id), COUNT(*)::INTEGER INTO v_assigned_ids, v_count
  FROM inserted;

  RETURN QUERY SELECT v_count, COALESCE(v_assigned_ids, ARRAY[]::UUID[]);
END;
$$;

-- 1f. update_paper_review_timestamp (trigger function, no args)
CREATE OR REPLACE FUNCTION public.update_paper_review_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: TIGHTEN TAG TABLE RLS POLICIES (admin-only instead of all authenticated)
-- ═══════════════════════════════════════════════════════════════════════════

-- 2a. event_tag_relations: restrict to admin
DROP POLICY IF EXISTS "Authenticated users can manage event tag relations" ON public.event_tag_relations;
CREATE POLICY "Admins can manage event tag relations" ON public.event_tag_relations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2b. event_tags: restrict to admin
DROP POLICY IF EXISTS "Authenticated users can manage event tags" ON public.event_tags;
CREATE POLICY "Admins can manage event tags" ON public.event_tags
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2c. post_tag_relations: restrict to admin
DROP POLICY IF EXISTS "Authenticated users can manage post tag relations" ON public.post_tag_relations;
CREATE POLICY "Admins can manage post tag relations" ON public.post_tag_relations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2d. post_tags: restrict to admin
DROP POLICY IF EXISTS "Authenticated users can manage post tags" ON public.post_tags;
CREATE POLICY "Admins can manage post tags" ON public.post_tags
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: TIGHTEN LOG & TICKET RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- 3a. activity_logs: restrict INSERT to admin only
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "Admins can insert activity logs" ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3b. email_logs: restrict INSERT to admin only
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;
CREATE POLICY "Admins can insert email logs" ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3c. tickets: restrict INSERT to user's own ticket (user_id must match auth.uid())
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets" ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
