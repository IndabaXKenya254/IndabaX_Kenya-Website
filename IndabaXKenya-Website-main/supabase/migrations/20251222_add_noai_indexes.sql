-- ═══════════════════════════════════════════════════════════════════════
-- NOAI - ADD DATABASE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_add_noai_indexes
-- Description: Add indexes to optimize query performance for NOAI tables
-- Created: December 22, 2025
-- ═══════════════════════════════════════════════════════════════════════

-- 1. NOAI PAGE SECTIONS INDEXES
-- Used in GET /api/noai/sections - filters by is_published, orders by display_order
-- Composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_noai_sections_published_order
ON public.noai_page_sections(is_published, display_order)
WHERE is_published = true;

-- Unique index for section_key lookups (already unique constraint, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_noai_sections_section_key
ON public.noai_page_sections(section_key);

-- 2. NOAI PARTICIPANTS INDEXES
-- Used in GET /api/noai/participants?year=2025 - filters by year, is_published, orders by display_order
-- Composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_noai_participants_year_published_order
ON public.noai_participants(year, is_published, display_order)
WHERE is_published = true;

-- Separate index for year filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_noai_participants_year
ON public.noai_participants(year);

-- 3. NOAI FAQS INDEXES
-- Used in GET /api/noai/faqs?category=general - filters by category, is_published, orders by display_order
-- Composite index for category queries
CREATE INDEX IF NOT EXISTS idx_noai_faqs_category_published_order
ON public.noai_faqs(category, is_published, display_order)
WHERE is_published = true;

-- General index for all published FAQs ordered
CREATE INDEX IF NOT EXISTS idx_noai_faqs_published_order
ON public.noai_faqs(is_published, display_order)
WHERE is_published = true;

-- 4. NOAI SETTINGS
-- No indexes needed - single row table with UUID primary key

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY INDEXES
-- ═══════════════════════════════════════════════════════════════════════
-- Run this query to verify indexes were created:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename LIKE 'noai_%'
-- ORDER BY tablename, indexname;
