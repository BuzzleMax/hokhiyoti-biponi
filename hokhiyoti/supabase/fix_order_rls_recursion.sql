-- ============================================================================
-- SUPABASE MIGRATION: Fix RLS Recursion & Public WhatsApp Order Creation
-- Project: Hokhiyoti Biponi
-- File: supabase/fix_order_rls_recursion.sql
-- ============================================================================

-- 1. Create order ID sequence starting at 1042 if not exists
CREATE SEQUENCE IF NOT EXISTS order_id_seq START WITH 1042;

-- 2. Ensure orders table has all required columns
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id TEXT UNIQUE,
  order_number TEXT UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  seller_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  customer_name TEXT DEFAULT 'WhatsApp Customer',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT,
  customer_address TEXT,
  selected_colour TEXT,
  selected_size TEXT,
  product_url TEXT,
  customer_details JSONB DEFAULT '{}'::jsonb,
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  order_status TEXT NOT NULL DEFAULT 'Confirmed',
  commission_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  reference_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  admin_note TEXT,
  whatsapp_message_sent BOOLEAN DEFAULT TRUE,
  whatsapp_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add missing columns to existing orders table if it already exists
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_name TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_price DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 10.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_earnings DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'WhatsApp Customer';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_colour TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_size TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_url TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_details JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Confirmed';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_number TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_message_sent BOOLEAN DEFAULT TRUE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Relax check constraint on order_status to support case variations
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (
  order_status IN (
    'Confirmed', 'confirmed',
    'Paid', 'paid',
    'Completed', 'completed',
    'Cancelled', 'cancelled',
    'archived', 'lead_created', 'customer_contacted', 'processing', 'pending', 'rejected'
  )
);

-- Backfill order_id if missing
UPDATE orders
SET order_id = COALESCE(order_number, 'HOK-' || nextval('order_id_seq')::text)
WHERE order_id IS NULL OR order_id = '';

UPDATE orders
SET order_number = order_id
WHERE order_number IS NULL OR order_number = '';

-- 3. Trigger for Automatic Order ID Generation (HOK-XXXX)
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate unique Order ID e.g. HOK-1042 if not provided
  IF NEW.order_id IS NULL OR NEW.order_id = '' THEN
    NEW.order_id := 'HOK-' || nextval('order_id_seq')::text;
  END IF;

  -- Keep order_number in sync with order_id
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := NEW.order_id;
  END IF;

  -- Keep selling_price and product_price in sync
  IF NEW.selling_price IS NULL OR NEW.selling_price = 0.00 THEN
    IF NEW.product_price IS NOT NULL AND NEW.product_price > 0 THEN
      NEW.selling_price := NEW.product_price;
    END IF;
  END IF;

  IF NEW.product_price IS NULL OR NEW.product_price = 0.00 THEN
    IF NEW.selling_price IS NOT NULL AND NEW.selling_price > 0 THEN
      NEW.product_price := NEW.selling_price;
    END IF;
  END IF;

  -- Ensure commission rate default
  IF NEW.commission_rate IS NULL OR NEW.commission_rate = 0.00 THEN
    NEW.commission_rate := COALESCE(NEW.commission_percentage, 10.00);
  END IF;
  NEW.commission_percentage := NEW.commission_rate;

  -- Zero commission for Cancelled orders
  IF NEW.order_status = 'Cancelled' OR NEW.order_status = 'cancelled' THEN
    NEW.commission_amount := 0.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_order_id ON orders;
CREATE TRIGGER trg_generate_order_id
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_id();

-- 4. Owner Commission Payments Table
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 5. Safe SECURITY DEFINER helper function for checking admin/owner status
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  v_target_id UUID;
  v_is_admin BOOLEAN := false;
BEGIN
  v_target_id := COALESCE(user_id, auth.uid());
  IF v_target_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check admin_profiles table if it exists (bypasses RLS due to SECURITY DEFINER)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_profiles'
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.admin_profiles 
      WHERE id = v_target_id AND (active IS TRUE OR active IS NULL)
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
      RETURN true;
    END IF;
  END IF;

  -- Check profiles table (bypasses RLS due to SECURITY DEFINER)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_target_id AND (
        role IN ('admin', 'employee') OR
        (is_admin IS TRUE)
      )
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated, anon;

-- 6. Fix public.profiles RLS policies (removing recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Customers can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;

CREATE POLICY "Customers can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 7. Fix orders RLS policies (no recursion, strict admin read/write, public insert)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can view orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Public can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated delete orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- Anyone (public/anon or logged in) can create an order record
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT TO public WITH CHECK (true);

-- ONLY authenticated admin/owner users can view orders
CREATE POLICY "Admins can view orders" ON orders
  FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- ONLY authenticated admin/owner users can update orders
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- ONLY authenticated admin/owner users can delete orders
CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- 8. Fix commission_payments RLS policies
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage commission payments" ON commission_payments;

CREATE POLICY "Admins can manage commission payments" ON commission_payments
  FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 9. Create SECURITY DEFINER RPC function for Public WhatsApp Order Creation
CREATE OR REPLACE FUNCTION public.create_public_order(order_data JSONB)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  INSERT INTO public.orders (
    product_id,
    product_name,
    product_price,
    selling_price,
    commission_rate,
    commission_percentage,
    commission_amount,
    seller_earnings,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    selected_colour,
    selected_size,
    product_url,
    customer_details,
    order_status,
    commission_status,
    payment_status,
    total_amount,
    whatsapp_message_sent,
    whatsapp_message_at,
    order_id,
    order_number
  ) VALUES (
    (order_data->>'product_id')::UUID,
    COALESCE(order_data->>'product_name', 'Handloom Piece'),
    COALESCE((order_data->>'product_price')::DECIMAL, 0.00),
    COALESCE((order_data->>'selling_price')::DECIMAL, COALESCE((order_data->>'product_price')::DECIMAL, 0.00)),
    COALESCE((order_data->>'commission_rate')::DECIMAL, 10.00),
    COALESCE((order_data->>'commission_percentage')::DECIMAL, 10.00),
    COALESCE((order_data->>'commission_amount')::DECIMAL, 0.00),
    COALESCE((order_data->>'seller_earnings')::DECIMAL, 0.00),
    COALESCE(order_data->>'customer_name', 'WhatsApp Customer'),
    COALESCE(order_data->>'customer_phone', ''),
    order_data->>'customer_email',
    order_data->>'customer_address',
    order_data->>'selected_colour',
    order_data->>'selected_size',
    order_data->>'product_url',
    COALESCE(order_data->'customer_details', '{}'::jsonb),
    COALESCE(order_data->>'order_status', 'Confirmed'),
    COALESCE(order_data->>'commission_status', 'pending'),
    COALESCE(order_data->>'payment_status', 'pending'),
    COALESCE((order_data->>'total_amount')::DECIMAL, COALESCE((order_data->>'selling_price')::DECIMAL, 0.00)),
    COALESCE((order_data->>'whatsapp_message_sent')::BOOLEAN, true),
    NOW(),
    order_data->>'order_id',
    order_data->>'order_number'
  )
  RETURNING to_jsonb(orders.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_public_order(JSONB) TO anon, authenticated;
