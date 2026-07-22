-- ============================================
-- COMPLETE SUPABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT ''
);

-- ============================================
-- COLLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT ''
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
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
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  category_name TEXT,

  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
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
-- NEWSLETTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'::jsonb,
  source TEXT
);

-- ============================================
-- ADMIN_PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  phone TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_updated_at ON newsletter;
CREATE TRIGGER update_newsletter_updated_at
  BEFORE UPDATE ON newsletter
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE ADMIN PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION create_admin_profile_on_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_profile_on_user_signup();

-- ============================================
-- INDEXES - PRODUCTS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_collection_slug ON products(collection_slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN (images);

-- ============================================
-- INDEXES - CATEGORIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at DESC);

-- ============================================
-- INDEXES - COLLECTIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- ============================================
-- INDEXES - NEWSLETTER
-- ============================================
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter(active);
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - PRODUCTS
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public insert access" ON products;
DROP POLICY IF EXISTS "Allow public update access" ON products;
DROP POLICY IF EXISTS "Allow public delete access" ON products;

CREATE POLICY "Allow public read access" ON products
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access" ON products
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access" ON products
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete access" ON products
  FOR DELETE TO public USING (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - CATEGORIES
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON categories;
DROP POLICY IF EXISTS "Allow public insert access" ON categories;
DROP POLICY IF EXISTS "Allow public update access" ON categories;
DROP POLICY IF EXISTS "Allow public delete access" ON categories;

CREATE POLICY "Allow public read access" ON categories
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access" ON categories
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access" ON categories
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete access" ON categories
  FOR DELETE TO public USING (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - COLLECTIONS
-- ============================================
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON collections;
DROP POLICY IF EXISTS "Allow public insert access" ON collections;
DROP POLICY IF EXISTS "Allow public update access" ON collections;
DROP POLICY IF EXISTS "Allow public delete access" ON collections;

CREATE POLICY "Allow public read access" ON collections
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access" ON collections
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access" ON collections
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete access" ON collections
  FOR DELETE TO public USING (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - NEWSLETTER
-- ============================================
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON newsletter;
DROP POLICY IF EXISTS "Allow public insert access" ON newsletter;
DROP POLICY IF EXISTS "Allow public update access" ON newsletter;
DROP POLICY IF EXISTS "Allow public delete access" ON newsletter;

CREATE POLICY "Allow public read access" ON newsletter
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access" ON newsletter
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access" ON newsletter
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete access" ON newsletter
  FOR DELETE TO public USING (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - ADMIN_PROFILES
-- ============================================
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON admin_profiles;
DROP POLICY IF EXISTS "Allow public insert access" ON admin_profiles;
DROP POLICY IF EXISTS "Allow public update access" ON admin_profiles;
DROP POLICY IF EXISTS "Allow public delete access" ON admin_profiles;

CREATE POLICY "Allow public read access" ON admin_profiles
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access" ON admin_profiles
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access" ON admin_profiles
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete access" ON admin_profiles
  FOR DELETE TO public USING (true);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow public read access on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload access on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access on product-images" ON storage.objects;

CREATE POLICY "Allow public read access on product-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public upload access on product-images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public update access on product-images"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public delete access on product-images"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'product-images');

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Tables: products, categories, collections, newsletter, admin_profiles
-- Storage bucket: product-images
-- All with RLS policies allowing public access
-- Updated_at triggers on all tables
-- Admin profile auto-creation on user signup

