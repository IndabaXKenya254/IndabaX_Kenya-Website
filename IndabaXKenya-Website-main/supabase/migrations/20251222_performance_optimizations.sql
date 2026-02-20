-- ═══════════════════════════════════════════════════════════════════════
-- PERFORMANCE OPTIMIZATIONS - Fast Response Times
-- ═══════════════════════════════════════════════════════════════════════
-- Additional indexes, query optimizations, and database tuning

-- 1. Add partial indexes for commonly queried data (smaller, faster)
CREATE INDEX IF NOT EXISTS idx_noai_subsections_published_parent
ON public.noai_subsections(parent_section_key, display_order)
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_noai_participants_published_year
ON public.noai_participants(year DESC, display_order)
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_noai_faqs_published_category
ON public.noai_faqs(category, display_order)
WHERE is_published = true;

-- 2. Add BRIN index for timestamp columns (efficient for time-series data)
CREATE INDEX IF NOT EXISTS idx_noai_participants_created_brin
ON public.noai_participants USING BRIN(created_at);

CREATE INDEX IF NOT EXISTS idx_noai_faqs_created_brin
ON public.noai_faqs USING BRIN(created_at);

CREATE INDEX IF NOT EXISTS idx_noai_subsections_created_brin
ON public.noai_subsections USING BRIN(created_at);

-- 3. Update table statistics for better query planning
ANALYZE public.noai_page_sections;
ANALYZE public.noai_subsections;
ANALYZE public.noai_participants;
ANALYZE public.noai_faqs;

-- 4. Add index on frequently joined columns
CREATE INDEX IF NOT EXISTS idx_noai_sections_key_published
ON public.noai_page_sections(section_key)
WHERE is_published = true;

-- 5. Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_participants_year_role_published
ON public.noai_participants(year, role, is_published)
WHERE is_published = true;

-- 6. Add comments for documentation
COMMENT ON INDEX idx_noai_subsections_published_parent IS 'Optimizes queries for published subsections by parent section';
COMMENT ON INDEX idx_noai_participants_published_year IS 'Optimizes queries for published participants grouped by year';
COMMENT ON INDEX idx_noai_faqs_published_category IS 'Optimizes queries for published FAQs grouped by category';

-- 7. Enable parallel query execution for large datasets (PostgreSQL 9.6+)
-- This will be automatically used when beneficial

-- 8. Add index for photo_url lookups (for image optimization)
CREATE INDEX IF NOT EXISTS idx_participants_photo_url
ON public.noai_participants(photo_url)
WHERE photo_url IS NOT NULL AND is_published = true;
