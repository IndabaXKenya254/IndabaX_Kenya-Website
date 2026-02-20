-- ═══════════════════════════════════════════════════════════════════════
-- CREATE STATS/FUN FACTS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Separate table for homepage statistics with admin management
-- Replaces hardcoded lib/mock-data/stats.json
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- TABLE: stats
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(100) NOT NULL, -- e.g. "Attendees", "Speakers"
  value INT NOT NULL, -- The number to display
  suffix VARCHAR(10) DEFAULT '', -- e.g. "+", "K"
  icon VARCHAR(100) DEFAULT 'icofont-chart-bar-graph', -- Icofont class name
  color VARCHAR(20) DEFAULT '#3498DB', -- Hex color code
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.stats IS 'Statistics/Fun Facts displayed on homepage';
COMMENT ON COLUMN public.stats.value IS 'The numeric value to display';
COMMENT ON COLUMN public.stats.suffix IS 'Suffix like "+" or "K" appended to value';
COMMENT ON COLUMN public.stats.icon IS 'Icofont icon class (e.g. icofont-users-alt-4)';
COMMENT ON COLUMN public.stats.color IS 'Color for the stat icon/number (hex code)';
COMMENT ON COLUMN public.stats.is_active IS 'Whether this stat is displayed on the website';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_stats_active ON public.stats(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_stats_display_order ON public.stats(display_order);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_stats_updated_at
  BEFORE UPDATE ON public.stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- Public can view active stats
CREATE POLICY "Stats are viewable by everyone"
  ON public.stats FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "Admins can manage stats"
  ON public.stats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO public.stats (
  label, value, suffix, icon, color, display_order, is_active
) VALUES
('Attendees', 500, '+', 'icofont-users-alt-4', '#FF5733', 1, TRUE),
('Speakers', 50, '+', 'icofont-microphone', '#3498DB', 2, TRUE),
('Countries', 20, '+', 'icofont-globe', '#1ABC9C', 3, TRUE),
('Years', 4, '', 'icofont-calendar', '#F39C12', 4, TRUE);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

SELECT
  label,
  value,
  suffix,
  icon,
  is_active,
  display_order
FROM public.stats
ORDER BY display_order;
