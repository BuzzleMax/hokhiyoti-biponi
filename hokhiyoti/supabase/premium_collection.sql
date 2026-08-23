-- Migration: Add Premium Collection status to products table (supabase/premium_collection.sql)
-- Safe migration to add 'premium_collection' column and performance index without data loss.

DO $$
BEGIN
  -- Add premium_collection column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'premium_collection'
  ) THEN
    ALTER TABLE products ADD COLUMN premium_collection BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Update existing NULL values to default FALSE
UPDATE products SET premium_collection = FALSE WHERE premium_collection IS NULL;

-- Performance index for premium_collection query
CREATE INDEX IF NOT EXISTS idx_products_premium_collection ON products(premium_collection) WHERE premium_collection = TRUE;
