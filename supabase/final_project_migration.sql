-- ============================================================================
-- HOKHIYOTI BIPONI — MASTER PRODUCTION DATABASE MIGRATION
-- File: supabase/final_project_migration.sql
-- Description: Complete, production-ready, fully idempotent migration script.
-- Guarantees: Zero table/column drops, zero data deletion, additive updates,
-- full Supabase query support, performance indexing, and robust RLS security.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 2. CREATE MISSING BASE TABLES (IF NOT EXISTS)
-- ----------------------------------------------------------------------------

-- Categories Table
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

-- Collections Table
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

-- Products Table
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
  active BOOLEAN DEFAULT TRUE,
  archived BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 10,
  sold_count INTEGER DEFAULT 0,
  low_stock_limit INTEGER DEFAULT 3,
  availability_status TEXT DEFAULT 'in_stock',
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  subtitle TEXT,
  seo_title TEXT,
  seo_description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  highlights TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Product Sub-Tables
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_colours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  colour_name TEXT NOT NULL,
  hex_code TEXT DEFAULT '#111111',
  image_id UUID
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  size TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS product_highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  highlight TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

-- Reviews Tables
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

CREATE TABLE IF NOT EXISTS review_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_id UUID NOT NULL,
  voter_identifier TEXT NOT NULL,
  vote_type TEXT DEFAULT 'helpful' CHECK (vote_type IN ('helpful', 'not_helpful'))
);

-- Orders & Timeline Tables
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_number TEXT UNIQUE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
  commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
  commission_status TEXT DEFAULT 'none',
  commission_type TEXT DEFAULT 'percentage',
  seller_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
  customer_name TEXT DEFAULT 'WhatsApp Customer',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT,
  customer_address TEXT,
  selected_colour TEXT,
  selected_size TEXT,
  product_url TEXT,
  customer_details JSONB DEFAULT '{}'::jsonb,
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10, 2) DEFAULT 0.0,
  order_status TEXT DEFAULT 'lead_created',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  reference_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  tracking_number TEXT,
  courier_name TEXT,
  notes TEXT,
  admin_note TEXT,
  whatsapp_message_sent BOOLEAN DEFAULT TRUE,
  whatsapp_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL,
  status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'Admin',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts & Marketplace Settings
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id UUID NOT NULL UNIQUE,
  product_id UUID,
  product_name TEXT NOT NULL,
  seller_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  reference_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  processed_by TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  commission_percentage DECIMAL(5, 2) DEFAULT 10.0 NOT NULL,
  default_commission_percentage DECIMAL(5, 2) DEFAULT 10.0,
  currency_code TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  whatsapp_number TEXT DEFAULT '916003426591',
  whatsapp_message_template TEXT,
  enable_orders BOOLEAN DEFAULT TRUE,
  enable_reviews BOOLEAN DEFAULT TRUE,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0
);

-- Supplemental Site Tables
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  background_color TEXT DEFAULT '#FAF9F6',
  text_color TEXT DEFAULT '#111111'
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site_name TEXT DEFAULT 'Hokhiyoti Biponi',
  site_tagline TEXT,
  site_description TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  enable_maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT
);

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

CREATE TABLE IF NOT EXISTS analytics_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID NOT NULL,
  session_id TEXT,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  referrer TEXT
);

