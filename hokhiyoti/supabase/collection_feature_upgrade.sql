-- ============================================================================
-- HOKHIYOTI BIPONI - COLLECTION MANAGEMENT FEATURE UPGRADE MIGRATION
-- Migration File: supabase/collection_feature_upgrade.sql
-- ============================================================================

-- 1. Ensure COLLECTIONS table columns exist safely without overwriting existing data
DO $$ 
BEGIN
  -- Add featured column if missing, default to false
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'featured'
  ) THEN
    ALTER TABLE collections ADD COLUMN featured BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add image_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE collections ADD COLUMN image_url TEXT;
  END IF;

  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'description'
  ) THEN
    ALTER TABLE collections ADD COLUMN description TEXT;
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE collections ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 2. Add performance index on featured column for fast homepage queries
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

-- 3. Ensure storage bucket for collection cover images exists safely
INSERT INTO storage.buckets (id, name, public)
VALUES ('collection-images', 'collection-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up safe RLS policies for collection-images storage bucket
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on collection-images'
  ) THEN
    CREATE POLICY "Allow public read access on collection-images"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'collection-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public upload access on collection-images'
  ) THEN
    CREATE POLICY "Allow public upload access on collection-images"
    ON storage.objects FOR INSERT TO public
    WITH CHECK (bucket_id = 'collection-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update access on collection-images'
  ) THEN
    CREATE POLICY "Allow public update access on collection-images"
    ON storage.objects FOR UPDATE TO public
    USING (bucket_id = 'collection-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete access on collection-images'
  ) THEN
    CREATE POLICY "Allow public delete access on collection-images"
    ON storage.objects FOR DELETE TO public
    USING (bucket_id = 'collection-images');
  END IF;
END $$;

-- 5. Ensure public read access & admin write access policies exist on collections table
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public read access'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Public access collections'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Public read collections'
  ) THEN
    CREATE POLICY "Allow public read access" ON collections FOR SELECT TO public USING (true);
  END IF;
END $$;
