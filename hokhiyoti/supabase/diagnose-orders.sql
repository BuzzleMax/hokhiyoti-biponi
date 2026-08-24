-- Diagnostic script to check orders table and policies
-- Run this to see what's currently configured

-- Check if orders table exists and has data
SELECT 
  COUNT(*) as total_orders,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM orders;

-- Show sample orders (if any)
SELECT 
  id,
  order_id,
  order_number,
  product_name,
  order_status,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'orders';

-- Show all existing policies on orders table
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
WHERE tablename = 'orders';

-- Check if admin_profiles table exists and has data
SELECT COUNT(*) as admin_count FROM admin_profiles;
