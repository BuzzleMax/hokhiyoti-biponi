-- ============================================================================
-- SUPABASE MIGRATION: Orders Search, Status Transition & Commission Snapshot System
-- File: supabase/fix_orders_search_status_commission.sql
-- ============================================================================

-- 1. Create order ID sequence starting at 1042 if not already existing
CREATE SEQUENCE IF NOT EXISTS order_id_seq START WITH 1042;

-- 2. Ensure marketplace_settings table exists and has proper defaults
CREATE TABLE IF NOT EXISTS marketplace_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_percentage DECIMAL(5, 2) DEFAULT 10.00 NOT NULL,
  default_commission_percentage DECIMAL(5, 2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS on marketplace_settings allows read/write for system operation
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read marketplace_settings" ON marketplace_settings;
DROP POLICY IF EXISTS "Public modify marketplace_settings" ON marketplace_settings;
DROP POLICY IF EXISTS "Admins can manage marketplace_settings" ON marketplace_settings;

CREATE POLICY "Public read marketplace_settings" ON marketplace_settings FOR SELECT TO public USING (true);
CREATE POLICY "Public modify marketplace_settings" ON marketplace_settings FOR ALL TO public USING (true);

-- Insert default row if marketplace_settings is empty
INSERT INTO marketplace_settings (commission_percentage, default_commission_percentage)
SELECT 10.00, 10.00
WHERE NOT EXISTS (SELECT 1 FROM marketplace_settings);

-- 3. Ensure orders table columns exist
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_price DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 10.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_earnings DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Confirmed';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Create trigger function for automatic order_id generation, status normalization, and commission snapshotting
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
DECLARE
  v_comm_rate DECIMAL(5, 2);
  v_raw_status TEXT;
BEGIN
  -- Generate unique Order ID e.g. HOK-1042 if not provided
  IF NEW.order_id IS NULL OR NEW.order_id = '' THEN
    NEW.order_id := 'HOK-' || nextval('order_id_seq')::text;
  END IF;

  -- Keep order_number in sync with order_id
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := NEW.order_id;
  END IF;

  -- Normalize order_status to exact allowed strings: 'Confirmed', 'Paid', 'Completed', 'Cancelled'
  v_raw_status := COALESCE(NEW.order_status, 'Confirmed');
  IF LOWER(v_raw_status) IN ('confirmed', 'lead_created', 'customer_contacted', 'processing', 'pending') THEN
    NEW.order_status := 'Confirmed';
  ELSIF LOWER(v_raw_status) IN ('paid', 'packed', 'shipped') THEN
    NEW.order_status := 'Paid';
  ELSIF LOWER(v_raw_status) IN ('completed', 'delivered') THEN
    NEW.order_status := 'Completed';
  ELSIF LOWER(v_raw_status) IN ('cancelled', 'rejected', 'archived') THEN
    NEW.order_status := 'Cancelled';
  ELSE
    NEW.order_status := 'Confirmed';
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

  -- Fetch active commission rate snapshot if commission_rate is missing or 0
  IF NEW.commission_rate IS NULL OR NEW.commission_rate = 0.00 THEN
    SELECT COALESCE(commission_percentage, default_commission_percentage, 10.00)
    INTO v_comm_rate
    FROM marketplace_settings
    ORDER BY created_at DESC
    LIMIT 1;

    NEW.commission_rate := COALESCE(NEW.commission_percentage, v_comm_rate, 10.00);
  END IF;
  NEW.commission_percentage := NEW.commission_rate;

  -- Calculate commission amount and seller earnings
  IF NEW.order_status = 'Cancelled' THEN
    NEW.commission_amount := 0.00;
  ELSE
    NEW.commission_amount := ROUND((NEW.selling_price * (NEW.commission_rate / 100.0)), 2);
  END IF;

  NEW.seller_earnings := NEW.selling_price - NEW.commission_amount;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_order_id ON orders;
CREATE TRIGGER trg_generate_order_id
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_id();

-- 5. Update RPC function public.create_public_order(JSONB) for WhatsApp order creation
CREATE OR REPLACE FUNCTION public.create_public_order(order_data JSONB)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_comm_rate DECIMAL(5, 2);
  v_selling_price DECIMAL(10, 2);
  v_comm_amount DECIMAL(10, 2);
  v_seller_earnings DECIMAL(10, 2);
  v_status TEXT;
  v_order_id TEXT;
BEGIN
  -- Get active commission rate snapshot from settings if not supplied in payload
  IF order_data->>'commission_rate' IS NOT NULL AND (order_data->>'commission_rate')::DECIMAL > 0 THEN
    v_comm_rate := (order_data->>'commission_rate')::DECIMAL;
  ELSIF order_data->>'commission_percentage' IS NOT NULL AND (order_data->>'commission_percentage')::DECIMAL > 0 THEN
    v_comm_rate := (order_data->>'commission_percentage')::DECIMAL;
  ELSE
    SELECT COALESCE(commission_percentage, default_commission_percentage, 10.00)
    INTO v_comm_rate
    FROM marketplace_settings
    ORDER BY created_at DESC
    LIMIT 1;
    v_comm_rate := COALESCE(v_comm_rate, 10.00);
  END IF;

  v_selling_price := COALESCE((order_data->>'selling_price')::DECIMAL, COALESCE((order_data->>'product_price')::DECIMAL, 0.00));
  
  v_status := COALESCE(order_data->>'order_status', 'Confirmed');
  IF LOWER(v_status) IN ('confirmed', 'lead_created', 'customer_contacted', 'processing', 'pending') THEN
    v_status := 'Confirmed';
  ELSIF LOWER(v_status) IN ('paid', 'packed', 'shipped') THEN
    v_status := 'Paid';
  ELSIF LOWER(v_status) IN ('completed', 'delivered') THEN
    v_status := 'Completed';
  ELSIF LOWER(v_status) IN ('cancelled', 'rejected', 'archived') THEN
    v_status := 'Cancelled';
  ELSE
    v_status := 'Confirmed';
  END IF;

  IF v_status = 'Cancelled' THEN
    v_comm_amount := 0.00;
  ELSE
    v_comm_amount := ROUND((v_selling_price * (v_comm_rate / 100.0)), 2);
  END IF;

  v_seller_earnings := v_selling_price - v_comm_amount;

  v_order_id := COALESCE(order_data->>'order_id', order_data->>'order_number');
  IF v_order_id IS NULL OR v_order_id = '' THEN
    v_order_id := 'HOK-' || nextval('order_id_seq')::text;
  END IF;

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
    v_selling_price,
    v_selling_price,
    v_comm_rate,
    v_comm_rate,
    v_comm_amount,
    v_seller_earnings,
    COALESCE(order_data->>'customer_name', 'WhatsApp Customer'),
    COALESCE(order_data->>'customer_phone', ''),
    order_data->>'customer_email',
    order_data->>'customer_address',
    order_data->>'selected_colour',
    order_data->>'selected_size',
    order_data->>'product_url',
    COALESCE(order_data->'customer_details', '{}'::jsonb),
    v_status,
    CASE WHEN v_status = 'Completed' THEN 'earned' WHEN v_status = 'Cancelled' THEN 'cancelled' ELSE 'pending' END,
    CASE WHEN v_status IN ('Paid', 'Completed') THEN 'paid' ELSE 'pending' END,
    v_selling_price,
    COALESCE((order_data->>'whatsapp_message_sent')::BOOLEAN, true),
    NOW(),
    v_order_id,
    v_order_id
  )
  RETURNING to_jsonb(orders.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_public_order(JSONB) TO anon, authenticated;

-- 6. Backfill and normalize existing orders in database
UPDATE orders
SET order_id = 'HOK-' || nextval('order_id_seq')::text
WHERE order_id IS NULL OR order_id = '';

UPDATE orders
SET order_number = order_id
WHERE order_number IS NULL OR order_number = '';

UPDATE orders
SET order_status = CASE
  WHEN LOWER(order_status) IN ('confirmed', 'lead_created', 'customer_contacted', 'processing', 'pending') THEN 'Confirmed'
  WHEN LOWER(order_status) IN ('paid', 'packed', 'shipped') THEN 'Paid'
  WHEN LOWER(order_status) IN ('completed', 'delivered') THEN 'Completed'
  WHEN LOWER(order_status) IN ('cancelled', 'rejected', 'archived') THEN 'Cancelled'
  ELSE 'Confirmed'
END;

UPDATE orders
SET selling_price = product_price
WHERE (selling_price IS NULL OR selling_price = 0.00) AND product_price > 0.00;

UPDATE orders
SET commission_rate = COALESCE(commission_percentage, 10.00)
WHERE commission_rate IS NULL OR commission_rate = 0.00;

UPDATE orders
SET commission_percentage = commission_rate;

UPDATE orders
SET commission_amount = CASE
  WHEN order_status = 'Cancelled' THEN 0.00
  ELSE ROUND((selling_price * (commission_rate / 100.0)), 2)
END;

UPDATE orders
SET seller_earnings = selling_price - commission_amount;

-- 7. Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
