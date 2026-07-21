# Hokhiyoti - Supabase Integration Setup

This project now uses Supabase for product management (database + storage). No authentication is required.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually 1-2 minutes)

### 2. Run SQL Scripts

In your Supabase project dashboard, go to the **SQL Editor** and run these scripts in order:

#### A. Create Products Table
Copy and run the contents of `supabase/schema.sql`:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_collection_slug ON products(collection_slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

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
```

#### B. Create Storage Bucket
Copy and run the contents of `supabase/storage-setup.sql`:
```sql
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

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
```

### 3. Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon public key**
3. Create a `.env` file in the project root (copy from `.env.example`):
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the Development Server

```bash
npm run dev
```

## Admin Dashboard

Access the admin dashboard at `/admin` to:
- Add new products with image upload
- Edit existing products
- Delete products
- Manage product details (title, price, description, category, fabric, stock, featured flags)

## How It Works

- **Products are stored in Supabase database** - No more hardcoded JSON files
- **Images are uploaded to Supabase Storage** - Public URLs are stored in the products table
- **Real-time updates** - When you add/edit/delete a product in the admin dashboard, it instantly appears on the website
- **No authentication required** - Public access policies allow anyone to view products

## Features

- ✅ Full CRUD operations for products
- ✅ Image upload to Supabase Storage
- ✅ Live fetching from database
- ✅ Search functionality
- ✅ Filter by category and collection
- ✅ Featured, New Arrival, and Best Seller flags
- ✅ Stock management
