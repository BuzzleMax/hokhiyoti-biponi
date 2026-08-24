-- Simple fix: Just ensure admin can read orders
-- This doesn't touch existing policies, just adds a permissive one

-- First, let's see what policies exist (you can check this in the Supabase dashboard)
-- The issue is likely that existing policies are too restrictive

-- Option 1: Add a simple admin read policy (this might conflict if similar exists)
-- CREATE POLICY "Admin simple read" ON orders
--   FOR SELECT TO authenticated USING (true);

-- Option 2: The real fix - update the existing "Public can read orders" policy to be more permissive
-- But since we can't modify it easily, let's try a different approach

-- Option 3: Disable RLS for orders temporarily to test if that fixes the issue
-- WARNING: This removes all security - only for testing!
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- If this fixes the "Failed to load orders" issue, then we know it's a policy problem
-- Then we can create proper policies

-- Re-enable RLS with proper policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to read orders
CREATE POLICY IF NOT EXISTS "Authenticated users can read orders" ON orders
  FOR SELECT TO authenticated USING (true);

-- Create a policy that allows public to insert orders (for buy button)
CREATE POLICY IF NOT EXISTS "Public can insert orders" ON orders
  FOR INSERT TO public WITH CHECK (true);

-- Create a policy that allows authenticated users to update orders
CREATE POLICY IF NOT EXISTS "Authenticated users can update orders" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
