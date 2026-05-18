-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ACTIVITY LOGS TABLE (Issue #2)
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: No way to diagnose system failures at ~10 concurrent users
-- Solution: Create activity_logs table for monitoring API requests
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  log_action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(log_action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to activity_logs"
  ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read activity_logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