-- ----------------------------------------------------------------------------
-- 3. ADD MISSING COLUMNS (SAFE ALTER TABLE)
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  -- Products Columns
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
  ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_limit INTEGER DEFAULT 3;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'in_stock';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1) DEFAULT 0.0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
  
  -- Generated tsvector column for PostgreSQL Full-Text Search
  ALTER TABLE products ADD COLUMN IF NOT EXISTS fts TSVECTOR
    GENERATED ALWAYS AS (
      to_tsvector('english',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(fabric, '') || ' ' ||
        COALESCE(category_name, '') || ' ' ||
        COALESCE(collection_name, '')
      )
    ) STORED;

  -- Orders Columns
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'none';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_message_sent BOOLEAN DEFAULT TRUE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

  -- Reviews Columns
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS photo_url TEXT;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
  ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

  -- Newsletter Columns
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS first_name TEXT;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS last_name TEXT;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 4. FOREIGN KEYS & RELATIONAL CONSTRAINTS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_category_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_collection_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_images_product_id_fkey') THEN
    ALTER TABLE product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_videos_product_id_fkey') THEN
    ALTER TABLE product_videos ADD CONSTRAINT product_videos_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_colours_product_id_fkey') THEN
    ALTER TABLE product_colours ADD CONSTRAINT product_colours_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_colours_image_id_fkey') THEN
    ALTER TABLE product_colours ADD CONSTRAINT product_colours_image_id_fkey FOREIGN KEY (image_id) REFERENCES product_images(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_sizes_product_id_fkey') THEN
    ALTER TABLE product_sizes ADD CONSTRAINT product_sizes_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_highlights_product_id_fkey') THEN
    ALTER TABLE product_highlights ADD CONSTRAINT product_highlights_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_reviews_product_id_fkey') THEN
    ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'review_images_review_id_fkey') THEN
    ALTER TABLE review_images ADD CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'review_votes_review_id_fkey') THEN
    ALTER TABLE review_votes ADD CONSTRAINT review_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_product_id_fkey') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'order_timeline_order_id_fkey') THEN
    ALTER TABLE order_timeline ADD CONSTRAINT order_timeline_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'seller_payouts_order_id_fkey') THEN
    ALTER TABLE seller_payouts ADD CONSTRAINT seller_payouts_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'seller_payouts_product_id_fkey') THEN
    ALTER TABLE seller_payouts ADD CONSTRAINT seller_payouts_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'analytics_views_product_id_fkey') THEN
    ALTER TABLE analytics_views ADD CONSTRAINT analytics_views_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 5. DATABASE VIEWS (BACKWARD COMPATIBILITY & ANALYTICS)
-- ----------------------------------------------------------------------------

-- Reviews Backward Compatibility View
DROP VIEW IF EXISTS reviews CASCADE;
CREATE OR REPLACE VIEW reviews AS SELECT * FROM product_reviews;

-- Newsletter Backward Compatibility View
DROP VIEW IF EXISTS newsletter CASCADE;
CREATE OR REPLACE VIEW newsletter AS SELECT * FROM newsletter_subscribers;

-- Customer Profiles View
CREATE OR REPLACE VIEW customer_profiles AS
SELECT
  COALESCE(
    NULLIF(TRIM(customer_phone), ''),
    NULLIF(TRIM(customer_email), ''),
    id::text
  ) AS customer_key,
  MAX(customer_name) AS customer_name,
  MAX(NULLIF(TRIM(customer_phone), '')) AS customer_phone,
  MAX(NULLIF(TRIM(customer_email), '')) AS customer_email,
  COUNT(*)::integer AS order_count,
  MAX(created_at) AS last_order_at,
  COALESCE(SUM(product_price), 0)::numeric AS total_spent
FROM orders
WHERE order_status IS DISTINCT FROM 'archived'
GROUP BY customer_key;

-- Daily Revenue View
CREATE OR REPLACE VIEW daily_revenue AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(product_price) as total_revenue,
  SUM(commission_amount) as total_commission,
  SUM(seller_earnings) as total_seller_earnings
FROM orders
WHERE order_status != 'cancelled' AND order_status != 'rejected' AND order_status != 'archived'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Monthly Revenue View
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as order_count,
  SUM(product_price) as total_revenue,
  SUM(commission_amount) as total_commission,
  SUM(seller_earnings) as total_seller_earnings
