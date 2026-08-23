-- Migration: Add Explore status to products table (supabase/explore_product_section.sql)
-- Safe migration to add 'explore' column and performance index without data loss.

DO $$
BEGIN
  -- Add explore column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'explore'
  ) THEN
    ALTER TABLE products ADD COLUMN explore BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Update existing NULL values to default FALSE
UPDATE products SET explore = FALSE WHERE explore IS NULL;

-- Performance index for explore query
CREATE INDEX IF NOT EXISTS idx_products_explore ON products(explore) WHERE explore = TRUE;
