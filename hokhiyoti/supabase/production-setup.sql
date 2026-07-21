-- ============================================
-- Production-Ready Products Table & Storage Setup
-- Execute this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================

-- Add updated_at column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic product info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  
  -- Images (stored as JSON array of {url, alt})
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Category and Collection references
  category_id UUID,
  category_slug TEXT,
  category_name TEXT,
  
  collection_id UUID,
  collection_slug TEXT,
  collection_name TEXT,
  
  -- Product attributes
  sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  fabric TEXT,
  
  -- Flags
  featured BOOLEAN DEFAULT FALSE,
  new_arrival BOOLEAN DEFAULT FALSE,
  best_seller BOOLEAN DEFAULT FALSE,
  
  -- Inventory
  stock INTEGER DEFAULT 0,
  availability TEXT DEFAULT 'in_stock',
  
  -- Ratings
  rating DECIMAL(2, 1) DEFAULT 0.0,
  
  -- Legacy fields (optional for compatibility)
  currency TEXT DEFAULT 'USD',
  subtitle TEXT
);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row changes
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_collection_slug ON products(collection_slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- GIN index for JSONB images array
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN (images);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public insert access" ON products;
DROP POLICY IF EXISTS "Allow public update access" ON products;
DROP POLICY IF EXISTS "Allow public delete access" ON products;

-- Allow public read access (no authentication required)
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert access (for admin dashboard - no auth)
CREATE POLICY "Allow public insert access" ON products
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access (for admin dashboard - no auth)
CREATE POLICY "Allow public update access" ON products
  FOR UPDATE
  TO public
  USING (true);

-- Allow public delete access (for admin dashboard - no auth)
CREATE POLICY "Allow public delete access" ON products
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing storage policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload access on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access on product-images" ON storage.objects;

-- Allow public read access to the bucket
CREATE POLICY "Allow public read access on product-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow public upload access to the bucket (for admin dashboard - no auth)
CREATE POLICY "Allow public upload access on product-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- Allow public update access to the bucket (for admin dashboard - no auth)
CREATE POLICY "Allow public update access on product-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'product-images');

-- Allow public delete access to the bucket (for admin dashboard - no auth)
CREATE POLICY "Allow public delete access on product-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'product-images');

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Your products table and storage are now ready.
-- Add your Supabase project URL and anon key to the frontend.
