-- ============================================================================
-- HOKHIYOTI BIPONI - COMPLETE PRODUCTION DATABASE SETUP
-- Execute this entire file in the Supabase SQL Editor.
-- Everything works out-of-the-box with zero manual SQL edits required.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================
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

-- Ensure all columns exist even if table already existed
DO $$ BEGIN
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_title TEXT;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_description TEXT;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 2. COLLECTIONS TABLE
-- ============================================================================
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

DO $$ BEGIN
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 3. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  category_id UUID,
  category_slug TEXT,
  category_name TEXT,
  collection_id UUID,
  collection_slug TEXT,
  collection_name TEXT,
  enable_sizes BOOLEAN DEFAULT FALSE,
  fabric TEXT,
  care_instructions TEXT,
  shipping_info TEXT,
  return_policy TEXT,
  additional_info TEXT,
  featured BOOLEAN DEFAULT FALSE,
  new_arrival BOOLEAN DEFAULT FALSE,
  best_seller BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 10,
  sold_count INTEGER DEFAULT 0,
  low_stock_limit INTEGER DEFAULT 3,
  availability_status TEXT DEFAULT 'in_stock',
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  subtitle TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  highlights TEXT[] DEFAULT ARRAY[]::TEXT[]
);

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10, 2);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS category_slug TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_slug TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_name TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS enable_sizes BOOLEAN DEFAULT FALSE;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_info TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_info TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS new_arrival BOOLEAN DEFAULT FALSE;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS best_seller BOOLEAN DEFAULT FALSE;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_limit INTEGER DEFAULT 3;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'in_stock';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1) DEFAULT 0.0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT ARRAY[]::TEXT[];
  ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY[]::TEXT[];
  ALTER TABLE products ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add foreign keys if they don't already exist (safe to run multiple times)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_category_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_collection_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 4. PRODUCT IMAGES TABLE (RELATIONAL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE
);

DO $$ BEGIN
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_images_product_id_fkey') THEN
    ALTER TABLE product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 5. PRODUCT COLOURS TABLE (RELATIONAL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_colours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  colour_name TEXT NOT NULL,
  hex_code TEXT DEFAULT '#111111',
  image_id UUID
);

DO $$ BEGIN
  ALTER TABLE product_colours ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE product_colours ADD COLUMN IF NOT EXISTS hex_code TEXT DEFAULT '#111111';
  ALTER TABLE product_colours ADD COLUMN IF NOT EXISTS image_id UUID;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_colours_product_id_fkey') THEN
    ALTER TABLE product_colours ADD CONSTRAINT product_colours_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 6. PRODUCT SIZES TABLE (RELATIONAL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  size TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 5
);

DO $$ BEGIN
  ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 5;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_sizes_product_id_fkey') THEN
    ALTER TABLE product_sizes ADD CONSTRAINT product_sizes_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 7. PRODUCT HIGHLIGHTS TABLE (RELATIONAL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  highlight TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

DO $$ BEGIN
  ALTER TABLE product_highlights ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE product_highlights ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_highlights_product_id_fkey') THEN
    ALTER TABLE product_highlights ADD CONSTRAINT product_highlights_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 8. PRODUCT REVIEWS TABLE (MODERATION QUEUE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT NOT NULL,
  photo_url TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0
);

DO $$ BEGIN
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS photo_url TEXT;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_reviews_product_id_fkey') THEN
    ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 9. NEWSLETTER SUBSCRIBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
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

DO $$ BEGIN
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS first_name TEXT;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS last_name TEXT;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backward compatibility: Drop any existing 'newsletter' view first, then recreate
DROP VIEW IF EXISTS newsletter CASCADE;
CREATE OR REPLACE VIEW newsletter AS SELECT * FROM newsletter_subscribers;

-- ============================================================================
-- 10. ADMIN PROFILES TABLE
-- ============================================================================
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

DO $$ BEGIN
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HIGH-PERFORMANCE INDEXES
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES FOR ALL TABLES
-- ============================================================================

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
DROP POLICY IF EXISTS "Public read reviews" ON product_reviews;
DROP POLICY IF EXISTS "Public submit review" ON product_reviews;
DROP POLICY IF EXISTS "Public update review helpful" ON product_reviews;
DROP POLICY IF EXISTS "Public admin review modify" ON product_reviews;
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT TO public USING (true);
CREATE POLICY "Public submit review" ON product_reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update review helpful" ON product_reviews FOR UPDATE TO public USING (true);
CREATE POLICY "Public admin review modify" ON product_reviews FOR ALL TO public USING (true);

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access categories" ON categories;
CREATE POLICY "Public access categories" ON categories FOR ALL TO public USING (true);

-- Collections RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access collections" ON collections;
CREATE POLICY "Public access collections" ON collections FOR ALL TO public USING (true);

-- Newsletter Subscribers RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Public access newsletter_subscribers" ON newsletter_subscribers FOR ALL TO public USING (true);

-- Admin Profiles RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access admin_profiles" ON admin_profiles;
CREATE POLICY "Public access admin_profiles" ON admin_profiles FOR ALL TO public USING (true);

-- ============================================================================
-- STORAGE BUCKETS & STORAGE POLICIES
-- ============================================================================
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

-- ============================================================================
-- PRODUCTION SETUP COMPLETE
-- ============================================================================
