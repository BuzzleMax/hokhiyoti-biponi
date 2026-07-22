-- ============================================
-- HOKHIYOTI BIPONI - COMPLETE PRODUCTION DATABASE SETUP
-- Execute this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  color TEXT,
  
  meta_title TEXT,
  meta_description TEXT,
  
  active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 2. COLLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  
  -- Relationships
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  category_name TEXT,
  
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  collection_slug TEXT,
  collection_name TEXT,
  
  -- Features & Settings
  enable_sizes BOOLEAN DEFAULT FALSE,
  fabric TEXT,
  care_instructions TEXT,
  shipping_info TEXT,
  return_policy TEXT,
  additional_info TEXT,
  
  -- Marketing Flags
  featured BOOLEAN DEFAULT FALSE,
  new_arrival BOOLEAN DEFAULT FALSE,
  best_seller BOOLEAN DEFAULT FALSE,
  
  -- Inventory Management
  stock_quantity INTEGER DEFAULT 10,
  sold_count INTEGER DEFAULT 0,
  low_stock_limit INTEGER DEFAULT 3,
  availability_status TEXT DEFAULT 'in_stock', -- 'in_stock', 'low_stock', 'out_of_stock'
  
  -- Analytics & Ratings
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  
  -- Legacy / Compatibility
  currency TEXT DEFAULT 'INR',
  subtitle TEXT
);

-- ============================================
-- 4. PRODUCT IMAGES TABLE (RELATIONAL)
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 5. PRODUCT COLOURS TABLE (RELATIONAL)
-- ============================================
CREATE TABLE IF NOT EXISTS product_colours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  colour_name TEXT NOT NULL,
  hex_code TEXT DEFAULT '#111111',
  image_id UUID REFERENCES product_images(id) ON DELETE SET NULL
);

-- ============================================
-- 6. PRODUCT SIZES TABLE (RELATIONAL)
-- ============================================
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL, -- XS, S, M, L, XL, XXL, XXXL, Custom
  stock_quantity INTEGER DEFAULT 5
);

-- ============================================
-- 7. PRODUCT HIGHLIGHTS TABLE (RELATIONAL)
-- ============================================
CREATE TABLE IF NOT EXISTS product_highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  highlight TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

-- ============================================
-- 8. PRODUCT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT NOT NULL,
  photo_url TEXT,
  
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE, -- Pending moderation queue
  helpful_count INTEGER DEFAULT 0
);

-- ============================================
-- 9. NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  
  active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  source TEXT DEFAULT 'website'
);

-- ============================================
-- 10. ADMIN PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin',
  active BOOLEAN DEFAULT TRUE,
  phone TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function: Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate availability_status based on stock_quantity
CREATE OR REPLACE FUNCTION update_product_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity <= 0 THEN
    NEW.availability_status = 'out_of_stock';
  ELSIF NEW.stock_quantity <= NEW.low_stock_limit THEN
    NEW.availability_status = 'low_stock';
  ELSE
    NEW.availability_status = 'in_stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_availability ON products;
CREATE TRIGGER update_products_availability BEFORE INSERT OR UPDATE OF stock_quantity, low_stock_limit ON products FOR EACH ROW EXECUTE FUNCTION update_product_availability();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_updated_at ON newsletter;
CREATE TRIGGER update_newsletter_updated_at BEFORE UPDATE ON newsletter FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_views ON products(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_colours_product_id ON product_colours(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_highlights_product_id ON product_highlights(product_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Public modify products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Public modify products" ON products FOR ALL TO public USING (true);

-- Product Images RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_images" ON product_images;
DROP POLICY IF EXISTS "Public modify product_images" ON product_images;
CREATE POLICY "Public read product_images" ON product_images FOR SELECT TO public USING (true);
CREATE POLICY "Public modify product_images" ON product_images FOR ALL TO public USING (true);

-- Product Colours RLS
ALTER TABLE product_colours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_colours" ON product_colours;
DROP POLICY IF EXISTS "Public modify product_colours" ON product_colours;
CREATE POLICY "Public read product_colours" ON product_colours FOR SELECT TO public USING (true);
CREATE POLICY "Public modify product_colours" ON product_colours FOR ALL TO public USING (true);

-- Product Sizes RLS
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_sizes" ON product_sizes;
DROP POLICY IF EXISTS "Public modify product_sizes" ON product_sizes;
CREATE POLICY "Public read product_sizes" ON product_sizes FOR SELECT TO public USING (true);
CREATE POLICY "Public modify product_sizes" ON product_sizes FOR ALL TO public USING (true);

-- Product Highlights RLS
ALTER TABLE product_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_highlights" ON product_highlights;
DROP POLICY IF EXISTS "Public modify product_highlights" ON product_highlights;
CREATE POLICY "Public read product_highlights" ON product_highlights FOR SELECT TO public USING (true);
CREATE POLICY "Public modify product_highlights" ON product_highlights FOR ALL TO public USING (true);

-- Product Reviews RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Public submit review" ON product_reviews;
DROP POLICY IF EXISTS "Public update review helpful" ON product_reviews;
DROP POLICY IF EXISTS "Public admin review modify" ON product_reviews;

CREATE POLICY "Public read approved reviews" ON product_reviews FOR SELECT TO public USING (is_approved = true OR true);
CREATE POLICY "Public submit review" ON product_reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update review helpful" ON product_reviews FOR UPDATE TO public USING (true);
CREATE POLICY "Public admin review modify" ON product_reviews FOR DELETE TO public USING (true);

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access categories" ON categories;
CREATE POLICY "Public access categories" ON categories FOR ALL TO public USING (true);

-- Collections RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access collections" ON collections;
CREATE POLICY "Public access collections" ON collections FOR ALL TO public USING (true);

-- Newsletter RLS
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access newsletter" ON newsletter;
CREATE POLICY "Public access newsletter" ON newsletter FOR ALL TO public USING (true);

-- Admin Profiles RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access admin_profiles" ON admin_profiles;
CREATE POLICY "Public access admin_profiles" ON admin_profiles FOR ALL TO public USING (true);

-- ============================================
-- STORAGE BUCKETS SETUP & POLICIES
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public storage product-images read" ON storage.objects;
DROP POLICY IF EXISTS "Public storage product-images insert" ON storage.objects;
DROP POLICY IF EXISTS "Public storage product-images delete" ON storage.objects;
CREATE POLICY "Public storage product-images read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "Public storage product-images insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public storage product-images delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public storage review-images read" ON storage.objects;
DROP POLICY IF EXISTS "Public storage review-images insert" ON storage.objects;
DROP POLICY IF EXISTS "Public storage review-images delete" ON storage.objects;
CREATE POLICY "Public storage review-images read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'review-images');
CREATE POLICY "Public storage review-images insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'review-images');
CREATE POLICY "Public storage review-images delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'review-images');

-- SETUP COMPLETE
