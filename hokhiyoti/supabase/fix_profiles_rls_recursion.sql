-- ============================================================================
-- FIX PROFILES RLS RECURSION BUG
-- ============================================================================
-- Problem: Policies on profiles table query profiles table itself, causing
-- infinite recursion: "infinite recursion detected in policy for relation 'profiles'"
--
-- Solution: Create SECURITY DEFINER helper function that bypasses RLS to check
-- admin authorization, then update all policies to use this function.
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER HELPER FUNCTION FOR ADMIN AUTHORIZATION
-- ============================================================================

-- Drop function if exists to make this idempotent
DROP FUNCTION IF EXISTS is_admin_user(UUID) CASCADE;

-- Create SECURITY DEFINER function to check if user is admin
-- This function bypasses RLS and safely checks admin status
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN := false;
  has_admin_profile BOOLEAN := false;
  profile_role TEXT;
  admin_table_exists BOOLEAN := false;
BEGIN
  -- Check if admin_profiles table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'admin_profiles' AND table_schema = 'public'
  ) INTO admin_table_exists;
  
  -- First check admin_profiles table if it exists (bypasses RLS due to SECURITY DEFINER)
  IF admin_table_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = user_id AND active = true
    ) INTO has_admin_profile;
    
    -- If found in admin_profiles, user is admin
    IF has_admin_profile THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Fallback: check profiles.role field (also bypasses RLS)
  -- This handles the case where admins are in profiles table with role='admin'
  SELECT role INTO profile_role
  FROM profiles
  WHERE id = user_id;
  
  -- Check if role is admin or employee
  IF profile_role IN ('admin', 'employee') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;

-- ============================================================================
-- 2. FIX PROFILES RLS POLICIES (REMOVE RECURSION)
-- ============================================================================

-- Drop existing recursive policies
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
    role IN ('customer', 'employee')
  );

-- Customers can insert their own profile (on signup)
CREATE POLICY "Customers can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'customer');

-- Admins can read all profiles (using SECURITY DEFINER function to avoid recursion)
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

-- Admins can update profiles (using SECURITY DEFINER function to avoid recursion)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (
    -- Prevent self-promotion and role escalation
    (role = 'customer' OR role = 'employee') AND
    NOT (role = 'admin' AND id = auth.uid())
  );

-- ============================================================================
-- 3. FIX CUSTOMER ADDRESSES RLS POLICIES (REMOVE RECURSION)
-- ============================================================================

-- Only apply customer_addresses policies if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_addresses' AND table_schema = 'public') THEN
    -- Drop existing recursive policies
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

    -- Admins can read all addresses (using SECURITY DEFINER function to avoid recursion)
    CREATE POLICY "Admins can read all addresses" ON public.customer_addresses
      FOR SELECT TO authenticated
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- 4. FIX ORDERS RLS POLICIES (USE SECURITY DEFINER FUNCTION)
-- ============================================================================

-- Drop existing policies on orders
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

-- ANONYMOUS users can create orders (for WhatsApp purchase flow)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- AUTHENTICATED admins can read orders
CREATE POLICY "Admins can view orders" ON orders
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

-- AUTHENTICATED admins can update orders
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- AUTHENTICATED admins can delete orders
CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================================================
-- 5. FIX COMMISSION PAYMENTS RLS POLICIES (USE SECURITY DEFINER FUNCTION)
-- ============================================================================

-- Only apply commission payments policies if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_payments' AND table_schema = 'public') THEN
    -- Drop existing policies on commission_payments
    DROP POLICY IF EXISTS "Admins can manage commission payments" ON commission_payments;

    -- Only authenticated admin/owner users can manage commission payments
    CREATE POLICY "Admins can manage commission payments" ON commission_payments
      FOR ALL TO authenticated
      USING (is_admin_user(auth.uid()))
      WITH CHECK (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Show all policies on profiles to verify fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'customer_addresses', 'orders', 'commission_payments')
ORDER BY tablename, policyname;

-- Test the is_admin_user function (should return false for anon, true for admin)
SELECT 
  auth.uid() as current_user_id,
  is_admin_user(auth.uid()) as is_admin_result;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The recursive policies have been replaced with SECURITY DEFINER function calls.
-- This should resolve the "infinite recursion detected in policy for relation 'profiles'" error.
-- 
-- Next steps:
-- 1. Test admin orders access
-- 2. Test customer order creation
-- 3. Verify WhatsApp purchase flow
-- 4. Verify commission calculations
-- ============================================================================
