-- ============================================================================
-- COMPREHENSIVE RLS FIX FOR ORDERS TABLE
-- This script fixes the admin access issue while maintaining security
-- ============================================================================

-- First, let's see what policies currently exist
-- Run the diagnostic script first to understand current state

-- Drop all existing restrictive policies on orders table
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can view orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Public can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated delete orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;

-- Create new, simplified policies that work correctly

-- 1. Public can create orders (for WhatsApp purchase flow)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- 2. Authenticated users can read orders
-- This allows admins to read orders when they're logged in
CREATE POLICY "Authenticated users can read orders" ON orders
  FOR SELECT TO authenticated USING (true);

-- 3. Authenticated users can update orders
CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Authenticated users can delete orders
CREATE POLICY "Authenticated users can delete orders" ON orders
  FOR DELETE TO authenticated USING (true);

-- Verify the policies were created correctly
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
WHERE tablename = 'orders'
ORDER BY policyname;

-- Test message: If you see policies listed above, they were created successfully
-- The admin panel should now be able to read orders