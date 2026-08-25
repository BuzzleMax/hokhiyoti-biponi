-- ============================================================================
-- SUPABASE MIGRATION: Fix Admin Order Status Update & Serialization System
-- File: supabase/fix_order_status_update.sql
-- ============================================================================

-- 1. Ensure order_timeline table exists for audit history
CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by TEXT DEFAULT 'Admin',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read order_timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Public modify order_timeline" ON public.order_timeline;
CREATE POLICY "Public read order_timeline" ON public.order_timeline FOR SELECT TO public USING (true);
CREATE POLICY "Public modify order_timeline" ON public.order_timeline FOR ALL TO public USING (true);

-- 2. Create or replace SECURITY DEFINER function to update order status safely
CREATE OR REPLACE FUNCTION public.update_order_status_admin(
  p_order_id UUID,
  p_status TEXT,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_status TEXT;
  v_selling_price DECIMAL(10, 2);
  v_comm_rate DECIMAL(5, 2);
  v_comm_amount DECIMAL(10, 2);
  v_seller_earnings DECIMAL(10, 2);
  v_comm_status TEXT;
  v_pay_status TEXT;
  v_result JSONB;
BEGIN
  -- Check if order exists
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found with ID ' || p_order_id::text);
  END IF;

  -- Normalize status to Title Case exact values
  v_status := COALESCE(p_status, 'Confirmed');
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

  -- Selling price & commission rate preservation from existing order
  v_selling_price := COALESCE(v_order.selling_price, v_order.product_price, 0.00);
  v_comm_rate := COALESCE(v_order.commission_rate, v_order.commission_percentage, 10.00);

  -- Commission calculation according to business rules
  IF v_status = 'Cancelled' THEN
    v_comm_amount := 0.00;
    v_comm_status := 'cancelled';
    v_pay_status := 'pending';
  ELSIF v_status = 'Completed' THEN
    v_comm_amount := ROUND((v_selling_price * (v_comm_rate / 100.0)), 2);
    v_comm_status := 'earned';
    v_pay_status := 'paid';
  ELSIF v_status = 'Paid' THEN
    v_comm_amount := ROUND((v_selling_price * (v_comm_rate / 100.0)), 2);
    v_comm_status := 'pending';
    v_pay_status := 'paid';
  ELSE -- Confirmed
    v_comm_amount := ROUND((v_selling_price * (v_comm_rate / 100.0)), 2);
    v_comm_status := 'pending';
    v_pay_status := 'pending';
  END IF;

  v_seller_earnings := v_selling_price - v_comm_amount;

  -- Update order record
  UPDATE public.orders
  SET order_status = v_status,
      commission_amount = v_comm_amount,
      seller_earnings = v_seller_earnings,
      commission_status = v_comm_status,
      payment_status = v_pay_status,
      admin_note = COALESCE(p_admin_note, admin_note),
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- Record timeline entry (best effort)
  BEGIN
    INSERT INTO public.order_timeline (order_id, status, changed_by, note)
    VALUES (p_order_id, v_status, 'Admin', p_admin_note);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  v_result := jsonb_build_object(
    'success', true,
    'order', to_jsonb(v_order)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execution to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.update_order_status_admin(UUID, TEXT, TEXT) TO anon, authenticated;

-- 3. Ensure trigger generate_order_id correctly handles status normalization and historical rate preservation
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

  -- Normalize order_status to exact allowed Title Case strings: 'Confirmed', 'Paid', 'Completed', 'Cancelled'
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

  -- Preserve existing commission_rate if already present, otherwise fetch default snapshot
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

-- 4. Fix RLS policies on orders table safely
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public modify orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Public read orders" ON public.orders FOR SELECT TO public USING (true);
CREATE POLICY "Public create orders" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Authenticated update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 5. Safe backfill of order statuses to exact Title Case
UPDATE public.orders
SET order_status = CASE
  WHEN LOWER(order_status) IN ('confirmed', 'lead_created', 'customer_contacted', 'processing', 'pending') THEN 'Confirmed'
  WHEN LOWER(order_status) IN ('paid', 'packed', 'shipped') THEN 'Paid'
  WHEN LOWER(order_status) IN ('completed', 'delivered') THEN 'Completed'
  WHEN LOWER(order_status) IN ('cancelled', 'rejected', 'archived') THEN 'Cancelled'
  ELSE 'Confirmed'
END;
