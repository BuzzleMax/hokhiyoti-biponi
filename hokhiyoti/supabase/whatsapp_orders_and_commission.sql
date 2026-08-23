-- ============================================================================
-- SUPABASE MIGRATION: WhatsApp Orders and Commission Tracking System
-- Project: Hokhiyoti Biponi
-- ============================================================================

-- 1. Create order ID sequence starting at 1042
CREATE SEQUENCE IF NOT EXISTS order_id_seq START WITH 1042;

-- 2. Ensure orders table contains all required columns
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
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill pre-existing order rows so every order has a valid unique order_id
UPDATE orders
SET order_id = COALESCE(order_number, 'HOK-' || nextval('order_id_seq')::text)
WHERE order_id IS NULL OR order_id = '';

UPDATE orders
SET order_number = order_id
WHERE order_number IS NULL OR order_number = '';

-- 3. Automatic Order ID Generation and Sync Trigger
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

-- 5. Indexes for fast filtering and dashboard aggregation
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_commission_payments_payment_date ON commission_payments(payment_date);

-- 6. Row Level Security (RLS) Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- Anyone placing a purchase order via WhatsApp can create an order record
DROP POLICY IF EXISTS "Public can create orders" ON orders;
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin/owner users can view orders
DROP POLICY IF EXISTS "Admins can view orders" ON orders;
CREATE POLICY "Admins can view orders" ON orders
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    )
  );

-- Only authenticated admin/owner users can update orders
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    )
  );

-- Only authenticated admin/owner users can delete orders
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    )
  );

-- Only authenticated admin/owner users can manage commission payments
DROP POLICY IF EXISTS "Admins can manage commission payments" ON commission_payments;
CREATE POLICY "Admins can manage commission payments" ON commission_payments
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    )
  );
