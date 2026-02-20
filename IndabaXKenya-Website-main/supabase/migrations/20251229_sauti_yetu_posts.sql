-- ═══════════════════════════════════════════════════════════════════════
-- SAUTI YETU (External Links) POSTS MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
-- Adds support for "Sauti Yetu" posts - external blog links that display
-- as cards but link to external articles (e.g., deeplearningindaba.com)
-- ═══════════════════════════════════════════════════════════════════════

-- Add post_type column to distinguish normal posts from Sauti Yetu (external) posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS post_type VARCHAR(50) DEFAULT 'normal';

-- Add external_url column for Sauti Yetu posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add og_image column to cache Open Graph image from external URL
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add source_name column to show where the external article is from
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);

-- Add index for faster filtering by post_type
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);

-- Add check constraint to ensure external_url is provided for sauti_yetu posts
-- Note: This is a soft constraint - the application should enforce this
COMMENT ON COLUMN posts.post_type IS 'Type of post: normal (internal content) or sauti_yetu (external link)';
COMMENT ON COLUMN posts.external_url IS 'External URL for Sauti Yetu posts - links to external blog articles';
COMMENT ON COLUMN posts.og_image IS 'Cached Open Graph image URL from external source';
COMMENT ON COLUMN posts.source_name IS 'Name of external source (e.g., Deep Learning Indaba)';
