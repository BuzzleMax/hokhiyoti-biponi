-- Migration: Add Product Status Toggles (featured, new_arrival, best_seller, out_of_stock, explore)
-- Safe migration that reuses existing schema and adds missing columns without data loss.

DO $$
BEGIN
  -- Add featured column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'featured'
  ) THEN
    ALTER TABLE products ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- Add new_arrival column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'new_arrival'
  ) THEN
    ALTER TABLE products ADD COLUMN new_arrival BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- Add best_seller column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'best_seller'
  ) THEN
    ALTER TABLE products ADD COLUMN best_seller BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- Add out_of_stock column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'out_of_stock'
  ) THEN
    ALTER TABLE products ADD COLUMN out_of_stock BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- Add explore column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'explore'
  ) THEN
    ALTER TABLE products ADD COLUMN explore BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Update existing NULL values to default FALSE
UPDATE products SET featured = FALSE WHERE featured IS NULL;
UPDATE products SET new_arrival = FALSE WHERE new_arrival IS NULL;
UPDATE products SET best_seller = FALSE WHERE best_seller IS NULL;
UPDATE products SET out_of_stock = FALSE WHERE out_of_stock IS NULL;
UPDATE products SET explore = FALSE WHERE explore IS NULL;

-- Performance indexes for status queries
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(new_arrival) WHERE new_arrival = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller) WHERE best_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_explore ON products(explore) WHERE explore = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_out_of_stock ON products(out_of_stock);
