-- ============================================================================
-- INDABAX KENYA - VENUES TABLE MIGRATION
-- ============================================================================
-- Created: October 24, 2025
-- Purpose: Create venues table for managing conference locations
-- Migration: 17
-- ============================================================================

-- ============================================================================
-- TABLE: venues
-- ============================================================================
-- Purpose: Store venue information with rich content
-- Access: Public read (active only), Admin full access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,

  -- Location Information
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Kenya',

  -- Rich Content (QuillJS HTML)
  description TEXT, -- Rich HTML content for venue description
  facilities TEXT, -- Rich HTML content for facilities
  getting_there TEXT, -- Rich HTML content for transportation
  nearby_amenities TEXT, -- Rich HTML content for amenities

  -- Details
  capacity INT,
  image_url TEXT,

  -- Map & Contact
  map_embed_url TEXT, -- Google Maps embed URL
  map_latitude DECIMAL(10, 8),
  map_longitude DECIMAL(11, 8),
  website_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.venues IS 'Conference venues with rich content';
COMMENT ON COLUMN public.venues.description IS 'Rich HTML content from QuillJS';
COMMENT ON COLUMN public.venues.facilities IS 'Rich HTML content for facilities (WiFi, AV, etc.)';
COMMENT ON COLUMN public.venues.getting_there IS 'Rich HTML content for transportation options';
COMMENT ON COLUMN public.venues.nearby_amenities IS 'Rich HTML content for hotels, restaurants, etc.';

-- ============================================================================
-- ADD VENUE REFERENCE TO EVENTS
-- ============================================================================

-- Add venue_id column to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.venue_id IS 'Foreign key to venues table';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events(venue_id);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Public can view active venues
CREATE POLICY "Public can view active venues"
  ON public.venues
  FOR SELECT
  USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "Admins can manage all venues"
  ON public.venues
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_venues_updated_at();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert KICC as default venue
INSERT INTO public.venues (
  slug,
  name,
  address,
  city,
  country,
  description,
  facilities,
  getting_there,
  nearby_amenities,
  capacity,
  image_url,
  map_embed_url,
  map_latitude,
  map_longitude,
  is_active,
  display_order
) VALUES (
  'kicc-nairobi',
  'Kenyatta International Convention Centre (KICC)',
  'Harambee Avenue, Nairobi',
  'Nairobi',
  'Kenya',
  '<p>IndabaX Kenya 2026 will take place at the iconic <strong>Kenyatta International Convention Centre (KICC)</strong> in the heart of Nairobi, Kenya. KICC is a premier conference venue offering world-class facilities and a central location perfect for international events.</p>',
  '<ul><li><strong>High-speed WiFi</strong> throughout the venue</li><li><strong>State-of-the-art AV equipment</strong> in all halls</li><li><strong>Multiple breakout rooms</strong> for workshops</li><li><strong>Professional catering services</strong></li><li><strong>Accessible facilities</strong> for all attendees</li></ul>',
  '<h3>From Airport</h3><p><strong>Jomo Kenyatta International Airport (JKIA)</strong></p><ul><li>30 minutes drive to KICC</li><li>Taxi/Uber: $15-25 USD</li><li>Airport shuttle available</li></ul><h3>By Car</h3><p>KICC underground parking and nearby public parking lots available. Limited spaces - arrive early.</p><h3>Public Transport</h3><p>Multiple matatu and bus routes to CBD. Walking distance from bus stops. Cost: 50-100 KSH</p>',
  '<h3>Hotels</h3><ul><li>Sarova Stanley (5 min walk)</li><li>Hilton Nairobi (10 min walk)</li><li>Norfolk Hotel (15 min walk)</li></ul><h3>Restaurants</h3><ul><li>Carnivore Restaurant</li><li>Tamarind Restaurant</li><li>The Talisman</li></ul><h3>Shopping</h3><ul><li>City Market (5 min walk)</li><li>Sarit Centre (15 min drive)</li><li>The Junction (20 min drive)</li></ul>',
  500,
  '/images/main-bg1.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8154!2d36.8190384!3d-1.2920659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d6d0000001%3A0x0!2sKenyatta%20International%20Convention%20Centre!5e0!3m2!1sen!2ske!4v1234567890',
  -1.2920659,
  36.8190384,
  TRUE,
  1
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
