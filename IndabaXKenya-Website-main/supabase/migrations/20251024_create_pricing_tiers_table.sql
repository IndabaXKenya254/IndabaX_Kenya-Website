-- ═══════════════════════════════════════════════════════════════════════
-- CREATE PRICING TIERS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Separate table for pricing tiers with admin management
-- Replaces hardcoded lib/mock-data/pricing.json
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- TABLE: pricing_tiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  price VARCHAR(50) NOT NULL, -- e.g. "FREE", "5,000"
  currency VARCHAR(10) DEFAULT 'KSH',
  period VARCHAR(50) DEFAULT '3 Days',
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  badge VARCHAR(50), -- e.g. "Most Popular", "New"
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of feature strings
  requirements JSONB DEFAULT '[]'::jsonb, -- Array of requirement strings
  button_text VARCHAR(50) DEFAULT 'Register Now',
  button_link VARCHAR(255) DEFAULT '/register',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.pricing_tiers IS 'Conference pricing tiers/registration passes';
COMMENT ON COLUMN public.pricing_tiers.features IS 'Array of feature strings (JSON array)';
COMMENT ON COLUMN public.pricing_tiers.requirements IS 'Array of requirement strings (JSON array)';
COMMENT ON COLUMN public.pricing_tiers.is_active IS 'Whether this pricing tier is displayed on the website';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_pricing_tiers_active ON public.pricing_tiers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_pricing_tiers_display_order ON public.pricing_tiers(display_order);
CREATE INDEX idx_pricing_tiers_featured ON public.pricing_tiers(featured) WHERE featured = TRUE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing tiers
CREATE POLICY "Pricing tiers are viewable by everyone"
  ON public.pricing_tiers FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "Admins can manage pricing tiers"
  ON public.pricing_tiers FOR ALL
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

INSERT INTO public.pricing_tiers (
  title, price, currency, period, description, featured, badge,
  features, requirements, button_text, button_link, display_order, is_active
) VALUES
(
  'Student Pass',
  'FREE',
  'KSH',
  '3 Days',
  'Perfect for undergraduate and graduate students',
  TRUE,
  'Most Popular',
  jsonb_build_array(
    'Access to all conference sessions',
    'All workshop sessions',
    'Conference materials & swag bag',
    'Lunch on all 3 days',
    'Coffee breaks & networking',
    'Certificate of attendance',
    'Access to poster session',
    'Career fair access'
  ),
  jsonb_build_array(
    'Valid student ID required',
    'Must register by March 1, 2026',
    'Limited to 300 spots'
  ),
  'Register Now',
  '/register',
  1,
  TRUE
),
(
  'Academic Pass',
  '5,000',
  'KSH',
  '3 Days',
  'For faculty, researchers, and postdocs',
  FALSE,
  NULL,
  jsonb_build_array(
    'Everything in Student Pass',
    'VIP networking reception',
    'Priority workshop registration',
    'Access to speaker dinner (Day 2)',
    'Private Q&A with keynote speakers',
    'Research collaboration opportunities',
    '1-year AI Kenya membership',
    'Digital proceedings access'
  ),
  jsonb_build_array(
    'Academic affiliation verification required'
  ),
  'Register Now',
  '/register',
  2,
  TRUE
),
(
  'Industry Pass',
  '15,000',
  'KSH',
  '3 Days',
  'For professionals and industry practitioners',
  FALSE,
  NULL,
  jsonb_build_array(
    'Everything in Academic Pass',
    'Company logo in conference materials',
    'Priority seating in main hall',
    'Access to all networking events',
    'Meet the speakers sessions',
    'Exclusive industry roundtable',
    'Hiring booth at career fair (optional)',
    'Post-conference video recordings',
    'Invoice for reimbursement'
  ),
  jsonb_build_array(
    'For working professionals'
  ),
  'Register Now',
  '/register',
  3,
  TRUE
),
(
  'Virtual Pass',
  '2,000',
  'KSH',
  '3 Days',
  'Join us remotely from anywhere',
  FALSE,
  'New',
  jsonb_build_array(
    'Live stream of all main sessions',
    'Live stream of keynotes',
    'Access to virtual workshops',
    'Digital conference materials',
    'Recording access (30 days)',
    'Virtual networking platform',
    'Certificate of attendance',
    'Chat with attendees'
  ),
  jsonb_build_array(
    'Stable internet connection required',
    'Registration closes March 14'
  ),
  'Register Now',
  '/register',
  4,
  TRUE
);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

SELECT
  title,
  price,
  featured,
  is_active,
  display_order,
  jsonb_array_length(features) as feature_count
FROM public.pricing_tiers
ORDER BY display_order;