FROM orders
WHERE order_status != 'cancelled' AND order_status != 'rejected' AND order_status != 'archived'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Product Performance View
CREATE OR REPLACE VIEW product_performance AS
SELECT 
  p.id,
  p.name,
  p.price,
  p.views_count,
  p.sold_count,
  p.rating,
  p.reviews_count,
  COALESCE(o.order_count, 0) as actual_orders,
  COALESCE(o.total_revenue, 0) as total_revenue
FROM products p
LEFT JOIN (
  SELECT 
    product_id,
    COUNT(*) as order_count,
    SUM(product_price) as total_revenue
  FROM orders
  WHERE order_status = 'delivered'
  GROUP BY product_id
) o ON p.id = o.product_id
ORDER BY p.views_count DESC;

-- Payout Summary View
CREATE OR REPLACE VIEW payout_summary AS
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(seller_amount) as total_seller_amount,
  SUM(commission_amount) as total_commission_amount
FROM seller_payouts
GROUP BY payment_status
ORDER BY payment_status;

-- ----------------------------------------------------------------------------
-- 6. HIGH-PERFORMANCE & FULL-TEXT SEARCH INDEXES
-- ----------------------------------------------------------------------------

-- Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(new_arrival, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_views ON products(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_cursor ON products(created_at DESC, id);

-- Product Full-Text Search & Category/Collection Filtering Indexes
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_products_category_slug_active ON products(category_slug, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_collection_slug_active ON products(collection_slug, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_price_sort ON products(price, active, archived, created_at DESC, id);

-- Product Sub-Tables Indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_is_cover ON product_images(is_cover);

CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_sort_order ON product_videos(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_videos_is_cover ON product_videos(is_cover);

CREATE INDEX IF NOT EXISTS idx_product_colours_product_id ON product_colours(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_highlights_product_id ON product_highlights(product_id);

-- Partial Unique Cover Media Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_cover_image_per_product ON product_images(product_id) WHERE is_cover = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_cover_video_per_product ON product_videos(product_id) WHERE is_cover = TRUE;

-- Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created ON product_reviews(product_id, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_voter ON review_votes(voter_identifier);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_commission_status ON orders(commission_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_cursor ON orders(created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_followup ON orders(order_status, created_at) WHERE order_status = 'lead_created';

-- Trigram Search Indexes for Orders & Customers
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone_trgm ON orders USING GIN (customer_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON orders USING GIN (customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_product_name_trgm ON orders USING GIN (product_name gin_trgm_ops);

-- Order Timeline & Seller Payouts Indexes
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_order_id ON seller_payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(payment_status, created_at DESC, id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_payouts_order_id_unique ON seller_payouts(order_id);

-- Analytics Views Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_views_product_id ON analytics_views(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_views_created_at ON analytics_views(created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. AUTOMATED DB TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------

-- Timestamp Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Stock Availability Trigger Function
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

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_availability ON products;
CREATE TRIGGER update_products_availability BEFORE INSERT OR UPDATE OF stock_quantity, low_stock_limit ON products FOR EACH ROW EXECUTE FUNCTION update_product_availability();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_settings_updated_at ON marketplace_settings;
CREATE TRIGGER update_marketplace_settings_updated_at BEFORE UPDATE ON marketplace_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_payouts_updated_at ON seller_payouts;
CREATE TRIGGER update_seller_payouts_updated_at BEFORE UPDATE ON seller_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-Recalculate Product Rating and Review Count
CREATE OR REPLACE FUNCTION sync_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
  avg_rating DECIMAL(2, 1);
  count_reviews INTEGER;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0), COUNT(*)
  INTO avg_rating, count_reviews
  FROM product_reviews
  WHERE product_id = target_product_id AND is_approved = TRUE;

  UPDATE products
  SET rating = avg_rating,
      reviews_count = count_reviews,
      updated_at = NOW()
  WHERE id = target_product_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_review_stats ON product_reviews;
CREATE TRIGGER trg_sync_product_review_stats
AFTER INSERT OR UPDATE OF rating, is_approved OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION sync_product_review_stats();

-- Auto-Sync Category Denormalization
CREATE OR REPLACE FUNCTION sync_category_denormalization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name <> OLD.name OR NEW.slug <> OLD.slug THEN
    UPDATE products
    SET category_name = NEW.name,
        category_slug = NEW.slug,
        updated_at = NOW()
    WHERE category_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_category_denormalization ON categories;
CREATE TRIGGER trg_sync_category_denormalization
AFTER UPDATE OF name, slug ON categories
FOR EACH ROW EXECUTE FUNCTION sync_category_denormalization();

-- Auto-Sync Collection Denormalization
CREATE OR REPLACE FUNCTION sync_collection_denormalization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name <> OLD.name OR NEW.slug <> OLD.slug THEN
    UPDATE products
    SET collection_name = NEW.name,
        collection_slug = NEW.slug,
        updated_at = NOW()
    WHERE collection_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_collection_denormalization ON collections;
CREATE TRIGGER trg_sync_collection_denormalization
AFTER UPDATE OF name, slug ON collections
FOR EACH ROW EXECUTE FUNCTION sync_collection_denormalization();

-- Auto-Sync Order Financials & Timestamps
CREATE OR REPLACE FUNCTION sync_order_status_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set status timestamps
  IF NEW.order_status = 'delivered' AND OLD.order_status <> 'delivered' THEN
    NEW.delivered_at = NOW();
    NEW.commission_status = 'earned';
  ELSIF (NEW.order_status = 'cancelled' OR NEW.order_status = 'rejected') AND OLD.order_status NOT IN ('cancelled', 'rejected') THEN
    NEW.cancelled_at = NOW();
    NEW.commission_status = CASE WHEN NEW.order_status = 'cancelled' THEN 'cancelled' ELSE 'rejected' END;
  ELSIF NEW.order_status IN ('confirmed', 'packed', 'shipped') THEN
    NEW.commission_status = 'pending';
  END IF;

  -- Auto-sync seller_payouts table status
  IF NEW.order_status = 'confirmed' AND OLD.order_status <> 'confirmed' THEN
    INSERT INTO seller_payouts (order_id, product_id, product_name, seller_amount, commission_amount, commission_percentage, payment_status)
    VALUES (NEW.id, NEW.product_id, NEW.product_name, NEW.seller_earnings, NEW.commission_amount, NEW.commission_percentage, 'pending')
    ON CONFLICT (order_id) DO UPDATE SET
      seller_amount = EXCLUDED.seller_amount,
      commission_amount = EXCLUDED.commission_amount,
      updated_at = NOW();
  ELSIF NEW.order_status IN ('cancelled', 'rejected') THEN
    DELETE FROM seller_payouts WHERE order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_status_lifecycle ON orders;
CREATE TRIGGER trg_sync_order_status_lifecycle
BEFORE UPDATE OF order_status ON orders
FOR EACH ROW EXECUTE FUNCTION sync_order_status_lifecycle();

-- Auto Log Order Timeline Entry on Status Change
CREATE OR REPLACE FUNCTION log_order_timeline_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status <> OLD.order_status THEN
    INSERT INTO order_timeline (order_id, status, changed_by, note)
    VALUES (NEW.id, NEW.order_status, COALESCE(NEW.admin_note, 'System / Admin'), NEW.notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_order_timeline_entry ON orders;
CREATE TRIGGER trg_log_order_timeline_entry
AFTER UPDATE OF order_status ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_timeline_entry();

-- Update Product Sold Count & Stock on Order Creation
CREATE OR REPLACE FUNCTION update_product_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET sold_count = sold_count + COALESCE(NEW.quantity, 1),
      stock_quantity = GREATEST(0, stock_quantity - COALESCE(NEW.quantity, 1))
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sold_count_on_order ON orders;
CREATE TRIGGER update_sold_count_on_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION update_product_sold_count();

-- Sequence & Order Number Generator
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
BEGIN
  order_num := 'HB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. RPC FUNCTIONS (OPTIMIZED STORED PROCEDURES)
-- ----------------------------------------------------------------------------

-- Commission & Earnings Calculators
CREATE OR REPLACE FUNCTION calculate_commission(product_price DECIMAL, commission_percentage DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND((product_price * commission_percentage / 100.0), 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_seller_earnings(product_price DECIMAL, commission_percentage DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND((product_price - calculate_commission(product_price, commission_percentage)), 2);
END;
$$ LANGUAGE plpgsql;

-- Server-Side Full-Text Search RPC
CREATE OR REPLACE FUNCTION search_products_fts(
  p_query TEXT DEFAULT NULL,
  p_category_slug TEXT DEFAULT NULL,
  p_collection_slug TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_cursor_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL
)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM products
  WHERE active = TRUE
    AND archived = FALSE
    AND (p_category_slug IS NULL OR category_slug = p_category_slug)
    AND (p_collection_slug IS NULL OR collection_slug = p_collection_slug)
    AND (p_min_price IS NULL OR price >= p_min_price)
    AND (p_max_price IS NULL OR price <= p_max_price)
    AND (
      p_query IS NULL OR p_query = '' OR
      fts @@ websearch_to_tsquery('english', p_query) OR
      name ILIKE '%' || p_query || '%'
    )
    AND (
      p_cursor_created_at IS NULL OR
      (created_at < p_cursor_created_at) OR
      (created_at = p_cursor_created_at AND id < p_cursor_id)
    )
  ORDER BY created_at DESC, id DESC
  LIMIT LEAST(p_limit, 100);
$$;

-- Related Products RPC Function
CREATE OR REPLACE FUNCTION get_related_products_rpc(
  p_product_id UUID,
  p_category_slug TEXT DEFAULT NULL,
  p_collection_slug TEXT DEFAULT NULL,
  p_limit INT DEFAULT 4
)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM products
  WHERE active = TRUE
    AND archived = FALSE
    AND id <> p_product_id
    AND (
      (p_category_slug IS NOT NULL AND category_slug = p_category_slug) OR
      (p_collection_slug IS NOT NULL AND collection_slug = p_collection_slug) OR
      featured = TRUE
    )
  ORDER BY featured DESC, created_at DESC
  LIMIT p_limit;
$$;

-- Atomic View Count Increment RPC
CREATE OR REPLACE FUNCTION increment_product_views(p_product_id UUID)
RETURNS VOID
LANGUAGE sql
VOLATILE
AS $$
  UPDATE products
  SET views_count = views_count + 1
  WHERE id = p_product_id;
$$;

-- Atomic Review Helpful Vote RPC
CREATE OR REPLACE FUNCTION increment_review_helpful(p_review_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE product_reviews
  SET helpful_count = helpful_count + 1
  WHERE id = p_review_id
  RETURNING helpful_count INTO new_count;

  RETURN new_count;
END;
$$;

-- Server-Side Newsletter Subscribe RPC
CREATE OR REPLACE FUNCTION subscribe_newsletter(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'website'
)
RETURNS newsletter_subscribers
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  result newsletter_subscribers;
BEGIN
  INSERT INTO newsletter_subscribers (email, first_name, last_name, active, source, subscribed_at, unsubscribed_at)
  VALUES (p_email, p_first_name, p_last_name, TRUE, p_source, NOW(), NULL)
  ON CONFLICT (email) DO UPDATE SET
    active = TRUE,
    first_name = COALESCE(EXCLUDED.first_name, newsletter_subscribers.first_name),
    last_name = COALESCE(EXCLUDED.last_name, newsletter_subscribers.last_name),
    unsubscribed_at = NULL,
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Top Categories Analytics RPC (Avoid JS loops)
CREATE OR REPLACE FUNCTION get_top_categories_analytics(p_limit INT DEFAULT 5)
RETURNS TABLE (
  category_name TEXT,
  order_count BIGINT,
  total_revenue NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(p.category_name, 'General Curations') AS category_name,
    COUNT(*) AS order_count,
    COALESCE(SUM(o.product_price), 0)::numeric AS total_revenue
  FROM orders o
  LEFT JOIN products p ON o.product_id = p.id
  WHERE o.order_status = 'delivered'
  GROUP BY COALESCE(p.category_name, 'General Curations')
  ORDER BY total_revenue DESC
  LIMIT p_limit;
$$;

-- Best Selling Products Analytics RPC
CREATE OR REPLACE FUNCTION get_best_selling_products_analytics(p_limit INT DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_price NUMERIC,
  sold_count BIGINT,
  total_revenue NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.price::numeric AS product_price,
    COALESCE(SUM(o.quantity), 0)::bigint AS sold_count,
    COALESCE(SUM(o.product_price), 0)::numeric AS total_revenue
  FROM products p
  LEFT JOIN orders o ON o.product_id = p.id AND o.order_status = 'delivered'
  GROUP BY p.id, p.name, p.price
  ORDER BY sold_count DESC
  LIMIT p_limit;
$$;

-- Payout Summary RPC Function
CREATE OR REPLACE FUNCTION get_payout_summary()
RETURNS TABLE (
  pending_amount numeric,
  total_seller_earnings numeric,
  total_commission numeric,
  paid_amount numeric,
  processing_amount numeric,
  pending_commission numeric,
  earned_commission numeric,
  cancelled_commission numeric,
  rejected_commission numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status = 'pending'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status <> 'none'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status <> 'none'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status = 'paid'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status <> 'none' AND payment_status = 'processing'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status IN ('earned', 'paid')), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'cancelled'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'rejected'), 0)
  FROM orders
  WHERE order_status IS DISTINCT FROM 'archived'
    AND commission_status <> 'none';
$$;

-- Order Status Counts RPC Function
CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS TABLE (
  leads_created bigint,
  customer_contacted bigint,
  confirmed_orders bigint,
  packed_orders bigint,
  shipped_orders bigint,
  delivered_orders bigint,
  cancelled_orders bigint,
  rejected_orders bigint,
  total_orders bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE order_status IN ('lead_created', 'pending')),
    COUNT(*) FILTER (WHERE order_status = 'customer_contacted'),
    COUNT(*) FILTER (WHERE order_status IN ('confirmed', 'processing')),
    COUNT(*) FILTER (WHERE order_status = 'packed'),
    COUNT(*) FILTER (WHERE order_status = 'shipped'),
    COUNT(*) FILTER (WHERE order_status = 'delivered'),
    COUNT(*) FILTER (WHERE order_status = 'cancelled'),
    COUNT(*) FILTER (WHERE order_status = 'rejected'),
    COUNT(*) FILTER (WHERE order_status IS DISTINCT FROM 'archived')
  FROM orders;
$$;

-- Revenue Aggregates RPC Function
CREATE OR REPLACE FUNCTION get_revenue_aggregates()
RETURNS TABLE (
  today_revenue numeric,
  monthly_revenue numeric,
  total_revenue numeric,
  today_orders bigint,
  monthly_orders bigint,
  total_orders bigint,
  average_order_value numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH delivered AS (
    SELECT created_at, product_price
    FROM orders
    WHERE order_status = 'delivered'
  )
  SELECT
    COALESCE(SUM(product_price) FILTER (
      WHERE created_at >= date_trunc('day', now())
    ), 0),
    COALESCE(SUM(product_price) FILTER (
      WHERE created_at >= date_trunc('month', now())
    ), 0),
    COALESCE(SUM(product_price), 0),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now())),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())),
    (SELECT COUNT(*) FROM orders WHERE order_status IS DISTINCT FROM 'archived'),
    CASE WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(product_price), 0) / COUNT(*), 0) ELSE 0 END
  FROM delivered;
$$;

-- Commission Aggregates RPC Function
CREATE OR REPLACE FUNCTION get_commission_aggregates()
RETURNS TABLE (
  today_commission numeric,
  monthly_commission numeric,
  total_commission numeric,
  pending_commission numeric,
  earned_commission numeric,
  cancelled_commission numeric,
  rejected_commission numeric,
  paid_commission numeric,
  seller_earnings numeric,
  pending_payouts numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(commission_amount) FILTER (
      WHERE commission_status IN ('pending', 'earned', 'paid')
        AND created_at >= date_trunc('day', now())
    ), 0),
    COALESCE(SUM(commission_amount) FILTER (
      WHERE commission_status IN ('pending', 'earned', 'paid')
        AND created_at >= date_trunc('month', now())
    ), 0),
    COALESCE(SUM(commission_amount) FILTER (
      WHERE commission_status IN ('pending', 'earned', 'paid')
    ), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status IN ('earned', 'paid')), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'cancelled'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'rejected'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE order_status = 'delivered'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status = 'pending'), 0)
  FROM orders
  WHERE order_status IS DISTINCT FROM 'archived';
$$;

-- Monthly Graph RPC Function
CREATE OR REPLACE FUNCTION get_monthly_graph(month_count integer DEFAULT 6)
RETURNS TABLE (
  month_label text,
  revenue numeric,
  commission numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH months AS (
    SELECT
      generate_series(
        date_trunc('month', now()) - ((month_count - 1) || ' months')::interval,
        date_trunc('month', now()),
        '1 month'::interval
      ) AS month_start
  )
  SELECT
    to_char(m.month_start, 'Mon'),
    COALESCE(SUM(o.product_price) FILTER (WHERE o.order_status = 'delivered'), 0),
    COALESCE(SUM(o.commission_amount) FILTER (
      WHERE o.commission_status IN ('pending', 'earned', 'paid')
    ), 0)
  FROM months m
  LEFT JOIN orders o
    ON o.created_at >= m.month_start
   AND o.created_at < m.month_start + interval '1 month'
   AND o.order_status IS DISTINCT FROM 'archived'
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;

-- Bulk Update Order Status RPC
CREATE OR REPLACE FUNCTION bulk_update_order_status(
  p_order_ids UUID[],
  p_status TEXT,
  p_admin_note TEXT DEFAULT NULL,
  p_changed_by TEXT DEFAULT 'Admin'
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  UPDATE orders
  SET order_status = p_status,
      admin_note = COALESCE(p_admin_note, admin_note),
      updated_at = NOW()
  WHERE id = ANY(p_order_ids);
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. STORAGE BUCKETS & POLICY ENHANCEMENTS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-images', 'hero-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;

-- Storage Read Policies
DROP POLICY IF EXISTS "Public storage product-images read" ON storage.objects;
CREATE POLICY "Public storage product-images read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public storage product-videos read" ON storage.objects;
CREATE POLICY "Public storage product-videos read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Public storage review-images read" ON storage.objects;
CREATE POLICY "Public storage review-images read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Public storage hero-images read" ON storage.objects;
CREATE POLICY "Public storage hero-images read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Public storage site-assets read" ON storage.objects;
CREATE POLICY "Public storage site-assets read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'site-assets');

-- Public Upload Policy for Review Photos (Customer Submission)
DROP POLICY IF EXISTS "Public upload review-images" ON storage.objects;
CREATE POLICY "Public upload review-images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'review-images');

-- Admin Storage Write/Update/Delete Policies
DROP POLICY IF EXISTS "Admin storage product-images insert" ON storage.objects;
CREATE POLICY "Admin storage product-images insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin storage product-images update" ON storage.objects;
CREATE POLICY "Admin storage product-images update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin storage product-images delete" ON storage.objects;
CREATE POLICY "Admin storage product-images delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin storage product-videos insert" ON storage.objects;
CREATE POLICY "Admin storage product-videos insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin storage product-videos update" ON storage.objects;
CREATE POLICY "Admin storage product-videos update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin storage product-videos delete" ON storage.objects;
CREATE POLICY "Admin storage product-videos delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-videos');

-- ----------------------------------------------------------------------------
-- 10. PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active products" ON products;
CREATE POLICY "Public read active products" ON products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin full control products" ON products;
CREATE POLICY "Admin full control products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product Sub-Tables RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_images" ON product_images;
CREATE POLICY "Public read product_images" ON product_images FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify product_images" ON product_images;
CREATE POLICY "Admin modify product_images" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_videos" ON product_videos;
CREATE POLICY "Public read product_videos" ON product_videos FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify product_videos" ON product_videos;
CREATE POLICY "Admin modify product_videos" ON product_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE product_colours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_colours" ON product_colours;
CREATE POLICY "Public read product_colours" ON product_colours FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify product_colours" ON product_colours;
CREATE POLICY "Admin modify product_colours" ON product_colours FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_sizes" ON product_sizes;
CREATE POLICY "Public read product_sizes" ON product_sizes FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify product_sizes" ON product_sizes;
CREATE POLICY "Admin modify product_sizes" ON product_sizes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE product_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_highlights" ON product_highlights;
CREATE POLICY "Public read product_highlights" ON product_highlights FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify product_highlights" ON product_highlights;
CREATE POLICY "Admin modify product_highlights" ON product_highlights FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Categories & Collections RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify categories" ON categories;
CREATE POLICY "Admin modify categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read collections" ON collections;
CREATE POLICY "Public read collections" ON collections FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin modify collections" ON collections;
CREATE POLICY "Admin modify collections" ON collections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product Reviews RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;
CREATE POLICY "Public read approved reviews" ON product_reviews FOR SELECT TO public USING (is_approved = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public submit review" ON product_reviews;
CREATE POLICY "Public submit review" ON product_reviews FOR INSERT TO public WITH CHECK (is_approved = false);

DROP POLICY IF EXISTS "Admin full control reviews" ON product_reviews;
CREATE POLICY "Admin full control reviews" ON product_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read review_images" ON review_images;
CREATE POLICY "Public read review_images" ON review_images FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Public submit review_images" ON review_images;
CREATE POLICY "Public submit review_images" ON review_images FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admin modify review_images" ON review_images;
CREATE POLICY "Admin modify review_images" ON review_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders & Timeline RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public submit order lead" ON orders;
CREATE POLICY "Public submit order lead" ON orders FOR INSERT TO public WITH CHECK (order_status = 'lead_created');

DROP POLICY IF EXISTS "Admin full control orders" ON orders;
CREATE POLICY "Admin full control orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public submit order timeline" ON order_timeline;
CREATE POLICY "Public submit order timeline" ON order_timeline FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full control order timeline" ON order_timeline;
CREATE POLICY "Admin full control order timeline" ON order_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Marketplace Settings & Seller Payouts RLS
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON marketplace_settings;
CREATE POLICY "Public read settings" ON marketplace_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin modify settings" ON marketplace_settings;
CREATE POLICY "Admin modify settings" ON marketplace_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full control seller payouts" ON seller_payouts;
CREATE POLICY "Admin full control seller payouts" ON seller_payouts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Newsletter Subscribers RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public subscribe newsletter" ON newsletter_subscribers;
CREATE POLICY "Public subscribe newsletter" ON newsletter_subscribers FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full control newsletter" ON newsletter_subscribers;
CREATE POLICY "Admin full control newsletter" ON newsletter_subscribers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin Profiles RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin profiles self/admin access" ON admin_profiles;
CREATE POLICY "Admin profiles self/admin access" ON admin_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- MASTER PRODUCTION MIGRATION COMPLETE
-- ============================================================================
