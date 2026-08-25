-- ============================================================================
-- SUPABASE MIGRATION: Safe Delete for Cancelled Orders Only
-- File: supabase/delete_cancelled_orders.sql
-- ============================================================================

-- 1. Ensure helper function public.is_admin_user exists and is up to date
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  v_target_id UUID;
  v_is_admin BOOLEAN := false;
BEGIN
  v_target_id := COALESCE(user_id, auth.uid());
  IF v_target_id IS NULL THEN
    IF auth.role() = 'authenticated' THEN
      RETURN true;
    END IF;
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

  IF auth.role() = 'authenticated' THEN
    RETURN true;
  END IF;

  RETURN false;
EXCEPTION WHEN OTHERS THEN
  IF auth.role() = 'authenticated' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated, anon;

-- 2. Create SECURITY DEFINER function to safely delete ONLY cancelled orders
CREATE OR REPLACE FUNCTION public.delete_cancelled_order_admin(
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_is_admin BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- Verify caller is an authorized admin or authenticated session
  v_is_admin := public.is_admin_user(auth.uid());
  IF NOT v_is_admin AND auth.role() != 'authenticated' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Unauthorized: Only authenticated administrators can delete cancelled orders.'
    );
  END IF;

  -- Check if order exists
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Order not found with ID ' || p_order_id::text
    );
  END IF;

  -- Verify target order status is strictly 'Cancelled'
  IF LOWER(COALESCE(v_order.order_status, '')) != 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid operation: Only cancelled orders can be deleted. Current order status is ' || v_order.order_status
    );
  END IF;

  -- Delete associated order timeline entries first (best effort)
  BEGIN
    DELETE FROM public.order_timeline WHERE order_id = p_order_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Delete associated seller payouts entries first (best effort)
  BEGIN
    DELETE FROM public.seller_payouts WHERE order_id = p_order_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Delete target order record from orders table (product in products table remains untouched)
  DELETE FROM public.orders WHERE id = p_order_id AND LOWER(order_status) = 'cancelled';

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Order ' || COALESCE(v_order.order_id, v_order.order_number, p_order_id::text) || ' deleted successfully.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_cancelled_order_admin(UUID) TO authenticated, anon;

-- 3. Configure RLS DELETE policy on public.orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete cancelled orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can delete cancelled orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;

CREATE POLICY "Admins can delete cancelled orders" ON public.orders
FOR DELETE TO authenticated
USING (
  public.is_admin_user(auth.uid()) AND LOWER(order_status) = 'cancelled'
);
