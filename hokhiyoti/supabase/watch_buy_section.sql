-- ============================================================================
-- HOKHIYOTI BIPONI — WATCH & BUY FEATURE MIGRATION
-- File: supabase/watch_buy_section.sql
-- Description: Additive, fully idempotent migration.
--   - Creates watch_buy_videos and watch_buy_video_products tables.
--   - Uses the same uuid_generate_v4() / uuid-ossp convention as the rest of
--     the project (see final_project_migration.sql line 12 / line 21).
--   - Uses the same RLS convention: SELECT → public, ALL → authenticated.
--   - Reuses update_updated_at_column() trigger already defined in the project.
--   - Reuses product-videos / product-images storage buckets (already created).
--   - Does NOT touch existing products, collections, or any other table.
--   - Does NOT create duplicate storage buckets or conflicting policies.
--   - Does NOT expose write access to unauthenticated/public users.
--   - Safe to run multiple times (idempotent).
-- ============================================================================

-- Ensure uuid-ossp is loaded (same as the master migration)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: watch_buy_videos TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS watch_buy_videos (
  -- Primary key — same generator used across the whole project
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Display metadata
  title        TEXT NOT NULL,
  description  TEXT,                    -- optional short caption shown on the card

  -- Media
  video_url    TEXT NOT NULL,           -- URL of the video (Supabase storage or external)
  poster_url   TEXT,                    -- optional thumbnail/poster image URL

  -- Visibility & ordering
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  watch_buy_videos IS 'Fashion-reel videos displayed in the Watch & Buy homepage section.';
COMMENT ON COLUMN watch_buy_videos.video_url    IS 'Full public URL of the uploaded video (product-videos bucket or CDN).';
COMMENT ON COLUMN watch_buy_videos.poster_url   IS 'Optional thumbnail image shown while the video loads or if autoplay fails.';
COMMENT ON COLUMN watch_buy_videos.display_order IS 'Lower value = appears first in the horizontal reel row.';

-- ============================================================================
-- SECTION 2: watch_buy_video_products JUNCTION TABLE
-- ============================================================================
-- Connects Watch & Buy videos to EXISTING products.
-- Deleting a Watch & Buy video cascades and removes its junction rows.
-- Deleting a product removes its junction rows (ON DELETE CASCADE on product_id).
-- Neither cascade deletes the OTHER entity.
-- A product may appear in many videos; a video may show many products.

CREATE TABLE IF NOT EXISTS watch_buy_video_products (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- FK → watch_buy_videos: cascade-delete junction rows when video is deleted
  watch_buy_video_id UUID NOT NULL
    REFERENCES watch_buy_videos(id) ON DELETE CASCADE,

  -- FK → products (UUID PK confirmed at line 52 of final_project_migration.sql)
  -- ON DELETE CASCADE removes the junction row when the product is deleted.
  -- This prevents broken references but does NOT delete the product.
  product_id         UUID NOT NULL
    REFERENCES products(id) ON DELETE CASCADE,

  -- Per-video product ordering (lower = shown first in the product panel)
  display_order      INTEGER NOT NULL DEFAULT 0,

  -- Timestamp
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- A product can only appear once per video
  CONSTRAINT uq_watch_buy_video_product UNIQUE (watch_buy_video_id, product_id)
);

COMMENT ON TABLE  watch_buy_video_products IS 'Junction table linking Watch & Buy videos to existing products (no product data duplicated here).';
COMMENT ON COLUMN watch_buy_video_products.product_id IS 'References products(id). Removing a product removes this link row only — the video record is untouched.';
COMMENT ON COLUMN watch_buy_video_products.watch_buy_video_id IS 'References watch_buy_videos(id). Removing a video cascades to remove all its product links.';

-- ============================================================================
-- SECTION 3: PERFORMANCE INDEXES
-- ============================================================================

-- Homepage query: SELECT active videos ordered by display_order
CREATE INDEX IF NOT EXISTS idx_watch_buy_videos_active_order
  ON watch_buy_videos (is_active, display_order ASC)
  WHERE is_active = TRUE;

-- Admin query: SELECT all videos ordered by display_order (no is_active filter)
CREATE INDEX IF NOT EXISTS idx_watch_buy_videos_display_order
  ON watch_buy_videos (display_order ASC, created_at DESC);

-- Per-video product lookup, ordered by display_order
CREATE INDEX IF NOT EXISTS idx_watch_buy_video_products_video_order
  ON watch_buy_video_products (watch_buy_video_id, display_order ASC);

-- Reverse lookup: which videos contain a given product?
CREATE INDEX IF NOT EXISTS idx_watch_buy_video_products_product
  ON watch_buy_video_products (product_id);

-- ============================================================================
-- SECTION 4: updated_at AUTO-TRIGGER
-- Reuses the update_updated_at_column() function already created in
-- final_project_migration.sql (line 671–677). Safe to run even if the
-- trigger already exists because we use DROP TRIGGER IF EXISTS first.
-- ============================================================================

DROP TRIGGER IF EXISTS update_watch_buy_videos_updated_at ON watch_buy_videos;
CREATE TRIGGER update_watch_buy_videos_updated_at
  BEFORE UPDATE ON watch_buy_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY
--
-- Convention matched to final_project_migration.sql (lines 1288–1404):
--   SELECT  → public   (anonymous visitors can read)
--   ALL     → authenticated  (admin controls writes)
--
-- IMPORTANT: public users must NEVER be able to INSERT/UPDATE/DELETE
-- Watch & Buy videos or their product links. This matches collections,
-- products, categories, and all other admin-owned tables.
-- ============================================================================

ALTER TABLE watch_buy_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_buy_video_products ENABLE ROW LEVEL SECURITY;

-- watch_buy_videos: public read
DROP POLICY IF EXISTS "Public read watch_buy_videos" ON watch_buy_videos;
CREATE POLICY "Public read watch_buy_videos"
  ON watch_buy_videos FOR SELECT TO public USING (true);

-- watch_buy_videos: admin write (matches "Admin full control products" pattern)
DROP POLICY IF EXISTS "Admin full control watch_buy_videos" ON watch_buy_videos;
CREATE POLICY "Admin full control watch_buy_videos"
  ON watch_buy_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- watch_buy_video_products: public read
DROP POLICY IF EXISTS "Public read watch_buy_video_products" ON watch_buy_video_products;
CREATE POLICY "Public read watch_buy_video_products"
  ON watch_buy_video_products FOR SELECT TO public USING (true);

-- watch_buy_video_products: admin write
DROP POLICY IF EXISTS "Admin full control watch_buy_video_products" ON watch_buy_video_products;
CREATE POLICY "Admin full control watch_buy_video_products"
  ON watch_buy_video_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- SECTION 6: STORAGE BUCKETS
--
-- The existing project already creates 'product-videos' and 'product-images'
-- buckets in final_project_migration.sql (lines 1242–1285) with the correct
-- policies:
--   Read  → public
--   Write → authenticated
--
-- Watch & Buy media (video files + poster images) will be stored in these
-- same buckets using prefixed filenames (wb_vid_* / wb_img_*).
-- No new buckets are required. The INSERT below is idempotent (ON CONFLICT).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-videos', 'product-videos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies are already created by final_project_migration.sql.
-- The DROP + CREATE pattern used there means re-running this migration is
-- safe — it will simply recreate the same policies that already exist.
-- We do NOT add new public upload/delete policies here because that would
-- open the storage to unauthenticated writes, which the project disallows.

-- Public read (idempotent — matches the master migration pattern exactly)
DROP POLICY IF EXISTS "Public storage product-videos read" ON storage.objects;
CREATE POLICY "Public storage product-videos read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Public storage product-images read" ON storage.objects;
CREATE POLICY "Public storage product-images read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

-- Admin insert/update/delete for product-videos (idempotent)
DROP POLICY IF EXISTS "Admin storage product-videos insert" ON storage.objects;
CREATE POLICY "Admin storage product-videos insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin storage product-videos update" ON storage.objects;
CREATE POLICY "Admin storage product-videos update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin storage product-videos delete" ON storage.objects;
CREATE POLICY "Admin storage product-videos delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-videos');

-- Admin insert/update/delete for product-images (idempotent)
DROP POLICY IF EXISTS "Admin storage product-images insert" ON storage.objects;
CREATE POLICY "Admin storage product-images insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin storage product-images update" ON storage.objects;
CREATE POLICY "Admin storage product-images update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin storage product-images delete" ON storage.objects;
CREATE POLICY "Admin storage product-images delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- ============================================================================
-- SECTION 7: DESIGN VERIFICATION (logic test — not executable SQL)
--
-- The following flow is supported by the schema above:
--
--  1. INSERT INTO watch_buy_videos (title, video_url, ...) → returns UUID v
--  2. INSERT INTO watch_buy_video_products (v, product_A_uuid, 0) → link A
--  3. INSERT INTO watch_buy_video_products (v, product_B_uuid, 1) → link B
--  4. INSERT INTO watch_buy_video_products (v, product_C_uuid, 2) → link C
--  5. SELECT wbv.*, wbvp.product_id, wbvp.display_order,
--            p.name, p.price, p.images, p.availability_status, p.slug
--       FROM watch_buy_videos wbv
--       JOIN watch_buy_video_products wbvp ON wbvp.watch_buy_video_id = wbv.id
--       JOIN products p ON p.id = wbvp.product_id
--      WHERE wbv.is_active = TRUE
--      ORDER BY wbv.display_order, wbvp.display_order;
--     → Returns video rows with product A, B, C in order. ✓
--
--  6. DELETE FROM watch_buy_video_products
--       WHERE watch_buy_video_id = v AND product_id = product_B_uuid;
--     → Product B still exists in `products`. Only the junction row is gone. ✓
--     → SELECT above now returns only A, C. ✓
--
--  7. DELETE FROM watch_buy_videos WHERE id = v;
--     → ON DELETE CASCADE removes remaining junction rows (A, C links).
--     → products table is untouched. Product A and C still exist. ✓
--
--  8. If product_A is independently deleted from `products`:
--     → ON DELETE CASCADE on watch_buy_video_products.product_id removes
--       that junction row only. The video record remains. ✓
--     → Prevents broken/dangling foreign key references. ✓
--
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
