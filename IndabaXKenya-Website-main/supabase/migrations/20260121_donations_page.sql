-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - DONATIONS PAGE CONTENT & PAYMENT METHODS
-- ═══════════════════════════════════════════════════════════════════════
-- Issue #20: Add donations/sponsorship page with admin-editable content
-- Features:
--   - Editable page sections (hero, why support, where support goes)
--   - Payment methods with enable/disable toggle
-- ═══════════════════════════════════════════════════════════════════════

-- Donations Page Content Table
CREATE TABLE IF NOT EXISTS public.donations_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Section identifier
  section_key TEXT NOT NULL UNIQUE,

  -- Content
  title TEXT,
  subtitle TEXT,
  description TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  icon TEXT,

  -- Order/visibility
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Method details
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,

  -- Payment info (could be account number, PayPal link, M-Pesa paybill, etc.)
  payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_transfer', 'mpesa', 'paypal', 'stripe', 'card', 'other')),
  payment_details JSONB DEFAULT '{}',

  -- Instructions for users
  instructions TEXT,

  -- Visibility toggle (admin controlled)
  is_enabled BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Why Support Cards Table
CREATE TABLE IF NOT EXISTS public.donations_why_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,

  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Where Support Goes Cards Table
CREATE TABLE IF NOT EXISTS public.donations_impact_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.donations_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations_why_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations_impact_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public can view enabled content, admins can manage all
-- NOTE: Separate policies for public SELECT and admin operations to avoid permission issues

-- Public SELECT policies (no auth required)
CREATE POLICY "Public can view visible donations content" ON public.donations_content
  FOR SELECT TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Public can view enabled payment methods" ON public.payment_methods
  FOR SELECT TO anon, authenticated
  USING (is_enabled = true);

CREATE POLICY "Public can view visible why cards" ON public.donations_why_cards
  FOR SELECT TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Public can view visible impact cards" ON public.donations_impact_cards
  FOR SELECT TO anon, authenticated
  USING (is_visible = true);

-- Admin policies for donations_content
CREATE POLICY "Admins can view all donations content" ON public.donations_content
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can insert donations content" ON public.donations_content
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can update donations content" ON public.donations_content
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can delete donations content" ON public.donations_content
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

-- Admin policies for payment_methods
CREATE POLICY "Admins can view all payment methods" ON public.payment_methods
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can insert payment methods" ON public.payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can update payment methods" ON public.payment_methods
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can delete payment methods" ON public.payment_methods
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

-- Admin policies for donations_why_cards
CREATE POLICY "Admins can view all why cards" ON public.donations_why_cards
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can insert why cards" ON public.donations_why_cards
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can update why cards" ON public.donations_why_cards
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can delete why cards" ON public.donations_why_cards
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

-- Admin policies for donations_impact_cards
CREATE POLICY "Admins can view all impact cards" ON public.donations_impact_cards
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can insert impact cards" ON public.donations_impact_cards
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can update impact cards" ON public.donations_impact_cards
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

CREATE POLICY "Admins can delete impact cards" ON public.donations_impact_cards
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND up.role = 'admin'));

-- Insert default content
INSERT INTO public.donations_content (section_key, title, subtitle, description, button_text, button_link) VALUES
('hero', 'Support IndabaX Kenya', 'Help Build The AI Community in Kenya',
 'IndabaX Kenya is part of the Deep Learning Indaba community, working to strengthen Machine Learning and AI across Kenya. Through our events, workshops, and mentorship programs, we empower researchers, students, and innovators to shape the future of technology in Africa. Your support helps us make this vision possible.',
 'Donate Now', '#payment-methods'),
('why_support_intro', 'Why Support IndabaX Kenya', 'Through Your Contributions',
 'Supporting IndabaX Kenya means investing in people, knowledge, and a shared future where Kenya leads in shaping the African and global AI landscape.',
 NULL, NULL),
('impact_intro', 'Where Your Support Goes', 'Making a Difference',
 'Your donations directly support our programs and initiatives.',
 NULL, NULL),
('contact', 'Get In Touch', 'Contact us for more details',
 'For sponsorship inquiries and more information about how you can support our mission.',
 'Contact Us', 'mailto:info@deeplearningindabaxkenya.com');

-- Insert default why support cards
INSERT INTO public.donations_why_cards (title, description, icon, display_order) VALUES
('Empower and Educate', 'Support learners, researchers, and professionals through workshops, mentorship, scholarships, and accessible educational programs across Kenya.', 'icofont-graduate-alt', 1),
('Grow a Connected AI Community', 'Strengthen collaboration and capacity building through events like IndabaX Kenya gatherings, hackathons, and virtual learning initiatives.', 'icofont-users-alt-4', 2),
('Foster Kenyan Innovation', 'Create spaces where research, ideas, and startups can thrive — driving locally relevant AI solutions with global impact.', 'icofont-light-bulb', 3),
('Champion Diversity and Inclusion', 'Ensure Kenyan voices, perspectives, and leadership are represented in the global AI conversation.', 'icofont-people', 4);

-- Insert default impact cards
INSERT INTO public.donations_impact_cards (title, description, display_order) VALUES
('Scholarships & Funding Support', 'Enabling talented individuals to attend conferences, workshops, and training programs.', 1),
('Mentorship & Empowerment Programs', 'Connecting aspiring AI practitioners with experienced mentors and industry professionals.', 2),
('IndabaX Events & Community Gatherings', 'Organizing annual conferences, meetups, and networking events for the AI community.', 3),
('Operations & Sustainability', 'Ensuring the long-term sustainability and growth of our initiatives.', 4);

-- Insert default payment methods (all disabled by default)
INSERT INTO public.payment_methods (name, description, payment_type, payment_details, instructions, is_enabled, display_order) VALUES
('M-Pesa', 'Pay via M-Pesa mobile money', 'mpesa',
 '{"paybill": "", "account_name": "IndabaX Kenya"}',
 '1. Go to M-Pesa\n2. Select Lipa na M-Pesa\n3. Select Pay Bill\n4. Enter Business Number\n5. Enter Account Number\n6. Enter Amount\n7. Enter PIN and confirm',
 false, 1),
('Bank Transfer', 'Direct bank transfer to our account', 'bank_transfer',
 '{"bank_name": "", "account_name": "IndabaX Kenya", "account_number": "", "branch": "", "swift_code": ""}',
 'Transfer funds to the account details provided. Include your name and "Donation" in the reference.',
 false, 2),
('PayPal', 'Pay securely via PayPal', 'paypal',
 '{"paypal_email": "", "paypal_link": ""}',
 'Click the PayPal button to make a secure donation through PayPal.',
 false, 3),
('Card Payment', 'Pay with credit or debit card', 'card',
 '{"stripe_enabled": false}',
 'Enter your card details to make a secure payment.',
 false, 4);

COMMENT ON TABLE public.donations_content IS 'Editable content sections for the donations page';
COMMENT ON TABLE public.payment_methods IS 'Payment methods with admin-controlled visibility toggle';
COMMENT ON TABLE public.donations_why_cards IS 'Why support cards shown on donations page';
COMMENT ON TABLE public.donations_impact_cards IS 'Where support goes cards shown on donations page';
