-- ============================================================================
-- HOKHIYOTI BIPONI - CUSTOMER AUTHENTICATION & PROFILES MIGRATION
-- 
-- This migration adds customer profile management, address system, and 
-- proper order integration with Supabase Phone OTP authentication.
-- 
-- SAFETY: This script uses IF NOT EXISTS and safe ALTER TABLE operations.
-- It does NOT drop existing tables or delete existing data.
-- ============================================================================

-- Enable UUID extension (should already be enabled, but safe to check)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE CUSTOMER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'employee', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table somehow exists without them (defensive)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  
  -- Add role constraint if missing
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'employee', 'admin'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 2. CREATE CUSTOMER ADDRESSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table exists without them (defensive)
DO $$ BEGIN
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS address_line_1 TEXT NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS landmark TEXT;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS city TEXT NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS state TEXT NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS postal_code TEXT NOT NULL;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add foreign key if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_addresses_user_id_fkey') THEN
    ALTER TABLE public.customer_addresses ADD CONSTRAINT customer_addresses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 3. EXTEND ORDERS TABLE FOR AUTHENTICATED CUSTOMERS
-- ============================================================================

-- Add user_id field (nullable for backward compatibility with existing WhatsApp orders)
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add foreign key if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_user_id_fkey') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add structured shipping address snapshot fields to orders
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_full_name TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line_1 TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line_2 TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_landmark TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'India';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON public.customer_addresses(is_default);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================================================
-- 5. CREATE UPDATED_AT TRIGGER FUNCTION (if not exists)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. APPLY UPDATED_AT TRIGGERS TO NEW TABLES
-- ============================================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on customer tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Customers can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Customers can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Customers can read their own profile
CREATE POLICY "Customers can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Customers can update their own profile (but NOT their role)
CREATE POLICY "Customers can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Customers can insert their own profile (on signup)
CREATE POLICY "Customers can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'customer');

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Admins can update profiles (but cannot promote users to admin)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  )
  WITH CHECK (
    -- Prevent self-promotion and role escalation
    (role = 'customer' OR role = 'employee') AND
    NOT (role = 'admin' AND id = auth.uid())
  );

-- ============================================================================
-- CUSTOMER ADDRESSES RLS POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Customers can read own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can insert own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can update own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can delete own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Admins can read all addresses" ON public.customer_addresses;

-- Customers can read their own addresses
CREATE POLICY "Customers can read own addresses" ON public.customer_addresses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Customers can insert their own addresses
CREATE POLICY "Customers can insert own addresses" ON public.customer_addresses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Customers can update their own addresses
CREATE POLICY "Customers can update own addresses" ON public.customer_addresses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Customers can delete their own addresses
CREATE POLICY "Customers can delete own addresses" ON public.customer_addresses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all addresses
CREATE POLICY "Admins can read all addresses" ON public.customer_addresses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- ============================================================================
-- ORDERS RLS POLICIES (UPDATE EXISTING POLICIES)
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public submit order" ON orders;
DROP POLICY IF EXISTS "Public modify orders" ON orders;

-- Customers can read their own orders
CREATE POLICY "Customers can read own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous read for backward compatibility (WhatsApp orders)
CREATE POLICY "Public can read orders" ON orders
  FOR SELECT TO anon
  USING (true);

-- Customers can insert their own orders
CREATE POLICY "Customers can insert own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous insert for backward compatibility (WhatsApp orders)
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT TO anon
  WITH CHECK (true);

-- Customers can update limited fields (notes, etc.) but NOT totals/status
CREATE POLICY "Customers can update own orders" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent modification of critical fields
    total_amount = (SELECT total_amount FROM orders WHERE id = orders.id) AND
    payment_status = (SELECT payment_status FROM orders WHERE id = orders.id) AND
    order_status = (SELECT order_status FROM orders WHERE id = orders.id) AND
    user_id = (SELECT user_id FROM orders WHERE id = orders.id)
  );

-- Admins can read all orders
CREATE POLICY "Admins can read all orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    ) OR user_id IS NULL  -- Can also see WhatsApp orders
  );

-- Admins can update all order fields
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- ============================================================================
-- 8. CREATE FUNCTION TO ENSURE ONLY ONE DEFAULT ADDRESS PER USER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting is_default to true, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON public.customer_addresses;
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_address();

-- ============================================================================
-- 9. CREATE FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, role)
  VALUES (NEW.id, NEW.phone, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth.users (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration:
-- 1. Creates public.profiles table linked to auth.users
-- 2. Creates customer_addresses table for address management
-- 3. Extends orders table with user_id and shipping address snapshots
-- 4. Adds proper RLS policies for customer data isolation
-- 5. Implements role-based access control (customer/employee/admin)
-- 6. Preserves existing WhatsApp order functionality
-- 7. Auto-creates profiles on phone OTP signup
-- 8. Ensures shipping addresses are preserved in order snapshots
-- ============================================================================